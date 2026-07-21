# Requisitos del sistema HelpDesk TI

## 1. Información general

**Nombre del sistema:** HelpDesk TI  
**Tipo de software:** Aplicación web  
**Arquitectura:** Modelo–Vista–Controlador (MVC)  
**Frontend:** Angular, HTML, CSS y TypeScript  
**Backend:** Node.js, Express y TypeScript  
**Base de datos:** PostgreSQL  
**Control de versiones:** GitHub

## 2. Objetivo del sistema

Desarrollar una aplicación web que permita registrar, asignar, atender y dar seguimiento a solicitudes de soporte técnico. El sistema centralizará las incidencias tecnológicas, permitirá conocer su estado y conservará un historial de las acciones realizadas desde la creación hasta el cierre de cada ticket.

## 3. Alcance

HelpDesk TI permitirá administrar usuarios, categorías y tickets de soporte. Los solicitantes podrán registrar y consultar sus incidencias; los técnicos podrán atender los tickets asignados; y los administradores podrán gestionar toda la información, asignar responsables y consultar métricas generales.

Para mantener un alcance viable, la primera versión no incluirá chat en tiempo real, envío de correos, recuperación automática de contraseñas, archivos adjuntos ni aplicación móvil.

## 4. Actores del sistema

| Actor | Descripción | Permisos principales |
|---|---|---|
| Administrador | Responsable de controlar y configurar el sistema. | Gestionar usuarios y categorías, consultar todos los tickets, asignar técnicos, cambiar estados, eliminar registros y consultar métricas. |
| Técnico | Persona encargada de resolver incidencias tecnológicas. | Consultar tickets asignados, iniciar su atención, registrar la solución y cambiar su estado. |
| Solicitante | Usuario que necesita asistencia técnica. | Iniciar sesión, crear tickets, consultar sus propios tickets y editar los que todavía estén pendientes. |

## 5. Requisitos funcionales

Los requisitos funcionales describen las operaciones que el sistema deberá ejecutar.

### RF-01. Inicio de sesión

**Descripción:** El sistema deberá permitir que los usuarios registrados inicien sesión mediante correo electrónico y contraseña.

**Criterios de aceptación:**

- Si las credenciales son correctas, el usuario será dirigido al panel correspondiente a su rol.
- Si las credenciales son incorrectas, el sistema mostrará un mensaje comprensible sin revelar información sensible.
- Los usuarios inactivos no podrán iniciar sesión.

### RF-02. Cierre de sesión

**Descripción:** El sistema deberá permitir que cualquier usuario autenticado cierre su sesión.

**Criterios de aceptación:**

- Al cerrar sesión, se eliminará la información local de autenticación.
- El usuario será dirigido nuevamente a la pantalla de inicio de sesión.
- Las páginas privadas no podrán abrirse después del cierre de sesión.

### RF-03. Control de acceso por roles

**Descripción:** El sistema deberá mostrar y permitir únicamente las funciones autorizadas para el rol de administrador, técnico o solicitante.

**Criterios de aceptación:**

- Un solicitante no podrá ingresar a la administración de usuarios o categorías.
- Un técnico solo podrá gestionar los tickets que le hayan sido asignados.
- Un administrador podrá acceder a todos los módulos.
- El backend deberá comprobar los permisos aunque se intente acceder directamente a una ruta de la API.

### RF-04. Gestión de usuarios

**Descripción:** El administrador deberá poder crear, consultar, actualizar y desactivar usuarios.

**Datos mínimos:** Nombre, correo electrónico, contraseña, rol y estado.

**Criterios de aceptación:**

- El correo electrónico deberá ser único.
- El administrador podrá cambiar el nombre, rol y estado de un usuario.
- La desactivación impedirá el inicio de sesión sin borrar el historial del usuario.
- El sistema solicitará confirmación antes de desactivar un usuario.

### RF-05. Gestión de categorías

**Descripción:** El administrador deberá poder crear, consultar, actualizar y eliminar o desactivar categorías de soporte.

**Ejemplos:** Hardware, software, red, acceso al sistema y periféricos.

**Criterios de aceptación:**

- No se permitirán categorías sin nombre.
- No se permitirán categorías duplicadas.
- Las categorías activas aparecerán en el formulario de creación de tickets.
- Una categoría utilizada en tickets anteriores no deberá eliminarse físicamente.

