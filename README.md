# HelpDesk TI MVC

Sistema web para la gestión de tickets de soporte técnico desarrollado con
Angular, Node.js, Express, TypeScript y PostgreSQL bajo arquitectura MVC.

## Estado del desarrollo

**Avance actual:** 9 de 12 pasos completados (75 %).

La autenticación y los módulos principales del backend están terminados. La
API dispone de CRUD de usuarios, categorías y tickets, catálogos, asignación
de técnicos, cambios de estado, historial, métricas administrativas y 35
pruebas automatizadas.

El siguiente paso es integrar el frontend Angular con la API REST.

## Plan de desarrollo

| N.º | Paso                                               | Estado     | Resultado                                                       |
| --: | -------------------------------------------------- | ---------- | --------------------------------------------------------------- |
|   1 | Crear el repositorio en GitHub                     | COMPLETADO | Repositorio principal y evidencia de commits.                   |
|   2 | Agregar `frontend`, `backend`, `database` y `docs` | COMPLETADO | Estructura organizada por componentes.                          |
|   3 | Definir requisitos                                 | COMPLETADO | Requisitos funcionales, no funcionales y reglas de negocio.     |
|   4 | Diseñar la base de datos                           | COMPLETADO | Esquema, datos iniciales, diagrama y diccionario de datos.      |
|   5 | Inicializar Angular                                | COMPLETADO | Proyecto frontend con HTML, CSS y TypeScript.                   |
|   6 | Inicializar Node.js, Express y TypeScript          | COMPLETADO | API organizada bajo arquitectura MVC.                           |
|   7 | Configurar PostgreSQL                              | COMPLETADO | Conexión y comprobación desde el backend.                       |
|   8 | Implementar autenticación                          | COMPLETADO | bcrypt, JWT y autorización por roles.                           |
|   9 | Desarrollar los CRUD                               | COMPLETADO | Usuarios, categorías, tickets, catálogos, historial y métricas. |
|  10 | Integrar frontend y backend                        | PENDIENTE  | Servicios Angular y flujos completos con la API REST.           |
|  11 | Ejecutar pruebas                                   | PENDIENTE  | Pruebas funcionales, validación, seguridad y sistema.           |
|  12 | Obtener métricas y redactar el informe             | PENDIENTE  | Métricas de calidad, código y pruebas e informe final.          |

## Componentes

- `frontend`: aplicación web desarrollada con Angular.
- `backend`: API REST desarrollada con Node.js, Express y TypeScript.
- `database`: scripts SQL y documentación del modelo de datos.
- `docs`: requisitos, documentación técnica y evidencias del desarrollo.

## Tecnologías principales

- Angular
- HTML y CSS
- TypeScript
- Node.js
- Express
- PostgreSQL
- JWT
- bcrypt
- Zod
- Git y GitHub

## Funcionalidades disponibles en el backend

- Inicio y cierre de sesión.
- Control de acceso por roles.
- CRUD y desactivación lógica de usuarios.
- CRUD y desactivación lógica de categorías.
- Catálogos de roles, prioridades y estados.
- Creación, consulta, actualización y eliminación lógica de tickets.
- Búsqueda, filtros y paginación.
- Asignación de técnicos y cambios de estado.
- Registro de soluciones e historial.
- Métricas administrativas.
- Validación de entradas y errores controlados.
- Consultas parametrizadas contra inyección SQL.

## Documentación

- [Requisitos del sistema](docs/requisitos.md)
- [Inicialización del backend](docs/paso-06-backend.md)
- [Autenticación y autorización](docs/paso-08-autenticacion.md)
- [CRUD y gestión de tickets](docs/paso-09-crud.md)
