# HelpDesk TI MVC

Sistema web para la gestión de tickets de soporte técnico desarrollado con
Angular, Node.js, Express, TypeScript y PostgreSQL bajo arquitectura MVC.

## Estado del desarrollo

**Avance actual:** 10 de 12 pasos completados (83 %).

La autenticación, los módulos principales del backend y la integración
frontend-backend están terminados.

El sistema dispone de interfaces funcionales para los roles administrador,
técnico y solicitante, además de CRUD, gestión completa de tickets, historial,
métricas, validaciones y pruebas automatizadas.

El siguiente paso es ejecutar formalmente el plan de pruebas y registrar sus
resultados.

## Plan de desarrollo

| N.º | Paso                                               | Estado     | Resultado                                            |
| --: | -------------------------------------------------- | ---------- | ---------------------------------------------------- |
|   1 | Crear el repositorio en GitHub                     | COMPLETADO | Repositorio principal y evidencia de commits         |
|   2 | Agregar `frontend`, `backend`, `database` y `docs` | COMPLETADO | Estructura organizada por componentes                |
|   3 | Definir requisitos                                 | COMPLETADO | Requisitos funcionales, no funcionales y reglas      |
|   4 | Diseñar la base de datos                           | COMPLETADO | Esquema, datos iniciales, diagrama y diccionario     |
|   5 | Inicializar Angular                                | COMPLETADO | Proyecto frontend con HTML, CSS y TypeScript         |
|   6 | Inicializar Node.js, Express y TypeScript          | COMPLETADO | API organizada bajo arquitectura MVC                 |
|   7 | Configurar PostgreSQL                              | COMPLETADO | Conexión y comprobación desde el backend             |
|   8 | Implementar autenticación                          | COMPLETADO | bcrypt, JWT y autorización por roles                 |
|   9 | Desarrollar los CRUD                               | COMPLETADO | Usuarios, categorías, tickets, historial y métricas  |
|  10 | Integrar frontend y backend                        | COMPLETADO | Aplicación Angular conectada con todos los flujos    |
|  11 | Ejecutar pruebas                                   | PENDIENTE  | Pruebas funcionales, validación, seguridad y sistema |
|  12 | Obtener métricas y redactar el informe             | PENDIENTE  | Métricas de calidad e informe final                  |

## Componentes

- `frontend`: aplicación Angular y experiencia del usuario.
- `backend`: API REST desarrollada con Node.js y Express.
- `database`: esquema, datos iniciales y vistas PostgreSQL.
- `docs`: requisitos, documentación técnica, pruebas y evidencias.

## Tecnologías principales

- Angular 22
- HTML y CSS
- TypeScript
- Node.js
- Express
- PostgreSQL
- JWT
- bcrypt
- Zod
- RxJS
- Vitest
- Git y GitHub

## Funcionalidades implementadas

### Autenticación y seguridad

- Inicio y cierre de sesión.
- Autenticación JWT.
- Contraseñas cifradas con bcrypt.
- Interceptor HTTP.
- Guards de autenticación y roles.
- Validaciones frontend y backend.
- Errores controlados.
- Consultas SQL parametrizadas.

### Usuarios y categorías

- CRUD administrativo de usuarios.
- Asignación de roles.
- Cambio de contraseña.
- Desactivación y reactivación.
- CRUD de categorías.
- Búsqueda, filtros y paginación.
- Eliminación lógica.

### Tickets

- Creación y consulta según el rol.
- Código automático.
- Búsqueda, filtros y paginación.
- Detalle y actualización.
- Asignación de técnicos.
- Transiciones de estado.
- Registro de solución.
- Historial cronológico.
- Cierre y eliminación lógica.

### Paneles

- Inicio personalizado para cada rol.
- Resumen administrativo.
- Carga de trabajo del técnico.
- Resumen de solicitudes del usuario.
- Métricas por estado, prioridad y categoría.
- Métricas de carga y finalización por técnico.

## Roles

| Función                     | Administrador |       Técnico        | Solicitante |
| --------------------------- | :-----------: | :------------------: | :---------: |
| Administrar usuarios        |      Sí       |          No          |     No      |
| Administrar categorías      |      Sí       |          No          |     No      |
| Crear tickets               |      Sí       |          No          |     Sí      |
| Consultar todos los tickets |      Sí       |          No          |     No      |
| Consultar tickets asignados |      Sí       |          Sí          |     No      |
| Consultar tickets propios   |      Sí       |          No          |     Sí      |
| Asignar técnicos            |      Sí       |          No          |     No      |
| Cambiar estados             |      Sí       | Sí, si está asignado |     No      |
| Registrar solución          |      Sí       | Sí, si está asignado |     No      |
| Cerrar tickets              |      Sí       |          No          |     No      |
| Eliminar tickets            |      Sí       |          No          |     No      |
| Consultar métricas          |      Sí       |          No          |     No      |

## Ejecución local

### Backend

```bash
cd backend
pnpm install
pnpm dev
```
