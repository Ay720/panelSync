const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { addDays, setHours, setMinutes } = require('date-fns');

dotenv.config({ path: __dirname + '/../../.env' });

const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Interviewer = require('../models/Interviewer');
const InterviewPanel = require('../models/InterviewPanel');
const Availability = require('../models/Availability');
const CalendarEvent = require('../models/CalendarEvent');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const CalendarSyncService = require('../services/calendarSyncService');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/panelsync';
    console.log(`[Seed Script] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed Script] Clearing previous collections...');
    await Promise.all([
      User.deleteMany({}),
      Candidate.deleteMany({}),
      Interviewer.deleteMany({}),
      InterviewPanel.deleteMany({}),
      Availability.deleteMany({}),
      CalendarEvent.deleteMany({}),
      Interview.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed Script] Creating Users...');
    const adminUser = await User.create({
      name: 'Alexander Cross',
      email: 'admin@panelsync.io',
      password: 'Password123!',
      role: 'admin',
      department: 'Executive Leadership',
      timezone: 'America/New_York',
      phone: '+1 (555) 019-2831',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    const hrUser = await User.create({
      name: 'Claire Beauchamp',
      email: 'hr@panelsync.io',
      password: 'Password123!',
      role: 'hr',
      department: 'Talent Acquisition',
      timezone: 'America/New_York',
      phone: '+1 (555) 349-1102',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    });

    const interviewerUser = await User.create({
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@panelsync.io',
      password: 'Password123!',
      role: 'interviewer',
      department: 'Core Frontend Infrastructure',
      timezone: 'America/Los_Angeles',
      phone: '+1 (555) 778-9023',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    });

    console.log('[Seed Script] Creating Interviewers...');
    const sarahInterviewer = await Interviewer.create({
      user: interviewerUser._id,
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@panelsync.io',
      department: 'Frontend Engineering',
      title: 'Staff Frontend Architect',
      seniority: 'lead',
      skills: ['React', 'TypeScript', 'Web Performance', 'Micro-Frontends', 'Architecture'],
      timezone: 'America/Los_Angeles',
      maxInterviewsPerDay: 3,
      maxInterviewsPerWeek: 8,
      bufferTimeMinutes: 15,
      calendarSync: {
        provider: 'google',
        syncStatus: 'connected',
        email: 'sarah.chen@panelsync.io',
        lastSyncedAt: new Date(),
        mockMode: true,
      },
    });

    const davidInterviewer = await Interviewer.create({
      name: 'David Miller',
      email: 'david.miller@panelsync.io',
      department: 'Backend & Distributed Systems',
      title: 'Principal Systems Architect',
      seniority: 'director',
      skills: ['Go', 'Node.js', 'Distributed Systems', 'Kafka', 'System Design', 'PostgreSQL'],
      timezone: 'America/Chicago',
      maxInterviewsPerDay: 2,
      maxInterviewsPerWeek: 6,
      bufferTimeMinutes: 20,
      calendarSync: {
        provider: 'outlook',
        syncStatus: 'connected',
        email: 'david.miller@panelsync.io',
        lastSyncedAt: new Date(),
        mockMode: true,
      },
    });

    const priyaInterviewer = await Interviewer.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@panelsync.io',
      department: 'Engineering Leadership',
      title: 'Director of Software Engineering',
      seniority: 'vp',
      skills: ['Engineering Management', 'System Design', 'Cultural Leadership', 'Bar Raiser'],
      timezone: 'America/New_York',
      maxInterviewsPerDay: 2,
      maxInterviewsPerWeek: 5,
      bufferTimeMinutes: 15,
      calendarSync: {
        provider: 'google',
        syncStatus: 'connected',
        email: 'priya.sharma@panelsync.io',
        lastSyncedAt: new Date(),
        mockMode: true,
      },
    });

    const alexInterviewer = await Interviewer.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@panelsync.io',
      department: 'Cloud & Infrastructure',
      title: 'Senior Cloud Platform Engineer',
      seniority: 'senior',
      skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD Pipelines', 'Security Compliance'],
      timezone: 'Europe/London',
      maxInterviewsPerDay: 3,
      maxInterviewsPerWeek: 10,
      bufferTimeMinutes: 15,
      calendarSync: {
        provider: 'google',
        syncStatus: 'connected',
        email: 'alex.rivera@panelsync.io',
        lastSyncedAt: new Date(),
        mockMode: true,
      },
    });

    const allInterviewers = [sarahInterviewer, davidInterviewer, priyaInterviewer, alexInterviewer];

    console.log('[Seed Script] Setting up Availabilities & Calendars...');
    for (const inv of allInterviewers) {
      await Availability.create({
        interviewer: inv._id,
        timezone: inv.timezone,
        weeklySchedule: [
          { dayOfWeek: 1, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] },
          { dayOfWeek: 2, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] },
          { dayOfWeek: 3, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] },
          { dayOfWeek: 4, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] },
          { dayOfWeek: 5, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '16:00' }] },
          { dayOfWeek: 6, isAvailable: false, slots: [] },
          { dayOfWeek: 0, isAvailable: false, slots: [] },
        ],
      });

      // Synchronize initial mock calendar blocks
      await CalendarSyncService.syncMockCalendar(inv, adminUser._id);
    }

    console.log('[Seed Script] Creating Predefined Interview Panels...');
    const fullstackPanel = await InterviewPanel.create({
      name: 'Full-Stack Technical Loop',
      description: 'Comprehensive 60-min deep dive covering frontend architecture and backend data modeling',
      department: 'Engineering',
      targetRole: 'Senior Full-Stack Engineer',
      defaultDurationMinutes: 60,
      interviewers: [
        { interviewer: sarahInterviewer._id, role: 'Frontend Architecture Lead', isRequired: true },
        { interviewer: davidInterviewer._id, role: 'Systems Design Lead', isRequired: true },
      ],
    });

    const barRaiserPanel = await InterviewPanel.create({
      name: 'Executive & Bar Raiser Panel',
      description: 'Final round evaluation testing leadership instincts, cross-functional collaboration and high-level strategy',
      department: 'Engineering Leadership',
      targetRole: 'Engineering Manager & Staff+',
      defaultDurationMinutes: 60,
      interviewers: [
        { interviewer: priyaInterviewer._id, role: 'Bar Raiser / Executive Sponsor', isRequired: true },
        { interviewer: davidInterviewer._id, role: 'Senior Technical Evaluator', isRequired: true },
      ],
    });

    console.log('[Seed Script] Creating Candidates...');
    const candidate1 = await Candidate.create({
      name: 'Jordan Vance',
      email: 'jordan.vance@example.com',
      phone: '+1 (555) 234-5678',
      jobRole: 'Senior Full-Stack Engineer',
      department: 'Engineering',
      status: 'interview_scheduled',
      timezone: 'America/New_York',
      notes: 'Strong portfolio in React and Node.js. Ex-Stripe engineer. Prefers afternoon interviews.',
      preferredTimesOfDay: ['afternoon'],
      tags: ['Top Talent', 'Fast-Track', 'Full-Stack'],
    });

    const candidate2 = await Candidate.create({
      name: 'Maya Lin',
      email: 'maya.lin@example.com',
      phone: '+1 (555) 876-5432',
      jobRole: 'Staff Backend Architect',
      department: 'Core Infrastructure',
      status: 'screening',
      timezone: 'America/Los_Angeles',
      notes: 'Deep experience with high-throughput event sourcing and Kafka streams.',
      preferredTimesOfDay: ['morning', 'afternoon'],
      tags: ['Distributed Systems', 'Staff Level'],
    });

    const candidate3 = await Candidate.create({
      name: 'Lucas Scott',
      email: 'lucas.scott@example.com',
      phone: '+44 20 7946 0912',
      jobRole: 'Engineering Manager',
      department: 'Engineering Leadership',
      status: 'interview_scheduled',
      timezone: 'Europe/London',
      notes: 'Managed teams of 20+ engineers across multiple geographies.',
      preferredTimesOfDay: ['afternoon'],
      tags: ['Leadership', 'Management'],
    });

    const candidate4 = await Candidate.create({
      name: 'Emma Watson',
      email: 'emma.watson@example.com',
      phone: '+1 (555) 991-8822',
      jobRole: 'Lead Cloud Infrastructure Architect',
      department: 'Cloud Platform',
      status: 'interview_completed',
      timezone: 'America/Chicago',
      notes: 'Completed technical and behavioral rounds with stellar ratings.',
      tags: ['Kubernetes', 'Cloud'],
    });

    const candidate5 = await Candidate.create({
      name: 'Daniel Zhang',
      email: 'daniel.zhang@example.com',
      phone: '+65 6789 0123',
      jobRole: 'Senior Frontend Engineer',
      department: 'Web Experiences',
      status: 'applied',
      timezone: 'Asia/Singapore',
      notes: 'Specializes in Canvas/WebGL and complex design systems.',
      tags: ['Frontend', 'WebGL'],
    });

    console.log('[Seed Script] Scheduling Sample Interviews...');
    const tomorrow = addDays(new Date(), 1);
    const inTwoDays = addDays(new Date(), 2);
    const yesterday = addDays(new Date(), -1);

    // Interview 1: Upcoming tomorrow for Jordan Vance
    const int1Start = setMinutes(setHours(tomorrow, 14), 0); // 2:00 PM
    const int1End = setMinutes(setHours(tomorrow, 15), 0); // 3:00 PM

    const interview1 = await Interview.create({
      candidate: candidate1._id,
      panel: fullstackPanel._id,
      interviewers: [
        { interviewer: sarahInterviewer._id, role: 'Frontend Architecture Lead', responseStatus: 'accepted' },
        { interviewer: davidInterviewer._id, role: 'Systems Design Lead', responseStatus: 'accepted' },
      ],
      title: 'Full-Stack Architecture & System Design',
      jobRole: candidate1.jobRole,
      roundType: 'system_design',
      scheduledStartTime: int1Start,
      scheduledEndTime: int1End,
      durationMinutes: 60,
      timezone: candidate1.timezone,
      meetingLink: 'https://meet.panelsync.io/room/loop-jv772',
      status: 'scheduled',
      createdBy: hrUser._id,
    });

    candidate1.interviewHistory.push(interview1._id);
    await candidate1.save();

    await CalendarSyncService.createInterviewBlock({
      interviewerId: sarahInterviewer._id,
      interviewId: interview1._id,
      title: `Interview: ${interview1.title} (${candidate1.name})`,
      startTime: int1Start,
      endTime: int1End,
      location: interview1.meetingLink,
    });
    await CalendarSyncService.createInterviewBlock({
      interviewerId: davidInterviewer._id,
      interviewId: interview1._id,
      title: `Interview: ${interview1.title} (${candidate1.name})`,
      startTime: int1Start,
      endTime: int1End,
      location: interview1.meetingLink,
    });

    // Interview 2: Upcoming in 2 days for Lucas Scott
    const int2Start = setMinutes(setHours(inTwoDays, 16), 0);
    const int2End = setMinutes(setHours(inTwoDays, 17), 0);

    const interview2 = await Interview.create({
      candidate: candidate3._id,
      panel: barRaiserPanel._id,
      interviewers: [
        { interviewer: priyaInterviewer._id, role: 'Bar Raiser / Executive Sponsor', responseStatus: 'accepted' },
        { interviewer: davidInterviewer._id, role: 'Senior Technical Evaluator', responseStatus: 'accepted' },
      ],
      title: 'Executive Leadership & Bar Raiser Session',
      jobRole: candidate3.jobRole,
      roundType: 'bar_raiser',
      scheduledStartTime: int2Start,
      scheduledEndTime: int2End,
      durationMinutes: 60,
      timezone: candidate3.timezone,
      meetingLink: 'https://meet.panelsync.io/room/bar-ls910',
      status: 'scheduled',
      createdBy: hrUser._id,
    });

    candidate3.interviewHistory.push(interview2._id);
    await candidate3.save();

    // Interview 3: Completed yesterday for Emma Watson
    const int3Start = setMinutes(setHours(yesterday, 11), 0);
    const int3End = setMinutes(setHours(yesterday, 12), 0);

    const interview3 = await Interview.create({
      candidate: candidate4._id,
      interviewers: [
        { interviewer: alexInterviewer._id, role: 'Cloud Infrastructure Lead', responseStatus: 'accepted' },
      ],
      title: 'Cloud Infrastructure Deep Dive',
      jobRole: candidate4.jobRole,
      roundType: 'technical',
      scheduledStartTime: int3Start,
      scheduledEndTime: int3End,
      durationMinutes: 60,
      timezone: candidate4.timezone,
      meetingLink: 'https://meet.panelsync.io/room/cloud-ew334',
      status: 'completed',
      feedbackNotes: 'Candidate demonstrated outstanding expertise in Kubernetes operator pattern and multi-region failover.',
      createdBy: hrUser._id,
    });

    candidate4.interviewHistory.push(interview3._id);
    await candidate4.save();

    console.log('[Seed Script] Creating Notifications...');
    await Notification.create([
      {
        recipientUser: hrUser._id,
        recipientEmail: hrUser.email,
        type: 'interview_scheduled',
        title: 'Interview Loop Confirmed: Jordan Vance',
        message: 'Full-Stack Architecture session scheduled with Sarah Chen & David Miller',
        data: { interviewId: interview1._id },
        isRead: false,
      },
      {
        recipientUser: interviewerUser._id,
        recipientEmail: sarahInterviewer.email,
        type: 'interview_scheduled',
        title: 'New Panel Assignment: Jordan Vance',
        message: 'You have been assigned as Lead Interviewer for tomorrow at 2:00 PM',
        data: { interviewId: interview1._id },
        isRead: false,
      },
      {
        recipientUser: hrUser._id,
        recipientEmail: hrUser.email,
        type: 'conflict_detected',
        title: 'Calendar Alert: Potential Buffer Overlap',
        message: 'David Miller has back-to-back reviews adjacent to the Lucas Scott session',
        data: { interviewId: interview2._id },
        isRead: true,
      },
    ]);

    console.log('[Seed Script] Creating Audit Logs...');
    await AuditLog.create([
      {
        action: 'SYSTEM_INITIALIZATION',
        performedBy: adminUser._id,
        targetEntity: 'System',
        details: { version: '1.0.0', mode: 'Smart Multi-Panel Scheduling' },
      },
      {
        action: 'INTERVIEW_SCHEDULED',
        performedBy: hrUser._id,
        targetEntity: 'Interview',
        targetId: interview1._id.toString(),
        details: { candidate: candidate1.name, title: interview1.title },
      },
      {
        action: 'MOCK_CALENDAR_SYNC',
        performedBy: adminUser._id,
        targetEntity: 'Interviewer',
        targetId: sarahInterviewer._id.toString(),
        details: { provider: 'google', mockMode: true },
      },
    ]);

    console.log('✅ [Seed Script] PanelSync Database Seed Completed Successfully!');
    return { success: true, message: 'PanelSync DB successfully seeded' };
  } catch (err) {
    console.error(`❌ [Seed Script Error] ${err.message}`, err);
    throw err;
  }
};

// Run directly if invoked via node
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedData;

