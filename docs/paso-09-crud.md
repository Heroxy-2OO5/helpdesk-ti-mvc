# Paso 9: CRUD y gestión de tickets

**Estado:** COMPLETADO

**Fecha de verificación:** 31 de julio de 2026

## Objetivo

Desarrollar los módulos principales del backend de HelpDesk TI para gestionar
usuarios, categorías y tickets, aplicando autenticación JWT, autorización por
roles, validación de entradas, eliminación lógica, trazabilidad y métricas
administrativas.

## Funcionalidades implementadas

### Gestión de usuarios

- Creación de usuarios con nombre, correo, contraseña y rol.
- Consulta individual y listado paginado.
- Búsqueda por nombre o correo.
- Filtros por rol y estado activo.
- Actualización de datos, contraseña, rol y estado.
- Desactivación lógica sin eliminar el historial relacionado.
- Cifrado bcrypt para todas las contraseñas creadas o actualizadas.
- Acceso exclusivo para administradores.

### Gestión de categorías

- Creación, consulta, actualización y desactivación lógica.
- Validación de nombres obligatorios y no duplicados.
- Búsqueda y paginación.
- Consulta de categorías activas para usuarios autenticados.
- Consulta administrativa de categorías activas e inactivas.
- Conservación de categorías utilizadas en tickets anteriores.

### Catálogos

Se habilitaron catálogos autenticados para consultar:

- roles de usuario;
- prioridades de tickets;
- estados del flujo de atención.

Los catálogos permiten que Angular utilice los códigos almacenados en
PostgreSQL sin duplicar valores en el frontend.

### Gestión de tickets

- Registro de tickets por solicitantes y administradores.
- Generación automática de un código único.
- Estado inicial `PENDING`.
- Consulta paginada de acuerdo con el rol autenticado.
- Consulta del detalle y del historial completo.
- Búsqueda por código o título.
- Filtros por estado, prioridad, categoría y técnico.
- Actualización de los datos generales del ticket.
- Eliminación lógica con motivo y responsable.
- Asignación, reasignación y retiro de técnicos.
- Cambios de estado controlados.
- Registro obligatorio de una solución al resolver un ticket.
- Registro automático del historial de eventos.

### Métricas administrativas

El panel administrativo entrega:

- total de tickets activos;
- cantidades por estado;
- cantidades por prioridad;
- cantidades por categoría;
- carga actual y tickets finalizados por técnico;
- tiempo promedio de resolución, cuando existen datos suficientes.

Las métricas se obtienen desde las vistas de PostgreSQL y solo pueden ser
consultadas por un administrador.

## Endpoints implementados

Todas las rutas de esta sección requieren un token JWT.

### Usuarios

| Método   | Endpoint         | Rol permitido | Descripción                                        |
| -------- | ---------------- | ------------- | -------------------------------------------------- |
| `GET`    | `/api/users`     | Administrador | Lista usuarios con búsqueda, filtros y paginación. |
| `POST`   | `/api/users`     | Administrador | Crea un usuario y cifra su contraseña.             |
| `GET`    | `/api/users/:id` | Administrador | Consulta un usuario.                               |
| `PATCH`  | `/api/users/:id` | Administrador | Actualiza los datos de un usuario.                 |
| `DELETE` | `/api/users/:id` | Administrador | Desactiva lógicamente un usuario.                  |

### Categorías

| Método   | Endpoint              | Rol permitido | Descripción                               |
| -------- | --------------------- | ------------- | ----------------------------------------- |
| `GET`    | `/api/categories`     | Todos         | Lista categorías autorizadas para el rol. |
| `POST`   | `/api/categories`     | Administrador | Crea una categoría.                       |
| `GET`    | `/api/categories/:id` | Todos         | Consulta una categoría autorizada.        |
| `PATCH`  | `/api/categories/:id` | Administrador | Actualiza una categoría.                  |
| `DELETE` | `/api/categories/:id` | Administrador | Desactiva lógicamente una categoría.      |

### Catálogos

