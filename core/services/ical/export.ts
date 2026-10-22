export interface PublicCalendarEvent {
  uid: string;
  checkIn: string;
  checkOut: string;
  summary: string;
}

export function buildPublicIcal(events: PublicCalendarEvent[], generatedAt = new Date()): string {
  const stamp = generatedAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Villa Isora//Availability Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Villa Isora',
  ];

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeText(event.uid)}@villa-isora.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(event.checkIn)}`,
      `DTEND;VALUE=DATE:${compactDate(event.checkOut)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      'TRANSP:OPAQUE',
      'STATUS:CONFIRMED',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

export function groupBlockedDates(dates: string[]): Array<{ checkIn: string; checkOut: string }> {
  const sorted = [...new Set(dates)].sort();
  const ranges: Array<{ checkIn: string; checkOut: string }> = [];
  for (const date of sorted) {
    const current = ranges.at(-1);
    if (current?.checkOut === date) {
      current.checkOut = addDays(date, 1);
    } else {
      ranges.push({ checkIn: date, checkOut: addDays(date, 1) });
    }
  }
  return ranges;
}

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function compactDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid calendar date.');
  return value.replaceAll('-', '');
}

function escapeText(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');
}
