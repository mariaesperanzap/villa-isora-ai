const CALENDAR_PATH = "/calendario/villa-isora.ics";

function calendarResponse(): Response {
  const generatedAt = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Villa Isora//Availability Calendar//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Villa Isora",
    `X-WR-CALDESC:Disponibilidad de reservas directas. Actualizado ${generatedAt}`,
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": 'inline; filename="villa-isora.ics"',
      "Content-Type": "text/calendar; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (url.pathname !== CALENDAR_PATH) {
      return new Response("Not found", { status: 404 });
    }
    return calendarResponse();
  },
};
