# Sprint 1.1 — reservas directas de Villa Isora

## Alcance

Este sprint mantiene la arquitectura del starter y sus datos ficticios. Configura
una sola propiedad de prueba (`Villa Isora`) y permite crear reservas directas,
consultarlas y verlas en el calendario. No conecta Repull, Airbnb, Booking.com,
Vrbo ni ningún servicio externo.

`OFFLINE_MODE` está activo por defecto. Solo el valor explícito `off` permite que
el código central de integraciones cree un cliente externo. El seeder elimina
credenciales, desactiva auto-push y recomendaciones, y no referencia imágenes
remotas.

## Requisitos y entorno

- Node.js 20 o superior.
- pnpm 11.
- PostgreSQL 16 o superior.
- Copiar `.env.example` a `.env.local`.
- Mantener `OFFLINE_MODE=on`.
- Usar únicamente valores ficticios para `AUTH_SECRET`.

```powershell
Copy-Item .env.example .env.local
pnpm install --frozen-lockfile
pnpm db:push
pnpm exec tsx scripts/seed-demo.ts
pnpm dev
```

Abrir `http://localhost:3030`, usar **Sign in as demo**, entrar en
**Reservations** y desplegar **Create test direct booking**.

## Verificación

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm test:integration
```

`test:integration` requiere que `DATABASE_URL` apunte a una PostgreSQL
desechable con el esquema aplicado. Verifica transacción, advisory lock,
solapamientos, huésped, reserva, proyección vinculada, moneda de servidor,
cancelación y rollback. La comprobación HTTP local cubre 201, 400, 401, 404 y
409, además de la cookie de sesión del acceso demo.

## Reglas de reservas

- El checkout es exclusivo y debe ser posterior al check-in.
- Las reservas `confirmed` y `pending` bloquean solapamientos.
- Una reserva cancelada no bloquea.
- Los bloqueos manuales y la indisponibilidad externa también impiden reservar.
- La moneda y `maxGuests` se obtienen de la propiedad en el servidor.
- Los errores técnicos se registran en servidor; el cliente recibe mensajes
  públicos controlados.

## Transición del calendario

`reservations` es la fuente canónica. En Sprint 1.1, `calendar_days` conserva
temporalmente filas de ocupación con una FK `reservation_id`. La reconciliación
elimina primero todas las filas vinculadas y solo las recrea si la reserva sigue
activa; por ello una cancelación o modificación puede localizar y liberar sus
días de forma determinista.

En el siguiente sprint, `calendar_days` debe convertirse en una proyección
derivada de reservas y bloqueos manuales, eliminando la escritura duplicada de
ocupación. Esta migración queda expresamente fuera de Sprint 1.1.

## Fuera de alcance

- Integraciones o credenciales reales.
- Refactorización multicanal completa.
- Pagos, mensajería real o automatizaciones.
- Interfaz completa para editar/cancelar reservas.
- Merge, push, PR o despliegue.
