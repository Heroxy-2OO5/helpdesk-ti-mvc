# Backend

API REST del sistema HelpDesk TI desarrollada con Node.js, Express y
TypeScript bajo arquitectura MVC.

## Requisitos

- Node.js 22 o superior.
- pnpm 11 o superior.

## Instalación

Desde la carpeta `backend`:

```bash
pnpm install
```

Copia el archivo de variables de entorno:

```powershell
Copy-Item .env.example .env
```

Inicia el servidor en modo desarrollo:

```bash
pnpm dev
```

La dirección predeterminada es `http://localhost:3000`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Inicia el servidor con recarga automática. |
| `pnpm build` | Compila TypeScript en la carpeta `dist`. |
| `pnpm start` | Ejecuta la versión compilada. |
| `pnpm typecheck` | Comprueba los tipos sin generar archivos. |
| `pnpm test` | Compila y ejecuta las pruebas automatizadas. |

## Endpoint disponible

### `GET /api/health`

Comprueba que la API está disponible.

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "helpdesk-ti-backend",
  "timestamp": "2026-07-24T10:32:12.696Z"
}
```

## Estructura MVC

```text
src/
├── config/       Variables y configuración de la aplicación
├── controllers/  Procesamiento de las solicitudes HTTP
├── middlewares/  Manejo común de rutas y errores
├── models/       Tipos y representación de los datos
├── routes/       Definición de endpoints
├── app.ts        Configuración de Express
└── server.ts     Inicio del servidor HTTP
```

La conexión con PostgreSQL, la autenticación y los CRUD pertenecen a los
pasos posteriores del plan de desarrollo.
