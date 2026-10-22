export interface IcalBusyEvent {
  uid: string;
  checkIn: string;
  checkOut: string;
  summary: string | null;
  cancelled: boolean;
}

export class InvalidIcalFeedError extends Error {
  constructor(message = 'The calendar feed is not a valid iCalendar document.') {
    super(message);
    this.name = 'InvalidIcalFeedError';
  }
}

/**
 * Parses the deliberately small iCal surface shared by Airbnb, Booking and
 * Vrbo exports. It ignores guest details and descriptions: availability is the
 * only information the application needs from a private feed.
 */
export function parseIcalBusyEvents(source: string): IcalBusyEvent[] {
  const unfolded = source.replace(/\r?\n[ \t]/g, '');
  if (!/BEGIN:VCALENDAR(?:\r?\n)/.test(unfolded) || !/(?:\r?\n)END:VCALENDAR/.test(unfolded)) {
    throw new InvalidIcalFeedError();
  }

  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
  return blocks.flatMap((block) => {
    const fields = readFields(block);
    const uid = fields.get('UID')?.trim();
    const checkIn = parseIcalDate(fields.get('DTSTART'));
    const checkOut = parseIcalDate(fields.get('DTEND'));
    if (!uid || !checkIn || !checkOut || checkOut <= checkIn) return [];

    return [{
      uid,
      checkIn,
      checkOut,
      summary: fields.get('SUMMARY')?.trim() || null,
      cancelled: fields.get('STATUS')?.trim().toUpperCase() === 'CANCELLED',
    }];
  });
}

function readFields(block: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const line of block.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 1) continue;
    const key = line.slice(0, separator).split(';', 1)[0]?.toUpperCase();
    if (key) fields.set(key, line.slice(separator + 1));
  }
  return fields;
}

function parseIcalDate(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value.trim());
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${iso}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
}
