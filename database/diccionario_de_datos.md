# Diccionario de datos — HelpDesk TI

## Convenciones

- Las claves primarias numéricas usan `BIGINT IDENTITY`.
- Los campos terminados en `_id` son claves foráneas.
- Las fechas usan `TIMESTAMPTZ` y se guardan con zona horaria.
- Los códigos de catálogos están en inglés y mayúsculas para que permanezcan
  estables; los nombres visibles se guardan en español.
- `activo = false` representa eliminación lógica y conserva el historial.

## `roles`

Catálogo de perfiles autorizados.

| Campo | Tipo | Regla |
|---|---|---|
| `codigo` | `VARCHAR(20)` | PK: `ADMINISTRATOR`, `TECHNICIAN`, `REQUESTER` |
| `nombre` | `VARCHAR(50)` | Obligatorio y único |
| `descripcion` | `VARCHAR(250)` | Opcional |
| `activo` | `BOOLEAN` | Predeterminado `true` |
| `creado_en` | `TIMESTAMPTZ` | Fecha automática |

## `usuarios`

Almacena administradores, técnicos y solicitantes.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `BIGINT` | PK automática |
| `rol_codigo` | `VARCHAR(20)` | FK a `roles.codigo` |
| `nombre_completo` | `VARCHAR(120)` | Entre 3 y 120 caracteres |
| `correo` | `VARCHAR(254)` | Único sin distinguir mayúsculas |
| `contrasena_hash` | `VARCHAR(255)` | Hash bcrypt; mínimo 60 caracteres |
| `activo` | `BOOLEAN` | Controla el acceso y la eliminación lógica |
| `ultimo_acceso_en` | `TIMESTAMPTZ` | Último inicio de sesión exitoso |
| `creado_en` | `TIMESTAMPTZ` | Fecha automática |
| `actualizado_en` | `TIMESTAMPTZ` | Se actualiza automáticamente |
| `desactivado_en` | `TIMESTAMPTZ` | Fecha de desactivación |
| `desactivado_por_id` | `BIGINT` | FK al administrador que desactivó |

## `categorias`

Clasifica la naturaleza del incidente.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `BIGINT` | PK automática |
| `nombre` | `VARCHAR(80)` | Único sin distinguir mayúsculas |
| `descripcion` | `VARCHAR(300)` | Opcional |
| `activo` | `BOOLEAN` | Solo las activas se usan en tickets nuevos |
| `creado_en` | `TIMESTAMPTZ` | Fecha automática |
| `actualizado_en` | `TIMESTAMPTZ` | Fecha automática |
| `desactivado_en` | `TIMESTAMPTZ` | Fecha de eliminación lógica |
| `desactivado_por_id` | `BIGINT` | FK a `usuarios.id` |

## `prioridades`

Catálogo ordenable de severidad.

| Campo | Tipo | Regla |
|---|---|---|
| `codigo` | `VARCHAR(20)` | PK: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `nombre` | `VARCHAR(50)` | Nombre visible único |
| `nivel` | `SMALLINT` | Orden único de 1 a 10 |
| `color` | `VARCHAR(20)` | Color sugerido para Angular |
| `activo` | `BOOLEAN` | Habilita la opción |

## `estados_ticket`

Catálogo del ciclo de vida del ticket.

| Campo | Tipo | Regla |
|---|---|---|
| `codigo` | `VARCHAR(20)` | PK: `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `nombre` | `VARCHAR(50)` | Nombre visible único |
| `orden_flujo` | `SMALLINT` | Posición única dentro del flujo |
| `es_final` | `BOOLEAN` | Indica si el estado finaliza el proceso |
| `activo` | `BOOLEAN` | Habilita el estado |

## `transiciones_estado`

Lista blanca de cambios de estado permitidos.

| Campo | Tipo | Regla |
|---|---|---|
| `estado_origen_codigo` | `VARCHAR(20)` | PK compuesta y FK a `estados_ticket` |
| `estado_destino_codigo` | `VARCHAR(20)` | PK compuesta y FK a `estados_ticket` |
| `descripcion` | `VARCHAR(200)` | Explicación de la transición |

## `tickets`

Entidad principal del sistema.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `BIGINT` | PK automática interna |
| `codigo` | `VARCHAR(25)` | Único y automático: `HD-AAAA-NNNNNN` |
| `titulo` | `VARCHAR(150)` | Obligatorio, de 3 a 150 caracteres |
| `descripcion` | `TEXT` | Obligatoria, de 10 a 4000 caracteres |
| `solicitante_id` | `BIGINT` | FK al usuario que necesita soporte |
| `creado_por_id` | `BIGINT` | FK a quien registró el ticket |
| `categoria_id` | `BIGINT` | FK a `categorias.id` |
| `prioridad_codigo` | `VARCHAR(20)` | FK a `prioridades.codigo` |
| `estado_codigo` | `VARCHAR(20)` | FK; comienza en `PENDING` |
| `tecnico_id` | `BIGINT` | FK al técnico activo asignado |
| `asignado_por_id` | `BIGINT` | FK al administrador que asignó |
| `solucion` | `TEXT` | Obligatoria para resolver; de 5 a 8000 caracteres |
| `solucion_por_id` | `BIGINT` | FK al autor de la solución |
| `solucion_en` | `TIMESTAMPTZ` | Fecha de registro de la solución |
| `activo` | `BOOLEAN` | `false` indica eliminación lógica |
| `creado_en` | `TIMESTAMPTZ` | Fecha de creación automática |
| `actualizado_en` | `TIMESTAMPTZ` | Última modificación automática |
| `asignado_en` | `TIMESTAMPTZ` | Fecha de asignación o reasignación |
| `iniciado_en` | `TIMESTAMPTZ` | Primera llegada a `IN_PROGRESS` |
| `resuelto_en` | `TIMESTAMPTZ` | Primera llegada a `RESOLVED` |
| `cerrado_en` | `TIMESTAMPTZ` | Primera llegada a `CLOSED` |
| `actualizado_por_id` | `BIGINT` | FK al responsable de la última acción |
| `eliminado_en` | `TIMESTAMPTZ` | Fecha de eliminación lógica |
| `eliminado_por_id` | `BIGINT` | FK al administrador que eliminó |
| `motivo_eliminacion` | `VARCHAR(300)` | Motivo opcional |

## `tipos_evento_historial`

Catálogo de acciones auditables: creación, actualización, asignación,
reasignación, cambio de estado, solución, eliminación y restauración.

## `historial_tickets`

Bitácora inmutable generada automáticamente por los disparadores.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `BIGINT` | PK automática |
| `ticket_id` | `BIGINT` | FK a `tickets.id` |
| `tipo_evento_codigo` | `VARCHAR(30)` | FK al catálogo de eventos |
| `estado_anterior_codigo` | `VARCHAR(20)` | FK opcional al estado anterior |
| `estado_nuevo_codigo` | `VARCHAR(20)` | FK opcional al estado nuevo |
| `usuario_responsable_id` | `BIGINT` | FK al usuario que realizó la acción |
| `observacion` | `VARCHAR(500)` | Descripción comprensible del evento |
| `detalles` | `JSONB` | Datos adicionales, por ejemplo técnicos anterior y nuevo |
| `creado_en` | `TIMESTAMPTZ` | Fecha automática del evento |

Los registros de esta tabla no admiten `UPDATE` ni `DELETE`, lo que preserva la
trazabilidad exigida por los requisitos.
