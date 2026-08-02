# Resultados de pruebas funcionales, seguridad y sistema

**Proyecto:** HelpDesk TI  
**Paso:** 11 - Ejecución de pruebas  
**Fecha de ejecución:** 02/08/2026  
**Estado general:** APROBADO  
**Arquitectura:** Modelo–Vista–Controlador (MVC)

## 1. Objetivo

Comprobar el funcionamiento completo de HelpDesk TI mediante pruebas automatizadas, funcionales, de seguridad y de sistema.

Las pruebas verificaron la integración entre Angular, la API REST desarrollada con Node.js y Express, y la base de datos PostgreSQL. También se comprobaron los permisos correspondientes a los roles de administrador, técnico y solicitante.

## 2. Ambiente de pruebas

| Elemento            | Configuración utilizada             | Estado   |
| ------------------- | ----------------------------------- | -------- |
| Sistema operativo   | Windows                             | APROBADO |
| Frontend            | Angular y TypeScript                | APROBADO |
| Backend             | Node.js, Express y TypeScript       | APROBADO |
| Base de datos       | PostgreSQL local                    | APROBADO |
| Navegador principal | Google Chrome                       | APROBADO |
| Pruebas frontend    | Vitest                              | APROBADO |
| Pruebas backend     | Ejecutor configurado en el proyecto | APROBADO |
| API REST            | `http://localhost:3000/api`         | APROBADO |

## 3. Resumen de resultados automatizados

| Capa                 | Aprobadas | Fallidas | Estado   | Evidencia                                                        |
| -------------------- | --------: | -------: | -------- | ---------------------------------------------------------------- |
| Frontend             |        40 |        0 | APROBADO | [Ver pruebas del frontend](./evidencias/frontend-pruebas-40.png) |
| Compilación frontend |         1 |        0 | APROBADO | [Ver build del frontend](./evidencias/frontend-build.png)        |
| Backend              |        35 |        0 | APROBADO | [Ver pruebas del backend](./evidencias/backend-pruebas-35.png)   |
| Compilación backend  |         1 |        0 | APROBADO | [Ver build del backend](./evidencias/backend-build.png)          |
| Seguridad API        |        13 |        0 | APROBADO | [Ver resultado de seguridad](./evidencias/seguridad-api.txt)     |

Las 40 pruebas del frontend comprobaron componentes, servicios, autenticación, guards, interceptor, operaciones CRUD, filtros, errores HTTP y el flujo completo de tickets.

Las 35 pruebas del backend comprobaron autenticación, autorización, usuarios, categorías, catálogos, tickets, asignaciones, estados, historial y métricas.

## 4. Pruebas funcionales

