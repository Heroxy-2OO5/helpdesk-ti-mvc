# Paso 11: Ejecución y resultados de pruebas

**Proyecto:** HelpDesk TI  
**Estado:** COMPLETADO  
**Fecha de inicio:** 02/08/2026  
**Fecha de finalización:** 02/08/2026  
**Avance alcanzado:** 11 de 12 pasos (92 %)

## 1. Objetivo

Ejecutar y documentar las pruebas funcionales, de validación, seguridad, integración y sistema de HelpDesk TI, verificando el cumplimiento de los requisitos establecidos para la primera versión.

## 2. Alcance

Las pruebas cubrieron:

- Inicio y cierre de sesión.
- Autenticación mediante JWT.
- Autorización según roles.
- Interceptor HTTP.
- Guards de autenticación y autorización.
- CRUD de usuarios.
- CRUD de categorías.
- Catálogos del sistema.
- Creación y consulta de tickets.
- Búsqueda, filtros y paginación.
- Actualización de tickets.
- Asignación de técnicos.
- Transiciones de estado.
- Registro de soluciones.
- Historial de tickets.
- Eliminación lógica.
- Panel de métricas.
- Panel de inicio según el rol.
- Integración entre Angular, API REST y PostgreSQL.
- Manejo de errores HTTP.

## 3. Commits realizados

| Commit | Descripción                                       | Resultado                                                      |
| -----: | ------------------------------------------------- | -------------------------------------------------------------- |
|     36 | Definir plan de pruebas y matriz de trazabilidad  | Plan, alcance y criterios establecidos                         |
|     37 | Probar autenticación, interceptor y guards        | Autenticación y navegación protegida verificadas               |
|     38 | Probar servicios CRUD, filtros y errores HTTP     | Operaciones y errores 400, 401, 403, 404 y 500 verificados     |
|     39 | Probar flujo completo de tickets                  | Ciclo desde creación hasta cierre y eliminación comprobado     |
|     40 | Probar componentes y paneles según el rol         | Interfaces de administrador, técnico y solicitante verificadas |
|     41 | Ejecutar pruebas funcionales, seguridad y sistema | Flujos reales y seguridad API aprobados                        |
|     42 | Consolidar resultados y actualizar el plan        | Documentación y avance general actualizados                    |

## 4. Resultados automatizados

| Capa                   | Aprobadas | Fallidas | Estado       |
| ---------------------- | --------: | -------: | ------------ |
| Frontend               |        40 |        0 | APROBADO     |
| Backend                |        35 |        0 | APROBADO     |
| Seguridad API          |        13 |        0 | APROBADO     |
| **Total automatizado** |    **88** |    **0** | **APROBADO** |

### Frontend

Las 40 pruebas del frontend comprobaron:

- Creación del componente principal.
- Servicios de usuarios, categorías, tickets y métricas.
- Inicio y persistencia de sesión.
- Interceptor JWT.
- Guards de autenticación y roles.
- Operaciones CRUD.
- Parámetros de búsqueda, filtros y paginación.
- Propagación de errores HTTP.
- Flujo completo del ticket.
- Paneles y navegación según el rol.

### Backend

Las 35 pruebas del backend comprobaron:

- Autenticación.
- Cifrado de contraseñas.
- Validación de JWT.
- Permisos por roles.
- Usuarios.
- Categorías.
- Catálogos.
- Tickets.
- Eliminación lógica.
- Asignación de técnicos.
- Cambios de estado.
- Registro de soluciones.
- Historial inmutable.
- Métricas administrativas.

### Seguridad

Las 13 pruebas de seguridad comprobaron:

- Login de los tres roles.
- Rechazo de credenciales incorrectas.
- Rechazo de solicitudes sin token.
- Rechazo de tokens inválidos.
- Restricción de usuarios.
- Restricción de categorías.
- Restricción de métricas.
- Acceso autorizado a tickets.
- Acceso administrativo correcto.

## 5. Resultados funcionales

| Tipo        | Ejecutadas | Aprobadas | Fallidas | Estado   |
| ----------- | ---------: | --------: | -------: | -------- |
| Funcionales |         13 |        13 |        0 | APROBADO |
| Sistema     |          5 |         5 |        0 | APROBADO |

Se ejecutó correctamente el siguiente flujo:

1. Inicio de sesión como solicitante.
2. Creación de un ticket.
3. Generación automática del código.
4. Registro inicial con estado PENDIENTE.
5. Consulta del ticket por parte del administrador.
6. Actualización de sus datos.
7. Asignación de un técnico.
8. Cambio automático a estado ASIGNADO.
9. Inicio de atención por el técnico.
10. Cambio a estado EN PROCESO.
11. Registro obligatorio de la solución.
12. Cambio a estado RESUELTO.
13. Cierre del ticket por el administrador.
14. Cambio a estado CERRADO.
15. Consulta del historial completo.
16. Actualización del panel de métricas.
17. Persistencia de la información en PostgreSQL.

## 6. Verificación por roles

### Administrador

Se comprobó que puede:

- Consultar todos los tickets.
- Crear y administrar usuarios.
- Crear y administrar categorías.
- Asignar técnicos.
- Actualizar tickets.
- Cambiar estados.
- Cerrar tickets.
- Aplicar eliminación lógica.
- Consultar métricas.
- Visualizar el historial.

