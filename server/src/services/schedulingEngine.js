const { addDays, parseISO, isBefore, isAfter, max, min, addMinutes, format } = require('date-fns');
const { toZonedTime, fromZonedTime } = require('date-fns-tz');
const Interviewer = require('../models/Interviewer');
const Availability = require('../models/Availability');
const CalendarEvent = require('../models/CalendarEvent');
const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const { formatInTimezone, getHourInTimezone, localToUTC, doIntervalsOverlap } = require('../utils/timezone');

/**
 * Smart Scheduling Engine for Multi-Panel Interview Coordination
 */
class SmartSchedulingEngine {
  /**
   * Find common available slots for candidate & interviewers
   */
  static async findAvailableSlots({
    candidateId,
    candidate: inputCandidate,
    interviewerIds,
    durationMinutes = 60,
    startDate,
    endDate,
    bufferMinutes = 15,
    candidateTimezone,
    stepMinutes = 30, // Granularity of slot sliding window
  }) {
    // 1. Fetch Candidate details
    let candidate = inputCandidate;
    if (!candidate && candidateId) {
      candidate = await Candidate.findById(candidateId);
    }
    const cTz = candidateTimezone || (candidate ? candidate.timezone : 'America/New_York');

    // 2. Fetch Interviewers
    const interviewers = await Interviewer.find({
      _id: { $in: interviewerIds },
      isActive: true,
    });

    if (interviewers.length === 0) {
      throw new Error('No active interviewers found for the selected IDs');
    }

    // 3. Fetch Availabilities for each interviewer
    const availabilities = await Availability.find({
      interviewer: { $in: interviewerIds },
    });
    const availabilityMap = new Map();
    availabilities.forEach((a) => availabilityMap.set(a.interviewer.toString(), a));

    // 4. Parse Date Range
    const start = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate);
    const end = typeof endDate === 'string' ? parseISO(endDate) : new Date(endDate);

    if (isAfter(start, end)) {
      throw new Error('startDate cannot be after endDate');
    }

    // 5. Query all calendar events & scheduled interviews in the entire date window
    const windowStartUTC = new Date(start);
    windowStartUTC.setUTCHours(0, 0, 0, 0);
    const windowEndUTC = new Date(end);
    windowEndUTC.setUTCHours(23, 59, 59, 999);

    const [calendarEvents, scheduledInterviews] = await Promise.all([
      CalendarEvent.find({
        interviewer: { $in: interviewerIds },
        isBusy: true,
        startTime: { $lt: windowEndUTC },
        endTime: { $gt: windowStartUTC },
      }),
      Interview.find({
        'interviewers.interviewer': { $in: interviewerIds },
        status: { $in: ['scheduled', 'in_progress', 'rescheduled'] },
        scheduledStartTime: { $lt: windowEndUTC },
        scheduledEndTime: { $gt: windowStartUTC },
      }),
    ]);

    // Group busy blocks by interviewerId
    const busyBlocksByInterviewer = new Map();
    interviewers.forEach((inv) => busyBlocksByInterviewer.set(inv._id.toString(), []));

    // Add calendar events
    calendarEvents.forEach((ev) => {
      const invId = ev.interviewer.toString();
      if (busyBlocksByInterviewer.has(invId)) {
        busyBlocksByInterviewer.get(invId).push({
          start: new Date(ev.startTime),
          end: new Date(ev.endTime),
          title: ev.title || 'Busy Event',
          source: ev.source,
        });
      }
    });

    // Add existing scheduled interviews
    scheduledInterviews.forEach((interview) => {
      interview.interviewers.forEach((p) => {
        const invId = p.interviewer.toString();
        if (busyBlocksByInterviewer.has(invId)) {
          busyBlocksByInterviewer.get(invId).push({
            start: new Date(interview.scheduledStartTime),
            end: new Date(interview.scheduledEndTime),
            title: `Interview: ${interview.title}`,
            source: 'interview',
          });
        }
      });
    });

    const commonSlots = [];
    const nearMissAlternativeSlots = [];
    const conflictWarnings = [];