| ID     | Flujo evaluado                      | Resultado esperado                               | Resultado obtenido                                                              | Estado   | Evidencia                                                    |
| ------ | ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| FUN-01 | Inicio de sesión como administrador | Acceder al panel administrativo                  | El administrador inició sesión y visualizó todas las opciones autorizadas       | APROBADO | [Ver evidencia](./evidencias/FUN-01-login-administrador.png) |
| FUN-02 | Inicio de sesión como técnico       | Acceder al panel de asignaciones                 | El técnico inició sesión y visualizó sus tickets asignados                      | APROBADO | [Ver evidencia](./evidencias/FUN-02-login-tecnico.png)       |
| FUN-03 | Inicio de sesión como solicitante   | Acceder al panel de solicitudes propias          | El solicitante inició sesión y visualizó únicamente sus tickets                 | APROBADO | [Ver evidencia](./evidencias/FUN-03-login-solicitante.png)   |
| FUN-04 | Navegación según el rol             | Mostrar únicamente opciones autorizadas          | El menú cambió correctamente según el usuario autenticado                       | APROBADO | [Ver evidencia](./evidencias/FUN-04-menu-segun-rol.png)      |
| FUN-05 | Creación de ticket                  | Generar código único y estado PENDIENTE          | El ticket fue creado con código automático y estado Pendiente                   | APROBADO | [Ver evidencia](./evidencias/FUN-05-ticket-creado.png)       |
| FUN-06 | Búsqueda y filtros                  | Localizar el ticket por código, título y filtros | El sistema mostró correctamente los resultados coincidentes                     | APROBADO | [Ver evidencia](./evidencias/FUN-06-busqueda-ticket.png)     |
| FUN-07 | Actualización de ticket             | Guardar los cambios permitidos                   | El título, descripción, categoría o prioridad fueron actualizados correctamente | APROBADO | [Ver evidencia](./evidencias/FUN-07-ticket-actualizado.png)  |
| FUN-08 | Asignación de técnico               | Asignar responsable y cambiar a ASIGNADO         | El técnico fue asignado y el estado cambió a Asignado                           | APROBADO | [Ver evidencia](./evidencias/FUN-08-ticket-asignado.png)     |
| FUN-09 | Inicio de atención                  | Cambiar el estado a EN PROCESO                   | El técnico inició la atención y el historial registró la acción                 | APROBADO | [Ver evidencia](./evidencias/FUN-09-ticket-en-proceso.png)   |
| FUN-10 | Registro de solución                | Exigir solución y cambiar a RESUELTO             | La solución fue almacenada y el estado cambió a Resuelto                        | APROBADO | [Ver evidencia](./evidencias/FUN-10-ticket-resuelto.png)     |
| FUN-11 | Cierre del ticket                   | Cambiar de RESUELTO a CERRADO                    | El administrador cerró correctamente el ticket                                  | APROBADO | [Ver evidencia](./evidencias/FUN-11-ticket-cerrado.png)      |
| FUN-12 | Consulta del historial              | Mostrar acciones, estados, responsables y fechas | El historial presentó cronológicamente todas las acciones realizadas            | APROBADO | [Ver evidencia](./evidencias/FUN-12-historial-ticket.png)    |
| FUN-13 | Consulta de métricas                | Mostrar valores actualizados del sistema         | El panel administrativo reflejó los tickets y estados almacenados               | APROBADO | [Ver evidencia](./evidencias/FUN-13-metricas.png)            |

### Resultado funcional

| Indicador           | Resultado |
| ------------------- | --------: |
| Casos ejecutados    |        13 |
| Casos aprobados     |        13 |
| Casos fallidos      |         0 |
| Porcentaje aprobado |     100 % |

## 5. Pruebas de seguridad

| ID     | Prueba                              | Resultado esperado | Resultado obtenido | Estado   |
| ------ | ----------------------------------- | -----------------: | -----------------: | -------- |
| SEG-01 | Login de administrador              |           HTTP 200 |           HTTP 200 | APROBADO |
| SEG-02 | Login de técnico                    |           HTTP 200 |           HTTP 200 | APROBADO |
| SEG-03 | Login de solicitante                |           HTTP 200 |           HTTP 200 | APROBADO |
| SEG-04 | Credenciales incorrectas            |           HTTP 401 |           HTTP 401 | APROBADO |
| SEG-05 | Ruta privada sin token              |           HTTP 401 |           HTTP 401 | APROBADO |
| SEG-06 | Ruta privada con token inválido     |           HTTP 401 |           HTTP 401 | APROBADO |
| SEG-07 | Solicitante consulta usuarios       |           HTTP 403 |           HTTP 403 | APROBADO |
| SEG-08 | Técnico intenta crear una categoría |           HTTP 403 |           HTTP 403 | APROBADO |
| SEG-09 | Administrador consulta usuarios     |           HTTP 200 |           HTTP 200 | APROBADO |
| SEG-10 | Solicitante consulta sus tickets    |           HTTP 200 |           HTTP 200 | APROBADO |
| SEG-11 | Técnico consulta sus asignaciones   |           HTTP 200 |           HTTP 200 | APROBADO |
| SEG-12 | Administrador consulta métricas     |           HTTP 200 |           HTTP 200 | APROBADO |
| SEG-13 | Solicitante consulta métricas       |           HTTP 403 |           HTTP 403 | APROBADO |

