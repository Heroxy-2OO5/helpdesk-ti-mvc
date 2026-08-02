# Verificación de flujos completos del sistema

**Proyecto:** HelpDesk TI  
**Paso:** 10 - Integración frontend y backend  
**Fecha de verificación:** 1 de agosto de 2026  
**Estado:** APROBADO

## Objetivo

Comprobar que el frontend Angular se comunica correctamente con la API REST,
que los flujos principales funcionan de principio a fin y que cada usuario
solo puede ejecutar las acciones autorizadas para su rol.

## Entorno verificado

- Frontend: Angular 22, TypeScript, HTML y CSS.
- Backend: Node.js, Express y TypeScript.
- Base de datos: PostgreSQL.
- Autenticación: JWT.
- Navegador utilizado: Google Chrome.
- Frontend local: `http://localhost:4200`.
- Backend local: `http://localhost:3000`.

## Resultados automatizados

| Componente               | Comando                     | Resultado          |
| ------------------------ | --------------------------- | ------------------ |
| Tipado del backend       | `pnpm typecheck`            | APROBADO           |
| Compilación del backend  | `pnpm build`                | APROBADO           |
| Pruebas del backend      | `pnpm test`                 | 35 de 35 aprobadas |
| Pruebas del frontend     | `npm test -- --watch=false` | 6 de 6 aprobadas   |
| Compilación del frontend | `npm run build`             | APROBADO           |

## Matriz de flujos funcionales

| ID   | Rol           | Flujo verificado                                 | Resultado esperado                      | Resultado |
| ---- | ------------- | ------------------------------------------------ | --------------------------------------- | --------- |
| F-01 | Todos         | Iniciar sesión con credenciales válidas          | Acceso al panel correspondiente al rol  | APROBADO  |
| F-02 | Todos         | Iniciar sesión con contraseña incorrecta         | Mensaje controlado y sesión no iniciada | APROBADO  |
| F-03 | Administrador | Crear, editar, desactivar y reactivar usuarios   | CRUD conectado con la API               | APROBADO  |
| F-04 | Administrador | Crear, editar, desactivar y reactivar categorías | CRUD conectado con la API               | APROBADO  |
| F-05 | Solicitante   | Crear un ticket                                  | Código automático y estado pendiente    | APROBADO  |
| F-06 | Solicitante   | Actualizar un ticket pendiente                   | Datos modificados correctamente         | APROBADO  |
| F-07 | Solicitante   | Intentar acceder a rutas administrativas         | Acceso rechazado y redirección          | APROBADO  |
| F-08 | Administrador | Asignar un técnico                               | Responsable e historial actualizados    | APROBADO  |
| F-09 | Técnico       | Consultar tickets asignados                      | Solo se muestran sus asignaciones       | APROBADO  |
| F-10 | Técnico       | Cambiar a en proceso y resolver                  | Estados y solución almacenados          | APROBADO  |
| F-11 | Solicitante   | Consultar solución e historial                   | Información actualizada visible         | APROBADO  |
| F-12 | Administrador | Cerrar el ticket                                 | Ticket finalizado correctamente         | APROBADO  |
| F-13 | Todos         | Utilizar búsqueda, filtros y paginación          | Resultados correspondientes al rol      | APROBADO  |
| F-14 | Administrador | Consultar el panel de métricas                   | Valores consistentes con los tickets    | APROBADO  |
| F-15 | Todos         | Cerrar sesión y acceder a ruta protegida         | Redirección al inicio de sesión         | APROBADO  |
| F-16 | Administrador | Eliminar lógicamente un ticket                   | Ticket oculto y trazabilidad conservada | APROBADO  |

## Validaciones comprobadas

- Los campos obligatorios impiden envíos incompletos.
- Los correos duplicados muestran un mensaje controlado.
- Las categorías duplicadas son rechazadas.
- Las contraseñas menores a ocho caracteres no son aceptadas.
- Un solicitante solo puede modificar tickets pendientes.
- Un técnico no puede crear tickets.
- Un técnico solo consulta tickets asignados a su cuenta.
- Un ticket no puede resolverse sin registrar una solución.
- Solo un administrador puede asignar técnicos.
- Solo un administrador puede cerrar o eliminar tickets.
- Las rutas administrativas están protegidas en Angular y en la API.
- Las eliminaciones lógicas conservan el historial.

## Verificación visual

Se comprobó el funcionamiento responsive y el diseño de:

- inicio de sesión;
- panel principal dinámico por rol;
- listado, filtros y creación de tickets;
- detalle, actualización e historial;
- asignación de técnicos y cambios de estado;
- gestión administrativa de usuarios;
- gestión administrativa de categorías;
- panel administrativo de métricas;
- mensajes de carga, éxito, error y estados vacíos.

## Seguridad verificada

1. El token JWT se envía automáticamente mediante el interceptor HTTP.
2. Las rutas privadas requieren una sesión válida.
3. Las rutas administrativas requieren el rol `ADMINISTRATOR`.
4. La API vuelve a validar los permisos independientemente del frontend.
5. Al cerrar sesión se elimina la información de autenticación local.
6. Los errores mostrados no exponen consultas SQL ni información interna.

## Conclusión

Los flujos principales de HelpDesk TI fueron ejecutados correctamente desde
la interfaz Angular hasta PostgreSQL. La aplicación respeta el alcance de los
roles administrador, técnico y solicitante, y mantiene las validaciones,
permisos, estados e historial establecidos en los requisitos del sistema.
