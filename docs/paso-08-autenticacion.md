# Paso 8: autenticación y autorización

**Estado:** COMPLETADO

**Fecha de verificación:** 31 de julio de 2026

## Objetivo

Implementar un sistema de autenticación seguro para HelpDesk TI mediante
correo y contraseña, emisión de tokens JWT, protección de rutas privadas y
control de acceso basado en roles.

## Funcionalidades implementadas

- Inicio de sesión mediante correo y contraseña.
- Verificación de contraseñas cifradas con bcrypt.
- Generación de tokens JWT con tiempo de expiración.
- Verificación de firma y vencimiento del token.
- Consulta del usuario autenticado.
- Rechazo de usuarios inactivos.
- Protección de rutas privadas.
- Autorización basada en roles.
- Cierre de sesión preparado para la integración con Angular.
- Actualización del último acceso del usuario.
- Respuestas controladas para errores 400, 401, 403, 404 y 500.

## Roles disponibles

| Código          | Descripción               |
| --------------- | ------------------------- |
| `ADMINISTRATOR` | Administrador del sistema |
| `TECHNICIAN`    | Técnico de soporte        |
| `REQUESTER`     | Usuario solicitante       |

Los códigos coinciden con los registros definidos en PostgreSQL.

## Endpoints implementados

| Método | Endpoint                | Protección              | Descripción                         |
| ------ | ----------------------- | ----------------------- | ----------------------------------- |
| `POST` | `/api/auth/login`       | Pública                 | Inicia sesión y genera un JWT       |
| `GET`  | `/api/auth/me`          | JWT                     | Devuelve el usuario autenticado     |
| `POST` | `/api/auth/logout`      | JWT                     | Confirma el cierre de sesión        |
| `GET`  | `/api/auth/admin-check` | JWT y rol administrador | Comprueba la autorización por roles |

La ruta `admin-check` sirve como evidencia de la autorización. El middleware
de roles será reutilizado posteriormente en los CRUD administrativos.

## Inicio de sesión

### Solicitud

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "correo": "admin@helpdesk.local",
  "contrasena": "********"
}
```

### Respuesta correcta

```json
{
  "token": "TOKEN_JWT",
  "expiresIn": "2h",
  "usuario": {
    "id": "1",
    "nombreCompleto": "Administrador HelpDesk",
    "correo": "admin@helpdesk.local",
    "rol": "ADMINISTRATOR"
  }
}
```

La respuesta nunca incluye la contraseña ni `contrasena_hash`.

### Credenciales incorrectas

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "El correo o la contraseña son incorrectos"
  }
}
```

Se utiliza el mismo mensaje para correos inexistentes, contraseñas incorrectas
y usuarios inactivos, evitando revelar la existencia de una cuenta.

## Uso del token

Las rutas privadas requieren el encabezado:

```http
Authorization: Bearer TOKEN_JWT
```

Si el token no existe, es inválido o está vencido, la API responde:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Debes iniciar sesión para acceder a este recurso"
  }
}
```

## Autorización por roles

El middleware `authorizeRoles` recibe los roles permitidos para cada ruta.

Ejemplo:

```typescript
authorizeRoles("ADMINISTRATOR");
```

Si un usuario autenticado no tiene el rol necesario, la API responde con
estado HTTP 403:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "No tienes permisos para realizar esta acción"
  }
}
```

El middleware de autenticación consulta nuevamente el usuario en PostgreSQL.
Por ello, un usuario desactivado pierde el acceso aunque todavía tenga un JWT
sin vencer.

## Seguridad implementada

### Cifrado de contraseñas

- Se utiliza `bcryptjs`.
- Se aplican 12 rondas de cifrado.
- Las contraseñas nunca se almacenan en texto plano.
- Los hashes creados originalmente con `pgcrypto` son compatibles con bcrypt.

### Seguridad de JWT