La ejecución completa está disponible en [seguridad-api.txt](./evidencias/seguridad-api.txt).

### Resultado de seguridad

| Indicador           | Resultado |
| ------------------- | --------: |
| Casos ejecutados    |        13 |
| Casos aprobados     |        13 |
| Casos fallidos      |         0 |
| Porcentaje aprobado |     100 % |

Las pruebas confirmaron que:

- Las rutas privadas rechazan solicitudes sin token.
- Los tokens inválidos son rechazados.
- Las credenciales incorrectas no generan una sesión.
- Los roles no pueden acceder a operaciones no autorizadas.
- El administrador puede utilizar los módulos administrativos.
- El técnico solo accede a sus funciones autorizadas.
- El solicitante consulta sus tickets y no puede acceder a la administración.
- Las respuestas utilizan códigos HTTP apropiados.

## 6. Pruebas de sistema

| ID     | Prueba                           | Resultado esperado                                  | Resultado obtenido                                                      | Estado   | Evidencia                                                          |
| ------ | -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| SIS-01 | Comunicación Angular–API         | Ejecutar solicitudes sin errores de integración     | Angular se comunicó correctamente con la API REST                       | APROBADO | [Ver ticket creado](./evidencias/FUN-05-ticket-creado.png)         |
| SIS-02 | Persistencia en PostgreSQL       | Conservar usuarios, categorías, tickets e historial | La información permaneció almacenada después de guardar                 | APROBADO | [Ver historial](./evidencias/FUN-12-historial-ticket.png)          |
| SIS-03 | Persistencia después de recargar | Mantener el estado y la información del ticket      | El ticket conservó su estado, solución e historial después de recargar  | APROBADO | [Ver ticket cerrado](./evidencias/FUN-11-ticket-cerrado.png)       |
| SIS-04 | Cierre de sesión                 | Eliminar sesión y bloquear rutas privadas           | La sesión fue eliminada y el usuario regresó al login                   | APROBADO | [Ver paneles por rol](./evidencias/FUN-04-menu-segun-rol.png)      |
| SIS-05 | Flujo completo por roles         | Llevar un ticket desde PENDIENTE hasta CERRADO      | Solicitante, administrador y técnico completaron correctamente el flujo | APROBADO | [Ver historial completo](./evidencias/FUN-12-historial-ticket.png) |

### Flujo completo comprobado

1. El solicitante inició sesión.
2. El solicitante creó un ticket.
3. El sistema generó un código único.
4. El ticket se registró como PENDIENTE.
5. El administrador consultó y actualizó el ticket.
6. El administrador asignó un técnico.
7. El estado cambió a ASIGNADO.
8. El técnico inició la atención.
9. El estado cambió a EN PROCESO.
10. El técnico registró la solución.
11. El estado cambió a RESUELTO.
12. El administrador cerró el ticket.
13. El estado cambió a CERRADO.
14. El historial conservó las acciones realizadas.
15. El panel de métricas reflejó los cambios.

## 7. Validaciones y manejo de errores

| Comprobación             | Resultado                                      | Estado   |
| ------------------------ | ---------------------------------------------- | -------- |
| Campos obligatorios      | Los formularios rechazaron campos vacíos       | APROBADO |
| Correos inválidos        | El sistema rechazó formatos incorrectos        | APROBADO |
| Credenciales incorrectas | Se presentó un mensaje controlado              | APROBADO |
| Recursos inexistentes    | La API respondió con HTTP 404                  | APROBADO |
| Acceso no autenticado    | La API respondió con HTTP 401                  | APROBADO |
| Acceso sin permisos      | La API respondió con HTTP 403                  | APROBADO |
| Error del servidor       | El frontend recibió y manejó HTTP 500          | APROBADO |
| Eliminación lógica       | Los datos históricos permanecieron almacenados | APROBADO |