### RF-06. Registro de tickets

**Descripción:** El solicitante y el administrador deberán poder registrar un nuevo ticket de soporte.

**Datos mínimos:** Título, descripción, categoría y prioridad.

**Criterios de aceptación:**

- El título, descripción, categoría y prioridad serán obligatorios.
- El sistema generará automáticamente un código único para el ticket.
- El ticket se registrará inicialmente con estado **PENDIENTE**.
- El sistema guardará el solicitante y la fecha de creación.
- Después de guardar, se mostrará una confirmación y el código del ticket.

### RF-07. Consulta de tickets

**Descripción:** El sistema deberá mostrar una lista de tickets de acuerdo con el rol del usuario.

**Criterios de aceptación:**

- El solicitante visualizará únicamente sus propios tickets.
- El técnico visualizará los tickets que tenga asignados.
- El administrador visualizará todos los tickets.
- La lista mostrará como mínimo código, título, prioridad, estado, responsable y fecha.

### RF-08. Consulta del detalle de un ticket

**Descripción:** El usuario autorizado deberá poder consultar toda la información de un ticket.

**Criterios de aceptación:**

- Se mostrarán los datos del solicitante, categoría, descripción, prioridad, estado, técnico, solución, fechas e historial.
- Un usuario sin autorización no podrá consultar el ticket mediante una URL directa.

### RF-09. Actualización de tickets

**Descripción:** El sistema deberá permitir la actualización de un ticket según el rol y el estado actual.

**Criterios de aceptación:**

- El solicitante podrá corregir el título, descripción, categoría o prioridad mientras el ticket esté **PENDIENTE**.
- El administrador podrá corregir la información cuando sea necesario.
- Los cambios deberán validarse antes de guardarse.
- La fecha de actualización deberá registrarse automáticamente.

### RF-10. Eliminación lógica de tickets

**Descripción:** El administrador deberá poder eliminar de manera lógica un ticket, conservando la información para auditoría.

**Criterios de aceptación:**

- El sistema solicitará confirmación antes de eliminar.
- El ticket eliminado no aparecerá en las consultas normales.
- La información permanecerá en la base de datos y podrá ser identificada como inactiva o eliminada.

### RF-11. Asignación de técnicos

**Descripción:** El administrador deberá poder asignar un técnico activo a un ticket pendiente.

**Criterios de aceptación:**

- Solo aparecerán técnicos activos en la lista de asignación.
- Al asignar un técnico, el estado cambiará a **ASIGNADO**.
- El sistema registrará quién realizó la asignación y cuándo la realizó.
- El técnico podrá visualizar el ticket después de la asignación.

### RF-12. Cambio de estado

**Descripción:** El técnico asignado y el administrador deberán poder actualizar el estado de un ticket.

**Flujo normal:** PENDIENTE → ASIGNADO → EN PROCESO → RESUELTO → CERRADO.

**Criterios de aceptación:**

- El sistema solo permitirá transiciones válidas.
- Un técnico no podrá modificar tickets asignados a otro técnico.
- Cada cambio de estado quedará registrado en el historial.
- Para marcar un ticket como **RESUELTO**, será obligatorio registrar una solución.

### RF-13. Registro de solución e historial

**Descripción:** El sistema deberá permitir registrar la solución aplicada y conservar el historial de acciones del ticket.

**Criterios de aceptación:**

- La solución deberá identificar al técnico y la fecha de registro.
- El historial mostrará el estado anterior, el nuevo estado, el usuario responsable, la observación y la fecha.
- Los registros del historial no podrán ser modificados por usuarios comunes.

### RF-14. Búsqueda y filtros

**Descripción:** El sistema deberá permitir localizar tickets mediante búsquedas y filtros.

**Criterios de aceptación:**

- Se podrá buscar por código o título.
- Se podrá filtrar por estado, prioridad, categoría y técnico.
- El administrador podrá combinar más de un filtro.
- El sistema informará cuando no existan resultados.

### RF-15. Panel de métricas

**Descripción:** El administrador deberá disponer de un panel con información resumida del funcionamiento del sistema.

**Indicadores mínimos:**

- Total de tickets registrados.
- Tickets pendientes, asignados, en proceso, resueltos y cerrados.
- Tickets agrupados por prioridad.
- Tickets agrupados por categoría.
- Cantidad de tickets asignados a cada técnico.
- Tiempo promedio de resolución, cuando existan datos suficientes.

