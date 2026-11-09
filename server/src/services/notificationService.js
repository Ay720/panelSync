const Notification = require('../models/Notification');
const { getTransporter, initEmailTransporter } = require('../config/email');
const { generateICS } = require('../utils/icsGenerator');
const { formatInTimezone } = require('../utils/timezone');

class NotificationService {
  /**
   * Send Interview Scheduled Notification to Candidate and Interviewers
   */
  static async sendInterviewScheduled({ interview, candidate, interviewers, createdByUser }) {
    const notifications = [];

    // Format times
    const candidateTimeStr = formatInTimezone(
      interview.scheduledStartTime,
      candidate.timezone || 'America/New_York',
      'EEEE, MMMM d, yyyy @ h:mm a zzz'
    );

    // 1. Send to Candidate
    const candidateHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #9333ea; margin: 0;">PanelSync Interview Invitation</h2>
        </div>
        <p>Dear <strong>${candidate.name}</strong>,</p>
        <p>Your interview for the <strong>${interview.jobRole}</strong> position has been scheduled!</p>
        <div style="background-color: #faf5ff; border-left: 4px solid #9333ea; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 4px 0;"><strong>Round:</strong> ${interview.title} (${interview.roundType})</p>
          <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${candidateTimeStr}</p>
          <p style="margin: 4px 0;"><strong>Duration:</strong> ${interview.durationMinutes} minutes</p>
          <p style="margin: 4px 0;"><strong>Meeting Link:</strong> <a href="${interview.meetingLink}" style="color: #9333ea; font-weight: bold;">${interview.meetingLink}</a></p>
        </div>
        <p>Please review the attached calendar invite (.ics) to add this session to your calendar.</p>
        <p>Best regards,<br/>The Talent Acquisition Team</p>
      </div>
    `;

    // Candidate In-app Notification
    const candidateNotification = await Notification.create({
      recipientEmail: candidate.email,
      recipientName: candidate.name,
      type: 'interview_scheduled',
      title: `Interview Scheduled: ${interview.title}`,
      message: `Your interview for ${interview.jobRole} is confirmed for ${candidateTimeStr}`,
      data: {
        interviewId: interview._id,
        meetingLink: interview.meetingLink,
      },
    });
    notifications.push(candidateNotification);

    // Generate .ics attachment
    const icsContent = generateICS({
      uid: `interview-${interview._id}@panelsync.io`,
      title: `${interview.title} - ${candidate.name} (${interview.jobRole})`,
      description: `Interview for ${candidate.name}\nRole: ${interview.jobRole}\nLink: ${interview.meetingLink}`,
      startTime: interview.scheduledStartTime,
      endTime: interview.scheduledEndTime,
      location: interview.meetingLink,
      attendees: [
        { name: candidate.name, email: candidate.email },
        ...interviewers.map((i) => ({ name: i.name, email: i.email })),
      ],
    });

    await this.dispatchEmail({
      to: candidate.email,
      subject: `Confirmed: ${interview.title} - ${candidate.name}`,
      html: candidateHtml,
      icsContent,
    });

    // 2. Send to Each Interviewer
    for (const inv of interviewers) {
      const invTimeStr = formatInTimezone(
        interview.scheduledStartTime,
        inv.timezone || 'America/Los_Angeles',
        'EEEE, MMMM d, yyyy @ h:mm a zzz'
      );

      const invNotification = await Notification.create({
        recipientUser: inv.user || null,
        recipientEmail: inv.email,
        recipientName: inv.name,
        type: 'interview_scheduled',
        title: `Assigned Interview: ${candidate.name} - ${interview.jobRole}`,
        message: `You have been added to the interview panel for ${candidate.name} on ${invTimeStr}`,
        data: {
          interviewId: interview._id,
          candidateId: candidate._id,
          meetingLink: interview.meetingLink,
        },
      });
      notifications.push(invNotification);

      const interviewerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #9333ea; margin-top: 0;">PanelSync Interview Panel Assignment</h2>
          <p>Hi <strong>${inv.name}</strong>,</p>
          <p>You have been assigned to conduct an interview for <strong>${candidate.name}</strong>.</p>
          <div style="background-color: #faf5ff; border-left: 4px solid #9333ea; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 4px 0;"><strong>Candidate:</strong> ${candidate.name} (${candidate.email})</p>
            <p style="margin: 4px 0;"><strong>Role:</strong> ${interview.jobRole}</p>
            <p style="margin: 4px 0;"><strong>Round:</strong> ${interview.title}</p>
            <p style="margin: 4px 0;"><strong>Your Local Time:</strong> ${invTimeStr}</p>
            <p style="margin: 4px 0;"><strong>Meeting Link:</strong> <a href="${interview.meetingLink}" style="color: #9333ea; font-weight: bold;">${interview.meetingLink}</a></p>
          </div>
          <p>Your calendar has been updated automatically with buffer periods included.</p>
        </div>
      `;

      await this.dispatchEmail({
        to: inv.email,
        subject: `Panel Assignment: ${interview.title} with ${candidate.name}`,
        html: interviewerHtml,
        icsContent,
      });
    }

