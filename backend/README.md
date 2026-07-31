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

| Comando          | Descripción                               |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | Inicia el servidor con recarga automática |
| `pnpm build`     | Compila TypeScript en `dist`              |
| `pnpm start`     | Ejecuta la versión compilada              |
| `pnpm typecheck` | Comprueba los tipos                       |
| `pnpm test`      | Compila y ejecuta las pruebas             |

## Endpoints

| Método | Endpoint                | Descripción                     |
| ------ | ----------------------- | ------------------------------- |
| `GET`  | `/api/health`           | Comprueba la API y PostgreSQL   |
| `POST` | `/api/auth/login`       | Inicia sesión y genera un JWT   |
| `GET`  | `/api/auth/me`          | Devuelve el usuario autenticado |
| `POST` | `/api/auth/logout`      | Confirma el cierre de sesión    |
| `GET`  | `/api/auth/admin-check` | Comprueba el rol administrador  |

## Estructura

```text
src/
├── config/       Configuración y variables de entorno
├── controllers/  Procesamiento de solicitudes HTTP
├── errors/       Errores controlados
├── middlewares/  Autenticación, roles y manejo de errores
├── models/       Consultas parametrizadas a PostgreSQL
├── routes/       Definición de endpoints
├── services/     Lógica del sistema
├── types/        Tipos de TypeScript
├── utils/        Funciones auxiliares y bcrypt
├── validators/   Validación de entradas con Zod
├── app.test.ts   Pruebas automatizadas
├── app.ts        Configuración de Express
└── server.ts     Inicio del servidor
```

## Seguridad

- Contraseñas cifradas con bcrypt.
- Tokens JWT firmados con `HS256`.
- Tokens con expiración.
- Consultas SQL parametrizadas.
- Validación de entradas con Zod.
- Rechazo de usuarios inactivos.
- Protección de rutas privadas.
- Autorización basada en roles.
- Errores controlados sin exposición de información interna.

## Pruebas

```bash
pnpm test
```

Resultado esperado:

```text
tests 15
pass 15
fail 0
```

La explicación completa está disponible en
[la documentación del paso 8](../docs/paso-08-autenticacion.md).