| Método | Endpoint                   | Rol permitido | Descripción                    |
| ------ | -------------------------- | ------------- | ------------------------------ |
| `GET`  | `/api/catalogs/roles`      | Todos         | Lista los roles activos.       |
| `GET`  | `/api/catalogs/priorities` | Todos         | Lista las prioridades activas. |
| `GET`  | `/api/catalogs/states`     | Todos         | Lista los estados del ticket.  |

### Tickets

| Método   | Endpoint                      | Rol permitido               | Descripción                               |
| -------- | ----------------------------- | --------------------------- | ----------------------------------------- |
| `GET`    | `/api/tickets`                | Todos                       | Lista tickets según el alcance del rol.   |
| `POST`   | `/api/tickets`                | Administrador y solicitante | Crea un ticket.                           |
| `GET`    | `/api/tickets/:id`            | Usuario autorizado          | Consulta el detalle y el historial.       |
| `PATCH`  | `/api/tickets/:id`            | Administrador y solicitante | Actualiza los datos generales permitidos. |
| `DELETE` | `/api/tickets/:id`            | Administrador               | Aplica eliminación lógica.                |
| `PATCH`  | `/api/tickets/:id/assignment` | Administrador               | Asigna, reasigna o retira un técnico.     |
| `PATCH`  | `/api/tickets/:id/status`     | Administrador y técnico     | Realiza un cambio de estado autorizado.   |

### Métricas

| Método | Endpoint       | Rol permitido | Descripción                     |
| ------ | -------------- | ------------- | ------------------------------- |
| `GET`  | `/api/metrics` | Administrador | Obtiene el tablero de métricas. |

## Alcance por rol

| Función                      | Administrador |          Técnico          |      Solicitante       |
| ---------------------------- | :-----------: | :-----------------------: | :--------------------: |
| Administrar usuarios         |      Sí       |            No             |           No           |
| Administrar categorías       |      Sí       |            No             |           No           |
| Consultar categorías activas |      Sí       |            Sí             |           Sí           |
| Crear tickets                |      Sí       |            No             |           Sí           |
| Consultar todos los tickets  |      Sí       |            No             |           No           |
| Consultar tickets asignados  |      Sí       |            Sí             |           No           |
| Consultar tickets propios    |      Sí       |            No             |           Sí           |
| Modificar datos generales    |      Sí       |            No             | Solo si está pendiente |
| Asignar técnicos             |      Sí       |            No             |           No           |
| Cambiar estados              |      Sí       | Solo en tickets asignados |           No           |
| Cerrar tickets               |      Sí       |            No             |           No           |
| Eliminar tickets             |      Sí       |            No             |           No           |
| Consultar métricas           |      Sí       |            No             |           No           |

## Búsqueda, filtros y paginación

Los listados utilizan los parámetros `page` y `limit`. También admiten los
siguientes filtros:

- Usuarios: `search`, `rol` y `activo`.
- Categorías: `search` y `activo`.
- Tickets: `search`, `estado`, `prioridad`, `categoriaId`, `tecnicoId` y
  `activo`.

El backend valida todos los parámetros antes de utilizarlos y las consultas
SQL reciben los valores mediante parámetros de PostgreSQL.

## Reglas de negocio aplicadas

1. Los correos de usuarios y los nombres de categorías no pueden duplicarse.
2. Las contraseñas nunca se almacenan en texto plano.
3. Todo ticket nuevo comienza en estado `PENDING`.
4. Un solicitante solo consulta sus propios tickets.
5. Un técnico solo consulta y gestiona tickets asignados a su cuenta.
6. Solo el administrador asigna o retira técnicos.
7. La asignación cambia el ticket a `ASSIGNED`.
8. Los cambios de estado deben respetar las transiciones registradas en la
   base de datos.
9. Para pasar a `RESOLVED` se debe registrar una solución.
10. Solo un administrador puede pasar un ticket a `CLOSED`.
11. Las eliminaciones de usuarios, categorías y tickets son lógicas.
12. Las acciones importantes conservan responsable, fecha y detalle.

## Seguridad y calidad