    // 6. Iterate through each day in the date range
    let currentDay = new Date(start);
    while (isBefore(currentDay, end) || currentDay.toDateString() === end.toDateString()) {
      const dateStr = format(currentDay, 'yyyy-MM-dd');
      const dayOfWeek = currentDay.getDay(); // 0 = Sun, 1 = Mon ...

      // For this day, find free intervals for each interviewer
      const interviewerFreeWindows = [];

      for (const interviewer of interviewers) {
        const invId = interviewer._id.toString();
        const invTz = interviewer.timezone || 'America/Los_Angeles';
        const buffer = interviewer.bufferTimeMinutes || bufferMinutes || 15;

        // Retrieve availability rule
        const avail = availabilityMap.get(invId);
        let dailySlots = [];

        // Check if override exists for this date
        const override = avail?.overrides?.find((o) => o.date === dateStr);
        if (override) {
          if (override.isUnavailable) {
            conflictWarnings.push({
              interviewerId: invId,
              interviewerName: interviewer.name,
              date: dateStr,
              reason: override.reason || 'Marked unavailable for date',
            });
            dailySlots = [];
          } else {
            dailySlots = override.slots || [];
          }
        } else {
          // Check regular weekly schedule
          const daySched = avail?.weeklySchedule?.find((s) => s.dayOfWeek === dayOfWeek);
          if (daySched && daySched.isAvailable) {
            dailySlots = daySched.slots || [];
          } else if (!avail) {
            // Default 9am - 5pm working hours Mon-Fri if no record
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              dailySlots = [{ startTime: '09:00', endTime: '17:00' }];
            }
          }
        }

        // Convert interviewer's daily slots into UTC intervals
        let freeIntervals = dailySlots.map((slot) => {
          const startUTC = localToUTC(dateStr, slot.startTime, invTz);
          const endUTC = localToUTC(dateStr, slot.endTime, invTz);
          return { start: startUTC, end: endUTC };
        });

        // Subtract interviewer's busy events (with buffer)
        const busyEvents = busyBlocksByInterviewer.get(invId) || [];
        for (const busy of busyEvents) {
          // Expand busy interval by buffer
          const busyWithBufferStart = addMinutes(busy.start, -buffer);
          const busyWithBufferEnd = addMinutes(busy.end, buffer);

          const updatedFree = [];
          for (const free of freeIntervals) {
            // Check if busy block intersects with this free interval
            if (isBefore(busyWithBufferStart, free.end) && isAfter(busyWithBufferEnd, free.start)) {
              // Left remainder
              if (isBefore(free.start, busyWithBufferStart)) {
                updatedFree.push({ start: free.start, end: busyWithBufferStart });
              }
              // Right remainder
              if (isAfter(free.end, busyWithBufferEnd)) {
                updatedFree.push({ start: busyWithBufferEnd, end: free.end });
              }
            } else {
              // No overlap
              updatedFree.push(free);
            }
          }
          freeIntervals = updatedFree.filter(
            (i) => (i.end.getTime() - i.start.getTime()) >= durationMinutes * 60 * 1000
          );
        }

        interviewerFreeWindows.push({
          interviewer,
          freeIntervals,
        });
      }

      // 7. Find intersection of free intervals across ALL interviewers
      if (interviewerFreeWindows.length > 0) {
        let intersection = [...interviewerFreeWindows[0].freeIntervals];

        for (let i = 1; i < interviewerFreeWindows.length; i++) {
          const nextWindows = interviewerFreeWindows[i].freeIntervals;
          const newIntersection = [];

          for (const intA of intersection) {
            for (const intB of nextWindows) {
              const maxStart = max([intA.start, intB.start]);
              const minEnd = min([intA.end, intB.end]);

              if (isBefore(maxStart, minEnd)) {
                const diffMin = (minEnd.getTime() - maxStart.getTime()) / (60 * 1000);
                if (diffMin >= durationMinutes) {
                  newIntersection.push({ start: maxStart, end: minEnd });
                }
              }
            }
          }
          intersection = newIntersection;
        }

        // 8. Generate granular slots from intersection using sliding window
        for (const interval of intersection) {
          let slotStart = new Date(interval.start);
          while (true) {
            const slotEnd = addMinutes(slotStart, durationMinutes);
            if (isAfter(slotEnd, interval.end)) break;

            // Evaluate slot in candidate's local timezone
            const candidateHour = getHourInTimezone(slotStart, cTz);

            // Check candidate reasonable hours (e.g., 08:00 to 20:00)
            const isReasonableCandidateHours = candidateHour >= 8 && candidateHour < 20;

            // Calculate Scoring & Ranking
            const scoreDetails = this.calculateSlotScore({
              slotStart,
              slotEnd,
              interviewers,
              candidateHour,
              candidatePreferences: candidate?.preferredTimesOfDay || ['any'],
            });

            const slotItem = {
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              durationMinutes,
              date: dateStr,
              score: scoreDetails.totalScore,
              rankingCategory: scoreDetails.category, // 'Optimal' | 'Good' | 'Acceptable'
              scoringReasons: scoreDetails.reasons,
              candidateLocalTime: {
                timezone: cTz,
                formatted: formatInTimezone(slotStart, cTz, 'EEE, MMM d, yyyy h:mm a zzz'),
                startTimeStr: formatInTimezone(slotStart, cTz, 'h:mm a zzz'),
                isBusinessHours: isReasonableCandidateHours,
              },
              interviewerLocalTimes: interviewers.map((inv) => {
                const iTz = inv.timezone || 'America/Los_Angeles';
                return {
                  interviewerId: inv._id,
                  name: inv.name,
                  timezone: iTz,
                  formatted: formatInTimezone(slotStart, iTz, 'h:mm a zzz'),
                };
              }),
            };

            commonSlots.push(slotItem);

            // Step forward
            slotStart = addMinutes(slotStart, stepMinutes);
          }
        }

        // 9. Find Alternative Near-Miss Slots (where N-1 interviewers are free)
        if (interviewers.length > 1 && intersection.length === 0) {
          for (let skipIdx = 0; skipIdx < interviewers.length; skipIdx++) {
            const subsetWindows = interviewerFreeWindows.filter((_, idx) => idx !== skipIdx);
            const blockedInterviewer = interviewers[skipIdx];

            let subIntersection = [...subsetWindows[0].freeIntervals];
            for (let i = 1; i < subsetWindows.length; i++) {
              const nextWins = subsetWindows[i].freeIntervals;
              const nextSubInt = [];
              for (const a of subIntersection) {
                for (const b of nextWins) {
                  const s = max([a.start, b.start]);
                  const e = min([a.end, b.end]);
                  if (isBefore(s, e) && (e.getTime() - s.getTime()) >= durationMinutes * 60 * 1000) {
                    nextSubInt.push({ start: s, end: e });
                  }
                }
              }
              subIntersection = nextSubInt;
            }

            if (subIntersection.length > 0) {
              const altStart = subIntersection[0].start;
              const altEnd = addMinutes(altStart, durationMinutes);
              nearMissAlternativeSlots.push({
                startTime: altStart.toISOString(),
                endTime: altEnd.toISOString(),
                durationMinutes,
                date: dateStr,
                blockedInterviewer: {
                  id: blockedInterviewer._id,
                  name: blockedInterviewer.name,
                  reason: 'Conflict with existing calendar event or non-working hours',
                },
                availableInterviewers: subsetWindows.map((sw) => ({
                  id: sw.interviewer._id,
                  name: sw.interviewer.name,
                })),
                suggestion: `Free for ${subsetWindows.length} of ${interviewers.length} interviewers if ${blockedInterviewer.name} is substituted.`,
              });
            }
          }
        }
      }

