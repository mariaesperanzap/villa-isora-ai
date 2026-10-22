# Villa Isora calendar edge route

Cloudflare Worker aislado que sirve exclusivamente el calendario público de
reservas directas en:

`https://villa-isora.com/calendario/villa-isora.ics`

No contiene URLs privadas de Airbnb, Booking.com o Vrbo, ni datos personales.
La primera versión devuelve un calendario iCal válido y vacío. No debe incluir
eventos hasta que la fuente canónica de reservas directas esté desplegada y
conectada de forma autenticada.

El Worker utiliza una ruta específica y no sustituye el Worker principal de la
web. Cualquier ruta distinta responde 404.
