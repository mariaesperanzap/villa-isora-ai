# Resolución de la revisión crítica — Sprint 1.1

| Hallazgo | Estado | Motivo |
|---|---|---|
| La rama de Sprint 1 partía de un commit raíz creado desde ZIP | Resuelto | Sprint 1.1 se reconstruyó desde un clon real de `mariaesperanzap/villa-isora-ai`; la rama local parte de `origin/main`. |
| No se había ejecutado integración con PostgreSQL real | Resuelto | Se ejecutó una PostgreSQL desechable y pruebas reales de transacción, consultas, FK, rollback y concurrencia. |
| `reservations` y `calendar_days` duplicaban ocupación sin relación | Parcialmente resuelto | `reservations` queda canónica y se añadió `calendar_days.reservation_id` con FK y reconciliación. Retirar totalmente la proyección se aplaza para evitar la refactorización grande excluida. |
| Una reserva directa se veía como bloqueo rojo | Resuelto | El calendario distingue reserva ámbar, bloqueo manual rojo e indisponibilidad externa azul. |
| Uso de `event.currentTarget` después de `await` | Resuelto | El formulario conserva la referencia antes del primer `await`. |
| El modo offline era solo una convención | Resuelto | `OFFLINE_MODE` bloquea la creación de clientes externos, fuerza stub de IA, evita push/pricing y el seeder elimina credenciales y recursos remotos. |
| La moneda podía decidirla el cliente | Resuelto | El API ignora moneda del payload y la toma de `listings.currency` dentro de la transacción. |
| Estados `NULL` desaparecían de consultas del calendario | Resuelto | La consulta incluye estado nulo y excluye explícitamente `cancelled`, además de usar solapamiento de intervalos. |
| Estados activos hardcodeados | Aplazado | `confirmed` y `pending` siguen siendo la política mínima del Sprint 1.1; un catálogo normalizado pertenece a la arquitectura multicanal posterior. |
| No se validaba `maxGuests` | Resuelto | La capacidad se lee de la propiedad en servidor y se valida aunque el cliente sea manipulado. |
| Siempre se crea un huésped nuevo | Aplazado | La deduplicación avanzada de huéspedes no es necesaria para comprobar reservas directas y ampliaría el alcance. |
| Escrituras secuenciales por noche | Resuelto | La proyección se inserta en una única operación multi-row dentro de la transacción. |
| El advisory lock depende de una convención y `hashtext` puede colisionar | Parcialmente resuelto | Se verificó serialización concurrente real. La sustitución por una restricción de exclusión o clave advisory de 64 bits queda para endurecimiento posterior. |
| Se devolvían mensajes internos del servidor o base de datos | Resuelto | El endpoint registra errores técnicos en servidor y devuelve mensajes públicos por categoría. |
| Las pruebas eran demasiado estrechas | Resuelto | Se añadieron casos inválidos, capacidad, precio, geometrías de solapamiento, cancelación, moneda, rollback, advisory lock y respuestas HTTP 201/400/401/404/409 autenticadas. |

## Deuda aplazada explícitamente

- Convertir `calendar_days` en una proyección completamente derivada.
- Normalizar estados y capacidades por provider de canal.
- Añadir deduplicación de huéspedes.
- Añadir una restricción PostgreSQL de exclusión para ocupación.
- Implementar UI completa de modificación y cancelación.
- Refactorización multicanal y soporte multipropiedad.
