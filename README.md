# HelpDesk TI MVC

Sistema web para la gestión de tickets de soporte técnico desarrollado con
Angular, Node.js, Express, TypeScript y PostgreSQL bajo arquitectura MVC.

## Estado del desarrollo

**Avance actual:** 11 de 12 pasos completados (92 %).

La autenticación, los módulos principales del backend, la integración
frontend-backend y la ejecución formal de pruebas están terminados.

El sistema dispone de interfaces funcionales para los roles administrador,
técnico y solicitante, además de CRUD, gestión completa de tickets, historial,
métricas, validaciones y pruebas automatizadas.

Las pruebas finalizaron con 40 casos aprobados en el frontend, 35 en el
backend y 13 comprobaciones automatizadas de seguridad. Los 13 casos
funcionales y los 5 casos de sistema también fueron aprobados.

El siguiente paso es obtener las métricas finales de calidad, cobertura,
código y control de versiones, y redactar el informe final del proyecto.

## Plan de desarrollo

| N.º | Paso                                               | Estado     | Resultado                                           |
| --: | -------------------------------------------------- | ---------- | --------------------------------------------------- |
|   1 | Crear el repositorio en GitHub                     | COMPLETADO | Repositorio principal y evidencia de commits        |
|   2 | Agregar `frontend`, `backend`, `database` y `docs` | COMPLETADO | Estructura organizada por componentes               |
|   3 | Definir requisitos                                 | COMPLETADO | Requisitos funcionales, no funcionales y reglas     |
|   4 | Diseñar la base de datos                           | COMPLETADO | Esquema, datos iniciales, diagrama y diccionario    |
|   5 | Inicializar Angular                                | COMPLETADO | Proyecto frontend con HTML, CSS y TypeScript        |
|   6 | Inicializar Node.js, Express y TypeScript          | COMPLETADO | API organizada bajo arquitectura MVC                |
|   7 | Configurar PostgreSQL                              | COMPLETADO | Conexión y comprobación desde el backend            |
|   8 | Implementar autenticación                          | COMPLETADO | bcrypt, JWT y autorización por roles                |
|   9 | Desarrollar los CRUD                               | COMPLETADO | Usuarios, categorías, tickets, historial y métricas |
|  10 | Integrar frontend y backend                        | COMPLETADO | Aplicación Angular conectada con todos los flujos   |
|  11 | Ejecutar pruebas                                   | COMPLETADO | 88 comprobaciones automatizadas y flujos aprobados  |
|  12 | Obtener métricas y redactar el informe             | PENDIENTE  | Métricas de calidad e informe final                 |

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

## Calidad y pruebas

| Grupo                  | Aprobadas | Fallidas |
| ---------------------- | --------: | -------: |
| Frontend               |        40 |        0 |
| Backend                |        35 |        0 |
| Seguridad API          |        13 |        0 |
| **Total automatizado** |    **88** |    **0** |

También se aprobaron:

- 13 casos funcionales.
- 5 casos de sistema.
- El flujo completo de tickets.
- La navegación y los paneles según el rol.
- Las verificaciones de autenticación y autorización.

Documentación:

- [Plan de pruebas](docs/paso-11-plan-pruebas.md)
- [Consolidación del paso 11](docs/paso-11-pruebas.md)
- [Resultados completos](docs/pruebas/resultados-funcionales-seguridad-sistema.md)
- [Evidencias](docs/pruebas/README.md)

## Ejecución local

### Backend

```bash
cd backend
pnpm install
pnpm dev
```
