/**
 * Generates an RFC 5545 compliant iCalendar string (.ics)
 */
const generateICS = ({
  uid,
  title,
  description,
  startTime,
  endTime,
  location = 'PanelSync Virtual Interview Room',
  organizerName = 'PanelSync Scheduling',
  organizerEmail = 'interviews@panelsync.io',
  attendees = [],
  sequence = 0,
  status = 'CONFIRMED',
}) => {
  const formatDateToICS = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dtStamp = formatDateToICS(new Date());
  const dtStart = formatDateToICS(startTime);
  const dtEnd = formatDateToICS(endTime);

  const attendeesLines = attendees
    .map(
      (att) =>
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${att.name || att.email}:mailto:${att.email}`
    )
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PanelSync//Smart Multi-Panel Interview Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid || `interview-${Date.now()}@panelsync.io`}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    attendeesLines,
    `STATUS:${status}`,
    `SEQUENCE:${sequence}`,
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
};

module.exports = {
  generateICS,
};