      currentDay = addDays(currentDay, 1);
    }

    // 10. Sort commonSlots by score descending, then by time
    commonSlots.sort((a, b) => b.score - a.score || new Date(a.startTime) - new Date(b.startTime));

    // Top recommended slots
    const recommendedSlots = commonSlots.slice(0, 5);

    return {
      success: true,
      totalSlotsFound: commonSlots.length,
      candidate: candidate ? { id: candidate._id, name: candidate.name, timezone: cTz } : null,
      interviewersCount: interviewers.length,
      recommendedSlots,
      commonSlots,
      conflictWarnings,
      alternativeSlots: nearMissAlternativeSlots.slice(0, 5),
    };
  }

  /**
   * Slot scoring heuristic (0-100)
   */
  static calculateSlotScore({ slotStart, slotEnd, interviewers, candidateHour, candidatePreferences }) {
    let score = 70; // baseline
    const reasons = [];

    // Candidate preference alignment
    const isMorning = candidateHour >= 9 && candidateHour < 12;
    const isAfternoon = candidateHour >= 12 && candidateHour < 17;
    const isEvening = candidateHour >= 17 && candidateHour < 20;

    if (candidatePreferences.includes('morning') && isMorning) {
      score += 15;
      reasons.push('Matches candidate morning preference');
    } else if (candidatePreferences.includes('afternoon') && isAfternoon) {
      score += 15;
      reasons.push('Matches candidate afternoon preference');
    } else if (candidatePreferences.includes('any')) {
      score += 5;
    }

    // Interviewer working hour sweet-spot (10:00 - 16:00 is prime energy time across timezones)
    let allInPrimeHours = true;
    for (const inv of interviewers) {
      const invHour = getHourInTimezone(slotStart, inv.timezone || 'America/Los_Angeles');
      if (invHour < 10 || invHour >= 16) {
        allInPrimeHours = false;
      }
    }

    if (allInPrimeHours) {
      score += 15;
      reasons.push('Optimal energy window (10am - 4pm) for all interviewers');
    }

    // Penalty for early morning or late evening for candidate
    if (candidateHour < 9) {
      score -= 15;
      reasons.push('Early morning for candidate');
    } else if (candidateHour >= 18) {
      score -= 10;
      reasons.push('Late evening for candidate');
    }

    // Clamp score between 10 and 100
    const totalScore = Math.min(100, Math.max(10, score));

    let category = 'Acceptable';
    if (totalScore >= 85) category = 'Optimal';
    else if (totalScore >= 70) category = 'Good';

    return { totalScore, category, reasons };
  }
}

module.exports = SmartSchedulingEngine;
