# Paso 11: Plan de pruebas del sistema

**Proyecto:** HelpDesk TI  
**Estado:** COMPLETADO  
**Fecha de inicio:** 02/08/2026  
**Fecha de finalización:** 02/08/2026  
**Resultado:** APROBADO  
**Arquitectura:** MVC  
**Frontend:** Angular y TypeScript  
**Backend:** Node.js, Express y TypeScript  
**Base de datos:** PostgreSQL

## 1. Objetivo

Verificar que HelpDesk TI cumpla los requisitos funcionales y no funcionales definidos para la primera versión del sistema.

Las pruebas deben comprobar:

- Autenticación y cierre de sesión.
- Control de acceso por roles.
- Gestión de usuarios y categorías.
- Registro, consulta y actualización de tickets.
- Asignación de técnicos.
- Transiciones de estado.
- Registro de soluciones e historial.
- Búsqueda y filtros.
- Panel de métricas.
- Validación de entradas.
- Manejo controlado de errores.
- Integración entre Angular, API REST y PostgreSQL.

## 2. Alcance

El plan cubre los módulos desarrollados hasta el paso 10:

1. Autenticación.
2. Autorización por roles.
3. Usuarios.
4. Categorías.
5. Catálogos.
6. Tickets.
7. Asignación de técnicos.
8. Estados y soluciones.
9. Historial.
10. Métricas.
11. Navegación y panel dinámico por rol.

No forman parte del alcance:

- Chat en tiempo real.
- Recuperación automática de contraseñas.
- Archivos adjuntos.
- Envío de correos.
- Aplicación móvil.

## 3. Tipos de pruebas

| Tipo             | Objetivo                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Unitarias        | Verificar servicios, guards, interceptores, controladores y funciones de manera aislada. |
| Integración      | Verificar la comunicación entre frontend, API REST y base de datos.                      |
| Funcionales      | Comprobar las operaciones disponibles para cada rol.                                     |
| Validación       | Probar campos obligatorios, formatos, límites y valores inválidos.                       |
| Seguridad        | Comprobar autenticación, JWT, autorización y protección de contraseñas.                  |
| Sistema          | Ejecutar flujos completos desde la interfaz hasta PostgreSQL.                            |
| Regresión        | Confirmar que las funciones previamente aprobadas continúen funcionando.                 |
| Usabilidad       | Revisar formularios, mensajes, navegación y claridad visual.                             |
| Compatibilidad   | Ejecutar el flujo principal en Chrome, Edge y Firefox.                                   |
| Diseño adaptable | Revisar las pantallas principales en escritorio y móvil.                                 |

## 4. Ambiente de pruebas

| Elemento          | Configuración                          |
| ----------------- | -------------------------------------- |
| Frontend          | Servidor local de Angular              |
| Backend           | API REST de Node.js y Express          |
| Base de datos     | PostgreSQL local                       |
| Navegadores       | Chrome, Edge y Firefox                 |
| Ejecutor frontend | Vitest                                 |
| Ejecutor backend  | Herramienta configurada en el backend  |
| Datos             | Usuarios y registros locales de prueba |
| Repositorio       | Git y GitHub                           |

Las versiones exactas se obtendrán con:

```bash
node --version
npm --version
ng version
psql --version
```

## 5. Resultado final

El plan de pruebas fue ejecutado satisfactoriamente.

| Grupo         | Aprobadas | Fallidas | Estado   |
| ------------- | --------: | -------: | -------- |
| Frontend      |        40 |        0 | APROBADO |
| Backend       |        35 |        0 | APROBADO |
| Seguridad API |        13 |        0 | APROBADO |
| Funcionales   |        13 |        0 | APROBADO |
| Sistema       |         5 |        0 | APROBADO |

No se identificaron defectos críticos o altos pendientes.

## 6. Criterios de salida

| Criterio                          | Resultado |
| --------------------------------- | --------- |
| Pruebas automatizadas finalizadas | CUMPLIDO  |
| Flujos críticos ejecutados        | CUMPLIDO  |
| Resultados documentados           | CUMPLIDO  |
| Evidencias almacenadas            | CUMPLIDO  |
| Frontend compilado                | CUMPLIDO  |
| Backend compilado                 | CUMPLIDO  |
| Seguridad por roles comprobada    | CUMPLIDO  |
| Plan general actualizado          | CUMPLIDO  |

## 7. Documentación relacionada

- [Consolidación del paso 11](paso-11-pruebas.md)
- [Resultados funcionales, seguridad y sistema](pruebas/resultados-funcionales-seguridad-sistema.md)
- [Evidencias](pruebas/README.md)

## 8. Cierre

Todos los criterios de salida fueron cumplidos. El paso 11 se considera completado y aprobado.