- Autenticación mediante JWT.
- Autorización comprobada en el backend para cada rol.
- Contraseñas cifradas mediante bcrypt.
- Validación de cuerpos, parámetros y consultas con Zod.
- Consultas SQL parametrizadas contra inyección SQL.
- Manejo controlado de errores HTTP.
- Restricciones de integridad y transacciones en PostgreSQL.
- Separación entre rutas, controladores, servicios, modelos, tipos y
  validadores.
- Eliminación lógica para conservar la trazabilidad.

## Pruebas ejecutadas

La suite automatizada cubre:

1. Disponibilidad de la API y PostgreSQL.
2. Manejo de rutas inexistentes y JSON inválido.
3. Autenticación, JWT y permisos por roles.
4. CRUD, validaciones, duplicados y permisos de usuarios.
5. CRUD y eliminación lógica de categorías.
6. Acceso autenticado a los catálogos.
7. Creación y consulta de tickets según el rol.
8. Actualización y eliminación lógica de tickets.
9. Asignación, cambios de estado, solución e historial.
10. Acceso y consistencia de las métricas con PostgreSQL.

Comandos de verificación:

```bash
pnpm typecheck
pnpm build
pnpm test
```

Resultado esperado al finalizar el paso 9:

```text
tests 35
pass 35
fail 0
```

## Relación con los requisitos

| Requisito | Implementación                                                   |
| --------- | ---------------------------------------------------------------- |
| RF-03     | Autorización y alcance por administrador, técnico y solicitante. |
| RF-04     | CRUD administrativo de usuarios y desactivación lógica.          |
| RF-05     | CRUD de categorías y conservación de referencias históricas.     |
| RF-06     | Creación de tickets con código y estado inicial automáticos.     |
| RF-07     | Listado de tickets limitado según el rol.                        |
| RF-08     | Detalle completo e historial para usuarios autorizados.          |
| RF-09     | Actualización de tickets según rol y estado.                     |
| RF-10     | Eliminación lógica de tickets con motivo.                        |
| RF-11     | Asignación de técnicos activos por el administrador.             |
| RF-12     | Transiciones de estado y permisos del técnico asignado.          |
| RF-13     | Registro de solución y trazabilidad del historial.               |
| RF-14     | Búsquedas, filtros combinables y paginación.                     |
| RF-15     | Tablero administrativo basado en datos de PostgreSQL.            |
| RNF-06    | Validación de entradas mediante Zod.                             |
| RNF-07    | Autorización aplicada en las rutas y servicios.                  |
| RNF-08    | Errores controlados sin detalles internos.                       |
| RNF-09    | Integridad mediante PostgreSQL y reglas del servicio.            |
| RNF-10    | Historial de asignaciones, estados y soluciones.                 |
| RNF-11    | Organización modular bajo arquitectura MVC.                      |
| RNF-15    | Pruebas automatizadas de CRUD, validación y permisos.            |
| RNF-18    | Desarrollo registrado mediante commits pequeños.                 |

## Commits principales del paso 9

- `feat(users): implementar modelo y servicio de usuarios`
- `feat(users): exponer CRUD administrativo de usuarios`
- `test(users): cubrir CRUD, validaciones y permisos`
- `feat(categories): implementar CRUD de categorías`
- `test(categories): cubrir categorías y eliminación lógica`
- `feat(catalogs): exponer roles, prioridades y estados`
- `feat(tickets): crear tickets y consultarlos según el rol`
- `feat(tickets): actualizar tickets y aplicar eliminación lógica`
- `feat(tickets): implementar asignación y cambios de estado`
- `test(tickets): cubrir permisos, flujo e historial`
- `feat(metrics): implementar métricas administrativas`
- `test(metrics): cubrir acceso y consistencia del tablero`
- `docs(crud): documentar paso 9 y actualizar plan`

## Trabajo pendiente

La API REST del paso 9 está preparada para conectarse con Angular. El paso 10
consiste en implementar los servicios, formularios, pantallas y rutas del
frontend para verificar los flujos completos del sistema.