**Criterios de aceptación:**

- Los valores deberán corresponder con la información almacenada en PostgreSQL.
- El panel deberá actualizarse después de registrar o modificar tickets.

## 6. Requisitos no funcionales

Los requisitos no funcionales establecen las condiciones de calidad, seguridad y funcionamiento del sistema.

### RNF-01. Usabilidad

La interfaz deberá ser clara, consistente y fácil de utilizar. Los formularios tendrán etiquetas visibles, botones comprensibles y mensajes que indiquen si una operación se realizó correctamente o presentó un error.

**Verificación:** Un usuario deberá completar el registro y la consulta de un ticket sin necesitar instrucciones externas.

### RNF-02. Diseño adaptable

La aplicación deberá visualizarse correctamente en computadoras y dispositivos móviles, sin superposición ni pérdida de información esencial.

**Verificación:** Se probarán las pantallas principales en resoluciones de escritorio y móvil.

### RNF-03. Rendimiento

Las operaciones normales de inicio de sesión, consulta, creación y actualización deberán responder en un máximo de tres segundos en el ambiente local de pruebas y con hasta 1.000 tickets registrados.

**Verificación:** Se medirá el tiempo de respuesta de los endpoints principales y de las pantallas asociadas.

### RNF-04. Protección de contraseñas

Las contraseñas deberán almacenarse mediante un algoritmo de hash seguro, utilizando bcrypt. Nunca deberán guardarse o mostrarse como texto simple.

**Verificación:** Se comprobará directamente que la base de datos no contenga contraseñas legibles.

### RNF-05. Autenticación segura

La autenticación utilizará tokens JWT con tiempo de expiración. Toda ruta privada deberá verificar la validez del token antes de procesar una solicitud.

**Verificación:** Una petición sin token, con token inválido o expirado deberá ser rechazada.

### RNF-06. Validación de entradas

Los datos deberán validarse tanto en Angular como en el backend. El sistema deberá rechazar campos obligatorios vacíos, correos inválidos, valores no permitidos y textos que excedan la longitud definida.

**Verificación:** Se ejecutarán casos de prueba con entradas válidas, inválidas, vacías y fuera de rango.

### RNF-07. Control de autorización

Los permisos deberán comprobarse en el backend y no depender únicamente de que una opción esté oculta en la interfaz.

**Verificación:** Se intentará acceder a endpoints restringidos con cuentas de diferentes roles.

### RNF-08. Manejo de errores

El sistema deberá manejar los errores sin detener la aplicación ni mostrar consultas SQL, claves, rutas internas o detalles técnicos sensibles.

**Verificación:** Los errores devolverán mensajes comprensibles y códigos HTTP apropiados, como 400, 401, 403, 404 y 500.

### RNF-09. Integridad de la información

PostgreSQL deberá utilizar claves primarias, claves foráneas, restricciones de unicidad y campos obligatorios para evitar información inválida o relaciones inexistentes.

**Verificación:** La base de datos deberá rechazar correos duplicados, tickets sin solicitante y referencias a categorías o técnicos inexistentes.

### RNF-10. Trazabilidad

Las asignaciones, cambios de estado y soluciones deberán guardar el usuario responsable y la fecha de la acción.

**Verificación:** El historial deberá permitir reconstruir el proceso seguido por cada ticket.

### RNF-11. Mantenibilidad

El código deberá organizarse por módulos y respetar la arquitectura MVC. Se utilizarán nombres comprensibles, TypeScript, funciones con responsabilidades específicas y separación entre modelos, controladores, rutas, servicios, componentes y vistas.

**Verificación:** La estructura del repositorio y el análisis de código deberán evidenciar la separación de responsabilidades.

### RNF-12. Configuración segura

Las credenciales de PostgreSQL, claves JWT y demás valores sensibles se almacenarán en variables de entorno. El archivo `.env` no deberá subirse a GitHub; se mantendrá un archivo `.env.example` sin datos reales.

**Verificación:** Se revisará el historial y el contenido del repositorio para confirmar que no existan secretos publicados.

### RNF-13. Compatibilidad

La aplicación deberá funcionar correctamente en las versiones utilizadas durante las pruebas de Google Chrome, Microsoft Edge y Mozilla Firefox.

