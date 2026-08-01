# Backend HelpDesk TI

API REST desarrollada con Node.js, Express, TypeScript y PostgreSQL bajo
arquitectura MVC.

## Requisitos

- Node.js 24.15 o superior.
- pnpm 11 o superior.
- PostgreSQL con la base `helpdesk_ti` configurada.

## Instalación

Desde la carpeta `backend`:

```bash
pnpm install
```

Copia las variables de entorno:

```powershell
Copy-Item .env.example .env
```

Configura en `.env`:

```env
NODE_ENV=development
PORT=3000

DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpdesk_ti

JWT_SECRET=una_clave_segura_de_al_menos_32_caracteres
JWT_EXPIRES_IN=2h
```

El archivo `.env` no debe subirse a GitHub.

## Ejecución

```bash
pnpm dev
```

Dirección predeterminada:

```text
http://localhost:3000
```

## Comandos

| Comando          | Descripción                                |
| ---------------- | ------------------------------------------ |
| `pnpm dev`       | Inicia el servidor con recarga automática. |
| `pnpm build`     | Compila TypeScript en `dist`.              |
| `pnpm start`     | Ejecuta la versión compilada.              |
| `pnpm typecheck` | Comprueba los tipos.                       |
| `pnpm test`      | Compila y ejecuta las pruebas.             |

## Endpoints

| Módulo           | Endpoints principales                                                |
| ---------------- | -------------------------------------------------------------------- |
| Estado           | `GET /api/health`                                                    |
| Autenticación    | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`  |
| Usuarios         | `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id`             |
| Categorías       | `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id`   |
| Catálogos        | `GET /api/catalogs/roles`, `/priorities`, `/states`                  |
| Tickets          | `GET/POST /api/tickets`, `GET/PATCH/DELETE /api/tickets/:id`         |
| Flujo de tickets | `PATCH /api/tickets/:id/assignment`, `PATCH /api/tickets/:id/status` |
| Métricas         | `GET /api/metrics`                                                   |

Todos los módulos privados utilizan JWT y autorización por roles. Los detalles
de métodos, permisos y reglas están disponibles en la documentación del paso 9.

## Estructura

```text
src/
├── config/       Configuración y variables de entorno
├── controllers/  Procesamiento de solicitudes HTTP
├── errors/       Errores controlados
├── middlewares/  Autenticación, roles y manejo de errores
├── models/       Consultas parametrizadas a PostgreSQL
├── routes/       Definición de endpoints
├── services/     Lógica y reglas de negocio
├── types/        Tipos de TypeScript
├── utils/        Funciones auxiliares, validación y bcrypt
├── validators/   Esquemas de validación con Zod
├── app.test.ts   Pruebas automatizadas
├── app.ts        Configuración de Express
└── server.ts     Inicio del servidor
```

## Seguridad

- Contraseñas cifradas con bcrypt.
- Tokens JWT firmados con `HS256` y tiempo de expiración.
- Consultas SQL parametrizadas.
- Validación de cuerpos, parámetros y consultas con Zod.
- Rechazo de usuarios inactivos.
- Protección de rutas privadas.
- Autorización basada en roles y alcance de datos.
- Eliminación lógica y trazabilidad.
- Errores controlados sin exposición de información interna.

## Pruebas

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

Consulta la [documentación del paso 8](../docs/paso-08-autenticacion.md) y la
[documentación del paso 9](../docs/paso-09-crud.md).
