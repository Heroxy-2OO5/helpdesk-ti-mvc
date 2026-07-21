# Diagrama entidad–relación — HelpDesk TI

El modelo usa catálogos para roles, prioridades, estados y eventos. Los tickets no
se eliminan físicamente y cada acción importante genera un registro inmutable en
`historial_tickets`.

```mermaid
erDiagram
    ROLES ||--o{ USUARIOS : clasifica
    USUARIOS ||--o{ USUARIOS : desactiva
    USUARIOS ||--o{ CATEGORIAS : desactiva
    USUARIOS ||--o{ TICKETS : solicita
    USUARIOS ||--o{ TICKETS : crea
    USUARIOS ||--o{ TICKETS : atiende
    USUARIOS ||--o{ TICKETS : asigna
    USUARIOS ||--o{ TICKETS : actualiza
    USUARIOS ||--o{ TICKETS : resuelve
    USUARIOS ||--o{ TICKETS : elimina
    CATEGORIAS ||--o{ TICKETS : agrupa
    PRIORIDADES ||--o{ TICKETS : prioriza
    ESTADOS_TICKET ||--o{ TICKETS : estado_actual
    ESTADOS_TICKET ||--o{ TRANSICIONES_ESTADO : origen
    ESTADOS_TICKET ||--o{ TRANSICIONES_ESTADO : destino
    TICKETS ||--o{ HISTORIAL_TICKETS : genera
    TIPOS_EVENTO_HISTORIAL ||--o{ HISTORIAL_TICKETS : clasifica
    USUARIOS ||--o{ HISTORIAL_TICKETS : realiza
    ESTADOS_TICKET ||--o{ HISTORIAL_TICKETS : estado_anterior
    ESTADOS_TICKET ||--o{ HISTORIAL_TICKETS : estado_nuevo

    ROLES {
        varchar codigo PK
        varchar nombre UK
        boolean activo
    }

    USUARIOS {
        bigint id PK
        varchar rol_codigo FK
        varchar nombre_completo
        varchar correo UK
        varchar contrasena_hash
        boolean activo
        timestamptz creado_en
        timestamptz desactivado_en
    }

    CATEGORIAS {
        bigint id PK
        varchar nombre UK
        varchar descripcion
        boolean activo
        timestamptz desactivado_en
    }

    PRIORIDADES {
        varchar codigo PK
        varchar nombre UK
        smallint nivel UK
        varchar color
    }

    ESTADOS_TICKET {
        varchar codigo PK
        varchar nombre UK
        smallint orden_flujo UK
        boolean es_final
    }

    TRANSICIONES_ESTADO {
        varchar estado_origen_codigo PK_FK
        varchar estado_destino_codigo PK_FK
        varchar descripcion
    }

    TICKETS {
        bigint id PK
        varchar codigo UK
        varchar titulo
        text descripcion
        bigint solicitante_id FK
        bigint categoria_id FK
        varchar prioridad_codigo FK
        varchar estado_codigo FK
        bigint tecnico_id FK
        text solucion
        boolean activo
        timestamptz creado_en
        timestamptz resuelto_en
        timestamptz cerrado_en
    }

    TIPOS_EVENTO_HISTORIAL {
        varchar codigo PK
        varchar nombre UK
    }

    HISTORIAL_TICKETS {
        bigint id PK
        bigint ticket_id FK
        varchar tipo_evento_codigo FK
        varchar estado_anterior_codigo FK
        varchar estado_nuevo_codigo FK
        bigint usuario_responsable_id FK
        varchar observacion
        jsonb detalles
        timestamptz creado_en
    }
```

## Decisiones importantes

- Se usa `TIMESTAMPTZ` para conservar fechas correctas aunque cambie la zona
  horaria del servidor.
- Los identificadores internos son `BIGINT`; los códigos visibles son cadenas
  independientes y únicas.
- `ON DELETE RESTRICT` evita borrar información relacionada con el historial.
- `activo`, junto con las fechas y usuarios de desactivación, implementa la
  eliminación lógica.
- `transiciones_estado` permite cambiar el flujo sin modificar la estructura de
  la tabla `tickets`.
- Las vistas `vw_metricas_*` entregan al panel los indicadores solicitados.
