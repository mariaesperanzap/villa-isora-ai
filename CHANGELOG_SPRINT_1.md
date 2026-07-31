# Changelog — Sprint 1

## Objetivos alcanzados

- Verificación de instalación, typecheck, build y arranque del proyecto.
- Conservación del modo demo y de datos exclusivamente ficticios.
- Configuración de una única propiedad de prueba llamada `Villa Isora`.
- Creación y consulta autenticada de reservas directas de prueba.
- Representación de las reservas directas en el calendario existente.
- Prevención transaccional de solapamientos y concurrencia.
- Ejecución sin Repull, Airbnb, Booking.com, Vrbo ni APIs externas.
- Reconstrucción del trabajo sobre el historial Git auténtico del repositorio.

## Cambios principales

### Reservas directas

- Se añadió un formulario local para crear reservas directas.
- El servidor valida fechas, nombre del huésped, número de huéspedes, capacidad
  máxima y precio.
- La moneda y `maxGuests` se obtienen de la propiedad en servidor; el cliente no
  puede decidirlos.
- La creación de huésped y reserva se realiza dentro de una transacción
  PostgreSQL.
- Un advisory lock por workspace y propiedad serializa intentos concurrentes.
- Se detectan solapamientos parciales, reservas contenidas y contenedoras.
- Las reservas canceladas dejan de bloquear nuevas reservas.
- Los errores técnicos se registran en servidor y el cliente recibe mensajes
  públicos controlados.

### Calendario

- `reservations` queda definida como fuente canónica de las reservas.
- Se añadió la relación transitoria `calendar_days.reservation_id`.
- La proyección vinculada puede localizarse y reemplazarse cuando una reserva
  cambia, o eliminarse cuando se cancela.
- El calendario consulta intervalos que atraviesan los límites del mes y trata
  correctamente estados nulos.
- La interfaz distingue:
  - reserva: ámbar;
  - bloqueo manual: rojo;
  - indisponibilidad externa: azul.

### Modo offline y demo

- `OFFLINE_MODE=on` bloquea los clientes externos por defecto.
- El auto-push de calendario, pricing externo e IA remota quedan desactivados en
  modo offline.
- El acceso demo no incorpora claves externas mientras el modo offline está
  activo.
- El seeder crea una única Villa Isora, elimina credenciales, desactiva
  automatizaciones y utiliza datos sintéticos sin imágenes remotas.
- Todas las variables nuevas están documentadas en `.env.example` con valores
  ficticios.

## Pruebas ejecutadas

### Pruebas unitarias

`pnpm test`: 11 pruebas superadas.

Cobertura:

- fechas válidas e inválidas;
- checkout igual o anterior al check-in;
- huésped vacío;
- huéspedes cero, fraccionarios o superiores a `maxGuests`;
- precio negativo o no numérico;
- checkout exclusivo;
- solapamiento parcial, contenido y contenedor.

### Integración PostgreSQL real

5 pruebas superadas contra una instancia PostgreSQL desechable:

- transacción;
- advisory lock concurrente;
- consultas de solapamiento;
- creación de huésped;
- creación de reserva;
- proyección vinculada en `calendar_days`;
- moneda obtenida del servidor;
- cancelación y liberación de días;
- rollback completo.

### Integración HTTP autenticada

Verificados:

- `201` creación correcta;
- `400` entrada inválida y exceso de capacidad;
- `401` petición sin sesión;
- `404` propiedad inexistente;
- `409` solapamiento;
- `200` consulta autenticada;
- `303` creación de sesión demo;
- moneda `EUR` devuelta por el servidor aunque el cliente enviase `USD`.

### Calidad y compilación

- Typecheck: superado.
- Build de producción con Next.js: superado.
- `git diff --check`: superado.

## Deuda técnica aceptada

- Convertir `calendar_days` en una proyección completamente derivada de
  reservas y bloqueos manuales.
- Normalizar los estados de reserva para la futura arquitectura multicanal.
- Añadir deduplicación avanzada de huéspedes.
- Evaluar una restricción PostgreSQL de exclusión como defensa adicional frente
  a solapamientos.
- Implementar la interfaz completa de modificación y cancelación.
- Sustituir la convención `middleware.ts` por `proxy.ts` en un sprint posterior.

## Limitaciones conocidas

- Solo se gestionan reservas directas de prueba para una propiedad.
- No hay integraciones, webhooks salientes, pagos ni credenciales reales.
- Los estados activos del MVP están limitados a `confirmed` y `pending`.
- La edición y cancelación disponen de soporte de reconciliación en servidor,
  pero todavía no tienen un flujo completo en la interfaz.
- `calendar_days` conserva temporalmente filas vinculadas a reservas; la
  eliminación de esta duplicación controlada queda para el siguiente sprint.
- La política offline está diseñada para este entorno de Sprint; habilitar
  integraciones requiere establecer expresamente `OFFLINE_MODE=off`.