    return notifications;
  }

  /**
   * Send Interview Rescheduled Notification
   */
  static async sendInterviewRescheduled({ interview, candidate, interviewers, reason, oldStartTime, oldEndTime }) {
    const notifications = [];

    const candidateNewTime = formatInTimezone(
      interview.scheduledStartTime,
      candidate.timezone || 'America/New_York',
      'EEEE, MMMM d, yyyy @ h:mm a zzz'
    );
    const candidateOldTime = formatInTimezone(
      oldStartTime,
      candidate.timezone || 'America/New_York',
      'EEEE, MMMM d, yyyy @ h:mm a zzz'
    );

    const icsContent = generateICS({
      uid: `interview-${interview._id}@panelsync.io`,
      title: `[RESCHEDULED] ${interview.title} - ${candidate.name}`,
      description: `Updated interview time.\nReason: ${reason}\nMeeting Link: ${interview.meetingLink}`,
      startTime: interview.scheduledStartTime,
      endTime: interview.scheduledEndTime,
      location: interview.meetingLink,
      sequence: (interview.rescheduleHistory?.length || 1),
      attendees: [
        { name: candidate.name, email: candidate.email },
        ...interviewers.map((i) => ({ name: i.name, email: i.email })),
      ],
    });

    // Notify Candidate
    const cNotif = await Notification.create({
      recipientEmail: candidate.email,
      recipientName: candidate.name,
      type: 'interview_rescheduled',
      title: `Interview Rescheduled: ${interview.title}`,
      message: `Your interview has been rescheduled to ${candidateNewTime}. Reason: ${reason}`,
      data: {
        interviewId: interview._id,
        newTime: candidateNewTime,
        oldTime: candidateOldTime,
        reason,
      },
    });
    notifications.push(cNotif);

    await this.dispatchEmail({
      to: candidate.email,
      subject: `Rescheduled: ${interview.title} - ${candidate.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 8px;">
          <h2 style="color: #ea580c; margin-top: 0;">Interview Rescheduled</h2>
          <p>Dear <strong>${candidate.name}</strong>,</p>
          <p>Please note that your upcoming interview has been moved to a new time slot:</p>
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 4px 0;"><strong>Previous Time:</strong> <strike>${candidateOldTime}</strike></p>
            <p style="margin: 4px 0;"><strong>New Time:</strong> <strong>${candidateNewTime}</strong></p>
            <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>
            <p style="margin: 4px 0;"><strong>Meeting Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></p>
          </div>
          <p>We apologize for any inconvenience. An updated calendar invitation is attached.</p>
        </div>
      `,
      icsContent,
    });

    // Notify Interviewers
    for (const inv of interviewers) {
      const invNewTime = formatInTimezone(
        interview.scheduledStartTime,
        inv.timezone || 'America/Los_Angeles',
        'EEEE, MMMM d, yyyy @ h:mm a zzz'
      );

      const iNotif = await Notification.create({
        recipientUser: inv.user || null,
        recipientEmail: inv.email,
        recipientName: inv.name,
        type: 'interview_rescheduled',
        title: `Rescheduled: ${candidate.name} (${interview.title})`,
        message: `Interview shifted to ${invNewTime}. Reason: ${reason}`,
        data: {
          interviewId: interview._id,
          newTime: invNewTime,
          reason,
        },
      });
      notifications.push(iNotif);

      await this.dispatchEmail({
        to: inv.email,
        subject: `Rescheduled: ${interview.title} for ${candidate.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 8px;">
            <h2 style="color: #ea580c; margin-top: 0;">Panel Interview Rescheduled</h2>
            <p>Hi <strong>${inv.name}</strong>,</p>
            <p>The panel interview with <strong>${candidate.name}</strong> has been rescheduled:</p>
            <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 4px 0;"><strong>New Time (Your Zone):</strong> <strong>${invNewTime}</strong></p>
              <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>
              <p style="margin: 4px 0;"><strong>Meeting Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></p>
            </div>
          </div>
        `,
        icsContent,
      });
    }

    return notifications;
  }

  /**
   * Send Interview Cancellation Notification
   */
  static async sendInterviewCancelled({ interview, candidate, interviewers, reason }) {
    const notifications = [];

    const cNotif = await Notification.create({
      recipientEmail: candidate.email,
      recipientName: candidate.name,
      type: 'interview_cancelled',
      title: `Interview Cancelled: ${interview.title}`,
      message: `Your interview for ${interview.jobRole} has been cancelled. Reason: ${reason || 'Schedule update'}`,
      data: { interviewId: interview._id, reason },
    });
    notifications.push(cNotif);

    await this.dispatchEmail({
      to: candidate.email,
      subject: `Cancelled: ${interview.title} - ${candidate.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #fecaca; border-radius: 8px;">
          <h2 style="color: #dc2626; margin-top: 0;">Interview Cancelled</h2>
          <p>Dear <strong>${candidate.name}</strong>,</p>
          <p>Your interview session for <strong>${interview.jobRole}</strong> (${interview.title}) has been cancelled.</p>
          <p><strong>Reason:</strong> ${reason || 'Scheduling adjustment'}</p>
          <p>Our talent team will follow up with you shortly regarding next steps.</p>
        </div>
      `,
    });

    for (const inv of interviewers) {
      const iNotif = await Notification.create({
        recipientUser: inv.user || null,
        recipientEmail: inv.email,
        recipientName: inv.name,
        type: 'interview_cancelled',
        title: `Cancelled: Interview with ${candidate.name}`,
        message: `The interview for ${interview.jobRole} has been cancelled. Calendar block released.`,
        data: { interviewId: interview._id, reason },
      });
      notifications.push(iNotif);

      await this.dispatchEmail({
        to: inv.email,
        subject: `Cancelled: ${interview.title} with ${candidate.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #fecaca; border-radius: 8px;">
            <h2 style="color: #dc2626; margin-top: 0;">Interview Session Cancelled</h2>
            <p>Hi <strong>${inv.name}</strong>,</p>
            <p>The interview with <strong>${candidate.name}</strong> has been cancelled and removed from your schedule.</p>
            <p><strong>Reason:</strong> ${reason || 'Schedule adjustment'}</p>
          </div>
        `,
      });
    }

    return notifications;
  }

  /**
   * Helper to dispatch email via transporter safely
   */
  static async dispatchEmail({ to, subject, html, icsContent = null }) {
    try {
      const transporter = await initEmailTransporter();
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"PanelSync" <noreply@panelsync.io>',
        to,
        subject,
        html,
      };

      if (icsContent) {
        mailOptions.attachments = [
          {
            filename: 'invite.ics',
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          },
        ];
      }

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.warn(`[NotificationService Email Warning] Could not send email to ${to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}

module.exports = NotificationService;

