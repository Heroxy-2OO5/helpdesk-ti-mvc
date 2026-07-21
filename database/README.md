# Base de datos de HelpDesk TI

Diseño para PostgreSQL basado en los requisitos RF-01 a RF-15 y las reglas de
negocio RN-01 a RN-10. Incluye integridad referencial, eliminación lógica,
historial automático, flujo controlado de estados, índices y vistas de métricas.

## Archivos y orden de ejecución

1. `00_crear_base_de_datos.sql`: ejecútelo una vez conectado a `postgres`.
2. Conéctese a la nueva base `helpdesk_ti`.
3. `01_esquema.sql`: crea tablas, restricciones, índices, funciones, disparadores
   y vistas.
4. `02_datos_iniciales.sql`: agrega catálogos, categorías y cuentas de prueba.
5. `03_verificar_base_de_datos.sql`: prueba el flujo completo y termina con
   `ROLLBACK`, por lo que no deja tickets de prueba.
6. `04_consultas_utiles.sql`: ejemplos parametrizados para el backend Node.js.

En pgAdmin, abra **Query Tool**, cargue cada archivo y presione **Execute**. No
ejecute todos los archivos juntos porque el primero crea una base distinta.

## Cuentas locales de demostración

| Rol | Correo | Contraseña temporal |
|---|---|---|
| Administrador | `admin@helpdesk.local` | `Admin123*` |
| Técnico | `tecnico@helpdesk.local` | `Tecnico123*` |
| Solicitante | `solicitante@helpdesk.local` | `Solicitante123*` |

Las contraseñas se guardan como hashes bcrypt mediante `pgcrypto`; nunca quedan
en texto simple dentro de `usuarios`. Estas cuentas son solo para desarrollo.

## Flujo de estados

Flujo principal:

`PENDING → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED`

También se permiten dos retornos controlados:

- `ASSIGNED → PENDING`, cuando el administrador retira la asignación.
- `RESOLVED → IN_PROGRESS`, cuando es necesario reabrir el trabajo.

El disparador `trg_validar_ticket` rechaza cualquier otra transición y exige una
solución antes de llegar a `RESOLVED` o `CLOSED`.

## Responsabilidades del backend

La base de datos protege la integridad, pero Express también debe comprobar:

- JWT válido y no expirado en rutas privadas.
- Permisos por rol antes de cada operación.
- Que un solicitante solo consulte sus tickets.
- Que un técnico solo cambie sus tickets asignados.
- Longitudes y formatos antes de enviar datos a PostgreSQL.
- Consultas parametrizadas con el paquete `pg`, sin concatenar datos del usuario.
- En cada `UPDATE` de un ticket, enviar `actualizado_por_id` con el usuario del JWT.

## Variables de entorno sugeridas

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpdesk_ti
DB_USER=postgres
DB_PASSWORD=CAMBIAR_EN_CADA_EQUIPO
JWT_SECRET=GENERAR_UNA_CLAVE_LARGA_Y_ALEATORIA
JWT_EXPIRES_IN=2h
```