## 8. Defectos encontrados

Durante la ejecución final no se encontraron defectos funcionales, de seguridad o de sistema pendientes.

La prueba inicial SEG-08 fue corregida porque la consulta de categorías mediante `GET` está permitida para los usuarios autenticados. Esto es necesario para mostrar las categorías en los formularios y filtros de tickets. La comprobación definitiva se realizó intentando crear una categoría con el rol de técnico, operación que fue correctamente rechazada con HTTP 403.

| ID     | Descripción                              | Clasificación                 | Estado   |
| ------ | ---------------------------------------- | ----------------------------- | -------- |
| OBS-01 | Ajuste de la expectativa del caso SEG-08 | Corrección del caso de prueba | RESUELTO |

## 9. Evidencias registradas

### Automatización

- [Pruebas del frontend](./evidencias/frontend-pruebas-40.png)
- [Build del frontend](./evidencias/frontend-build.png)
- [Pruebas del backend](./evidencias/backend-pruebas-35.png)
- [Build del backend](./evidencias/backend-build.png)
- [Pruebas de seguridad](./evidencias/seguridad-api.txt)

### Paneles según el rol

- [Panel del administrador](./evidencias/FUN-01-login-administrador.png)
- [Panel del técnico](./evidencias/FUN-02-login-tecnico.png)
- [Panel del solicitante](./evidencias/FUN-03-login-solicitante.png)
- [Menú según el rol](./evidencias/FUN-04-menu-segun-rol.png)

### Flujo del ticket

- [Ticket creado](./evidencias/FUN-05-ticket-creado.png)
- [Búsqueda del ticket](./evidencias/FUN-06-busqueda-ticket.png)
- [Ticket actualizado](./evidencias/FUN-07-ticket-actualizado.png)
- [Técnico asignado](./evidencias/FUN-08-ticket-asignado.png)
- [Ticket en proceso](./evidencias/FUN-09-ticket-en-proceso.png)
- [Ticket resuelto](./evidencias/FUN-10-ticket-resuelto.png)
- [Ticket cerrado](./evidencias/FUN-11-ticket-cerrado.png)
- [Historial completo](./evidencias/FUN-12-historial-ticket.png)
- [Métricas actualizadas](./evidencias/FUN-13-metricas.png)

## 10. Métricas finales

| Métrica                               | Resultado |
| ------------------------------------- | --------: |
| Pruebas automatizadas del frontend    |        40 |
| Pruebas automatizadas del backend     |        35 |
| Pruebas automatizadas de seguridad    |        13 |
| Total de comprobaciones automatizadas |        88 |
| Pruebas automatizadas fallidas        |         0 |
| Casos funcionales aprobados           |  13 de 13 |
| Casos de sistema aprobados            |    5 de 5 |
| Defectos críticos pendientes          |         0 |
| Defectos altos pendientes             |         0 |

## 11. Conclusión

Las pruebas funcionales, de seguridad y de sistema permitieron comprobar satisfactoriamente la integración entre Angular, la API REST desarrollada con Node.js y Express, y PostgreSQL.

Los flujos correspondientes al administrador, técnico y solicitante funcionaron correctamente. Se comprobó la creación, consulta, actualización, asignación, atención, resolución y cierre de tickets, así como el registro cronológico del historial y la actualización del panel de métricas.

Las pruebas de seguridad confirmaron la protección de las rutas privadas mediante JWT y el cumplimiento de los permisos establecidos para cada rol. Las solicitudes sin autenticación, con tokens inválidos o realizadas por usuarios sin autorización fueron rechazadas mediante los códigos HTTP correspondientes.

Las pruebas automatizadas del frontend, backend y seguridad finalizaron sin errores. No quedaron defectos críticos o altos pendientes. Por lo tanto, el paso 11 se considera completado y aprobado.