### Técnico

Se comprobó que puede:

- Consultar sus tickets asignados.
- Iniciar la atención.
- Cambiar estados autorizados.
- Registrar la solución.
- Consultar el historial.
- Visualizar su panel de trabajo.

También se comprobó que no puede utilizar módulos administrativos.

### Solicitante

Se comprobó que puede:

- Iniciar y cerrar sesión.
- Crear tickets.
- Consultar sus propios tickets.
- Actualizar tickets permitidos.
- Consultar el estado y el historial.
- Visualizar su panel personal.

También se comprobó que no puede administrar usuarios, categorías o métricas.

## 7. Requisitos funcionales verificados

| Requisito                         | Resultado |
| --------------------------------- | --------- |
| RF-01 Inicio de sesión            | APROBADO  |
| RF-02 Cierre de sesión            | APROBADO  |
| RF-03 Control de acceso por roles | APROBADO  |
| RF-04 Gestión de usuarios         | APROBADO  |
| RF-05 Gestión de categorías       | APROBADO  |
| RF-06 Registro de tickets         | APROBADO  |
| RF-07 Consulta de tickets         | APROBADO  |
| RF-08 Detalle de ticket           | APROBADO  |
| RF-09 Actualización de tickets    | APROBADO  |
| RF-10 Eliminación lógica          | APROBADO  |
| RF-11 Asignación de técnicos      | APROBADO  |
| RF-12 Cambio de estado            | APROBADO  |
| RF-13 Solución e historial        | APROBADO  |
| RF-14 Búsqueda y filtros          | APROBADO  |
| RF-15 Panel de métricas           | APROBADO  |

## 8. Requisitos no funcionales comprobados

| Requisito                    | Resultado |
| ---------------------------- | --------- |
| Usabilidad                   | APROBADO  |
| Diseño adaptable             | APROBADO  |
| Protección de contraseñas    | APROBADO  |
| Autenticación segura         | APROBADO  |
| Validación de entradas       | APROBADO  |
| Control de autorización      | APROBADO  |
| Manejo de errores            | APROBADO  |
| Integridad de la información | APROBADO  |
| Trazabilidad                 | APROBADO  |
| Mantenibilidad               | APROBADO  |
| Configuración segura         | APROBADO  |
| Pruebas de software          | APROBADO  |
| Gestión de versiones         | APROBADO  |

Las métricas completas de cobertura, calidad y código se obtendrán en el paso 12.

## 9. Evidencias

### Documentos

- [Plan de pruebas](paso-11-plan-pruebas.md)
- [Resultados funcionales, seguridad y sistema](pruebas/resultados-funcionales-seguridad-sistema.md)
- [Índice de evidencias](pruebas/README.md)
- [Resultado de seguridad API](pruebas/evidencias/seguridad-api.txt)

### Pruebas automatizadas

- [Frontend: 40 pruebas aprobadas](pruebas/evidencias/frontend-pruebas-40.png)
- [Build del frontend](pruebas/evidencias/frontend-build.png)
- [Backend: 35 pruebas aprobadas](pruebas/evidencias/backend-pruebas-35.png)
- [Build del backend](pruebas/evidencias/backend-build.png)

### Flujo funcional

- [Panel del administrador](pruebas/evidencias/FUN-01-login-administrador.png)
- [Panel del técnico](pruebas/evidencias/FUN-02-login-tecnico.png)
- [Panel del solicitante](pruebas/evidencias/FUN-03-login-solicitante.png)
- [Creación del ticket](pruebas/evidencias/FUN-05-ticket-creado.png)
- [Asignación del técnico](pruebas/evidencias/FUN-08-ticket-asignado.png)
- [Ticket en proceso](pruebas/evidencias/FUN-09-ticket-en-proceso.png)
- [Solución registrada](pruebas/evidencias/FUN-10-ticket-resuelto.png)
- [Ticket cerrado](pruebas/evidencias/FUN-11-ticket-cerrado.png)
- [Historial completo](pruebas/evidencias/FUN-12-historial-ticket.png)
- [Métricas](pruebas/evidencias/FUN-13-metricas.png)

## 10. Defectos

No quedaron defectos críticos o altos pendientes.

La expectativa inicial del caso SEG-08 fue corregida porque la consulta de categorías está disponible para usuarios autenticados. La prueba definitiva comprobó que un técnico no puede crear categorías y obtuvo correctamente HTTP 403.

## 11. Conclusión

Las pruebas permitieron comprobar que HelpDesk TI funciona correctamente y cumple los principales requisitos definidos para la primera versión.

La aplicación Angular se integra correctamente con la API REST y PostgreSQL. Los roles de administrador, técnico y solicitante disponen únicamente de las funciones autorizadas. El flujo completo de tickets funciona desde la creación hasta el cierre, conservando la solución, los responsables, las fechas y el historial de las acciones.

Las pruebas automatizadas, funcionales, de seguridad y de sistema finalizaron sin errores. Por lo tanto, el paso 11 se considera completado.

## 12. Siguiente paso

El siguiente paso del proyecto es:

**Paso 12: Obtener métricas y redactar el informe.**

En este paso se obtendrán métricas de calidad, cobertura, pruebas y control de versiones. También se elaborará el informe final solicitado para la asignatura.