**Verificación:** Se ejecutará el flujo principal en los tres navegadores y se registrarán los resultados.

### RNF-14. Calidad del software

La calidad se evaluará mediante el modelo ISO 9126, considerando funcionalidad, fiabilidad, usabilidad, eficiencia, mantenibilidad y portabilidad. El informe deberá justificar cómo el sistema satisface cada característica.

**Verificación:** El informe final incluirá una sección con la evaluación y las evidencias correspondientes.

### RNF-15. Pruebas de software

El proyecto deberá incluir casos de prueba y evidencias de pruebas funcionales, de validación y de sistema. También se realizarán pruebas de autenticación, autorización y CRUD.

**Verificación:** Cada caso registrará identificador, objetivo, datos de entrada, procedimiento, resultado esperado, resultado obtenido y estado final.

### RNF-16. Cobertura de pruebas

Las funciones críticas de autenticación y gestión de tickets deberán contar con pruebas automatizadas. Se establece como meta una cobertura mínima del 70 % en los controladores y servicios críticos del backend.

**Verificación:** Se generará y conservará el reporte de cobertura producido por la herramienta de pruebas.

### RNF-17. Métricas

El equipo deberá obtener métricas de calidad, código y pruebas. Como mínimo se registrarán cobertura, pruebas aprobadas y fallidas, errores encontrados, complejidad o incidencias del código y cantidad de commits por integrante.

**Verificación:** Las métricas y su interpretación se incorporarán al informe final.

### RNF-18. Gestión de configuración y versiones

El código fuente y la documentación deberán mantenerse en GitHub. Cada integrante utilizará su propia cuenta y realizará commits pequeños con mensajes descriptivos.

**Verificación:** El historial del repositorio deberá identificar el autor, fecha y descripción de cada cambio.

## 7. Reglas de negocio

| Código | Regla |
|---|---|
| RN-01 | Cada usuario deberá tener un correo electrónico único. |
| RN-02 | Solo los usuarios activos podrán iniciar sesión. |
| RN-03 | Cada ticket tendrá un código único generado automáticamente. |
| RN-04 | Todo ticket nuevo comenzará con estado PENDIENTE. |
| RN-05 | Solo el administrador podrá asignar o reasignar técnicos. |
| RN-06 | Solo el técnico asignado o el administrador podrán cambiar el estado de un ticket. |
| RN-07 | Para marcar un ticket como RESUELTO será obligatorio registrar una solución. |
| RN-08 | Los tickets, usuarios o categorías relacionados con información histórica se desactivarán mediante eliminación lógica. |
| RN-09 | Cada cambio importante deberá guardar responsable, fecha y detalle de la acción. |
| RN-10 | El solicitante solo podrá consultar sus propios tickets. |

## 8. Correspondencia con los lineamientos del proyecto

| Lineamiento recibido | Aplicación en HelpDesk TI |
|---|---|
| CRUD completo | CRUD de usuarios, categorías y tickets. |
| Autenticación de usuarios | Login, cierre de sesión, JWT y usuarios activos. |
| Interfaz usable | Formularios claros, mensajes, navegación por roles y diseño adaptable. |
| Modelo de calidad | Aplicación y justificación de ISO 9126. |
| Casos y tipos de prueba | Pruebas funcionales, de validación, sistema, autenticación y autorización. |
| Validación de entradas | Validación en Angular y Node.js. |
| Control de acceso | Roles de administrador, técnico y solicitante. |
| Manejo de errores | Mensajes controlados y códigos HTTP apropiados. |
| Gestión de configuración | Repositorio GitHub y evidencia de commits. |
| Métricas | Métricas de calidad, código y pruebas. |
| Informe final | Requisitos, UML, calidad, pruebas, seguridad, métricas y conclusiones. |

## 9. Fuentes

[1] Imagen `6a2df0da-5621-4cc3-9f62-9b87fbee9a55.png`. Lineamientos generales del proyecto de Ingeniería de Software II: funcionalidad, calidad, pruebas, seguridad, control de versiones y métricas.

[2] Imagen `9010107a-bd1e-4e04-a649-bc2a46e7bd5c.png`. Estructura solicitada para el informe final: introducción, descripción, requisitos, diseño UML, calidad, pruebas, seguridad, métricas y conclusiones.

