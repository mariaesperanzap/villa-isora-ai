import assert from 'node:assert/strict';
import test from 'node:test';
import { InvalidIcalFeedError, parseIcalBusyEvents } from '../core/services/ical/parser';

test('parses all-day availability without retaining private descriptions', () => {
  const events = parseIcalBusyEvents(`BEGIN:VCALENDAR\r
VERSION:2.0\r
BEGIN:VEVENT\r
UID:vrbo-123\r
DTSTART;VALUE=DATE:20261110\r
DTEND;VALUE=DATE:20261114\r
SUMMARY:Reserved\r
DESCRIPTION:Private guest information\r
END:VEVENT\r
END:VCALENDAR\r
`);
  assert.deepEqual(events, [{
    uid: 'vrbo-123', checkIn: '2026-11-10', checkOut: '2026-11-14',
    summary: 'Reserved', cancelled: false,
  }]);
  assert.equal(JSON.stringify(events).includes('Private guest information'), false);
});

test('supports folded lines and cancelled events', () => {
  const [event] = parseIcalBusyEvents(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:long-\n value\nDTSTART:20261201T150000Z\nDTEND:20261203T110000Z\nSTATUS:CANCELLED\nEND:VEVENT\nEND:VCALENDAR`);
  assert.equal(event?.uid, 'long-value');
  assert.equal(event?.cancelled, true);
});

test('ignores incomplete or invalid events', () => {
  const events = parseIcalBusyEvents(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:bad\nDTSTART;VALUE=DATE:20261110\nDTEND;VALUE=DATE:20261110\nEND:VEVENT\nEND:VCALENDAR`);
  assert.deepEqual(events, []);
});

test('rejects non-calendar content', () => {
  assert.throws(() => parseIcalBusyEvents('<html>login</html>'), InvalidIcalFeedError);
});