- Los tokens se firman mediante el algoritmo `HS256`.
- El tiempo de expiración predeterminado es de dos horas.
- La firma y el vencimiento se comprueban en todas las rutas privadas.
- `JWT_SECRET` se almacena exclusivamente en `.env`.
- El secreto debe contener al menos 32 caracteres.
- `.env` está excluido del repositorio mediante `.gitignore`.

### Protección contra inyección SQL

Todas las consultas que reciben datos externos utilizan parámetros de
PostgreSQL:

```typescript
WHERE LOWER(correo) = LOWER($1)
```

Los valores se envían por separado:

```typescript
[email];
```

No se concatenan datos del usuario dentro de las consultas SQL.

### Validación de entradas

Zod valida:

- correo obligatorio;
- formato válido de correo;
- máximo de 150 caracteres;
- contraseña entre 8 y 72 caracteres;
- rechazo de campos inesperados.

### Manejo de errores

Los errores internos de PostgreSQL, rutas del servidor y detalles técnicos no
se envían al cliente. Los errores 500 utilizan un mensaje genérico y sus
detalles solamente se registran en el servidor.

## Estructura implementada

```text
backend/src/
├── controllers/
│   └── auth.controller.ts
├── errors/
│   └── http-error.ts
├── middlewares/
│   ├── auth.middleware.ts
│   └── role.middleware.ts
├── models/
│   └── user.model.ts
├── routes/
│   └── auth.routes.ts
├── services/
│   └── auth.service.ts
├── types/
│   ├── auth.types.ts
│   └── express.d.ts
├── utils/
│   └── password.ts
└── validators/
    └── auth.validator.ts
```

## Pruebas ejecutadas

Las pruebas cubren:

1. Estado de la API y PostgreSQL.
2. Ruta inexistente.
3. JSON inválido.
4. Cifrado y verificación con bcrypt.
5. Inicio de sesión correcto.
6. Contraseña incorrecta.
7. Intento de inyección SQL.
8. Usuario inactivo.
9. Ruta privada sin token.
10. Token inválido.
11. Token vencido.
12. Ruta privada con token válido.
13. Cierre de sesión.
14. Solicitante rechazado en ruta administrativa.
15. Administrador autorizado correctamente.

Comandos ejecutados:

```bash
pnpm typecheck
pnpm build
pnpm test
```

Resultado:

```text
tests 15
pass 15
fail 0
```

## Relación con los requisitos

| Requisito | Implementación                                                       |
| --------- | -------------------------------------------------------------------- |
| RF-01     | Login mediante correo y contraseña                                   |
| RF-02     | Endpoint de logout; eliminación local del token pendiente de Angular |
| RF-03     | Roles administrador, técnico y solicitante                           |
| RNF-04    | Contraseñas cifradas con bcrypt                                      |
| RNF-05    | JWT firmado y con vencimiento                                        |
| RNF-06    | Validación de entradas con Zod                                       |
| RNF-07    | Autorización comprobada en el backend                                |
| RNF-08    | Manejo controlado de errores                                         |
| RNF-12    | Secretos almacenados en variables de entorno                         |
| RNF-15    | Pruebas de autenticación y autorización                              |

## Commits del paso 8

- `test(backend): actualizar prueba del endpoint de salud`
- `chore(backend): agregar dependencias y configuración JWT`
- `feat(auth): agregar modelo de usuario y cifrado bcrypt`
- `feat(auth): agregar validación y errores controlados`
- `feat(auth): implementar inicio de sesión con JWT`
- `feat(auth): proteger rutas mediante autenticación JWT`
- `feat(auth): agregar autorización por roles`
- `test(auth): cubrir autenticación y permisos por roles`
- `docs(auth): documentar autenticación del paso 8`

## Trabajo pendiente

La interfaz de inicio de sesión y la eliminación local del token se
implementarán en Angular durante el paso 10, correspondiente a la integración
entre frontend y backend.

El siguiente paso del plan es desarrollar los CRUD del sistema.
