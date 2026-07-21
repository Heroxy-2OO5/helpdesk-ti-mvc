-- ============================================================================
-- HelpDesk TI - Esquema PostgreSQL
-- Requisitos cubiertos: RF-01 a RF-15, RN-01 a RN-10.
-- Ejecutar conectado a la base de datos "helpdesk_ti".
-- ============================================================================

BEGIN;

-- Permite generar hashes bcrypt para los usuarios de demostración.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------------------------
-- 1. Catálogos
-- Los códigos son estables para que el backend no dependa de números internos.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    codigo              VARCHAR(20) PRIMARY KEY,
    nombre              VARCHAR(50) NOT NULL UNIQUE,
    descripcion         VARCHAR(250),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_roles_codigo_mayusculas
        CHECK (codigo = UPPER(BTRIM(codigo)))
);

CREATE TABLE IF NOT EXISTS prioridades (
    codigo              VARCHAR(20) PRIMARY KEY,
    nombre              VARCHAR(50) NOT NULL UNIQUE,
    nivel               SMALLINT NOT NULL UNIQUE,
    color                VARCHAR(20),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_prioridades_nivel CHECK (nivel BETWEEN 1 AND 10),
    CONSTRAINT ck_prioridades_codigo_mayusculas
        CHECK (codigo = UPPER(BTRIM(codigo)))
);

CREATE TABLE IF NOT EXISTS estados_ticket (
    codigo              VARCHAR(20) PRIMARY KEY,
    nombre              VARCHAR(50) NOT NULL UNIQUE,
    orden_flujo         SMALLINT NOT NULL UNIQUE,
    es_final            BOOLEAN NOT NULL DEFAULT FALSE,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_estados_codigo_mayusculas
        CHECK (codigo = UPPER(BTRIM(codigo)))
);

CREATE TABLE IF NOT EXISTS transiciones_estado (
    estado_origen_codigo    VARCHAR(20) NOT NULL,
    estado_destino_codigo   VARCHAR(20) NOT NULL,
    descripcion             VARCHAR(200),
    PRIMARY KEY (estado_origen_codigo, estado_destino_codigo),
    CONSTRAINT fk_transicion_origen
        FOREIGN KEY (estado_origen_codigo)
        REFERENCES estados_ticket (codigo) ON DELETE RESTRICT,
    CONSTRAINT fk_transicion_destino
        FOREIGN KEY (estado_destino_codigo)
        REFERENCES estados_ticket (codigo) ON DELETE RESTRICT,
    CONSTRAINT ck_transicion_distinta
        CHECK (estado_origen_codigo <> estado_destino_codigo)
);

CREATE TABLE IF NOT EXISTS tipos_evento_historial (
    codigo              VARCHAR(30) PRIMARY KEY,
    nombre              VARCHAR(70) NOT NULL UNIQUE,
    descripcion         VARCHAR(250),
    CONSTRAINT ck_eventos_codigo_mayusculas
        CHECK (codigo = UPPER(BTRIM(codigo)))
);

-- --------------------------------------------------------------------------
-- 2. Usuarios y categorías
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usuarios (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol_codigo              VARCHAR(20) NOT NULL,
    nombre_completo         VARCHAR(120) NOT NULL,
    correo                  VARCHAR(254) NOT NULL,
    contrasena_hash         VARCHAR(255) NOT NULL,
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso_en        TIMESTAMPTZ,
    creado_en               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desactivado_en          TIMESTAMPTZ,
    desactivado_por_id      BIGINT,
    CONSTRAINT fk_usuarios_rol
        FOREIGN KEY (rol_codigo) REFERENCES roles (codigo) ON DELETE RESTRICT,
    CONSTRAINT fk_usuarios_desactivado_por
        FOREIGN KEY (desactivado_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT ck_usuarios_nombre
        CHECK (CHAR_LENGTH(BTRIM(nombre_completo)) BETWEEN 3 AND 120),
    CONSTRAINT ck_usuarios_correo
        CHECK (correo ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'),
    CONSTRAINT ck_usuarios_hash
        CHECK (CHAR_LENGTH(contrasena_hash) BETWEEN 60 AND 255),
    CONSTRAINT ck_usuarios_desactivacion
        CHECK (activo OR desactivado_en IS NOT NULL)
);

-- Evita correos repetidos incluso si se escriben con mayúsculas diferentes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_correo_normalizado
    ON usuarios (LOWER(correo));

CREATE INDEX IF NOT EXISTS idx_usuarios_rol_activo
    ON usuarios (rol_codigo, activo);

CREATE TABLE IF NOT EXISTS categorias (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre                  VARCHAR(80) NOT NULL,
    descripcion             VARCHAR(300),
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desactivado_en          TIMESTAMPTZ,
    desactivado_por_id      BIGINT,
    CONSTRAINT fk_categorias_desactivado_por
        FOREIGN KEY (desactivado_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT ck_categorias_nombre
        CHECK (CHAR_LENGTH(BTRIM(nombre)) BETWEEN 2 AND 80),
    CONSTRAINT ck_categorias_desactivacion
        CHECK (activo OR desactivado_en IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_categorias_nombre_normalizado
    ON categorias (LOWER(nombre));

CREATE INDEX IF NOT EXISTS idx_categorias_activas
    ON categorias (activo, nombre);

-- --------------------------------------------------------------------------
-- 3. Tickets
-- --------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS secuencia_codigo_ticket START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION fn_generar_codigo_ticket()
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ejemplo: HD-2026-000001. nextval es seguro ante solicitudes simultáneas.
    RETURN 'HD-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
           LPAD(NEXTVAL('secuencia_codigo_ticket')::TEXT, 6, '0');
END;
$$;

CREATE TABLE IF NOT EXISTS tickets (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo                  VARCHAR(25) NOT NULL DEFAULT fn_generar_codigo_ticket(),
    titulo                  VARCHAR(150) NOT NULL,
    descripcion             TEXT NOT NULL,
    solicitante_id          BIGINT NOT NULL,
    creado_por_id           BIGINT NOT NULL,
    categoria_id            BIGINT NOT NULL,
    prioridad_codigo        VARCHAR(20) NOT NULL,
    estado_codigo           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    tecnico_id              BIGINT,
    asignado_por_id         BIGINT,
    solucion                TEXT,
    solucion_por_id         BIGINT,
    solucion_en             TIMESTAMPTZ,
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    asignado_en             TIMESTAMPTZ,
    iniciado_en             TIMESTAMPTZ,
    resuelto_en             TIMESTAMPTZ,
    cerrado_en              TIMESTAMPTZ,
    actualizado_por_id      BIGINT NOT NULL,
    eliminado_en            TIMESTAMPTZ,
    eliminado_por_id        BIGINT,
    motivo_eliminacion      VARCHAR(300),

    CONSTRAINT uq_tickets_codigo UNIQUE (codigo),
    CONSTRAINT fk_tickets_solicitante
        FOREIGN KEY (solicitante_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_creado_por
        FOREIGN KEY (creado_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_prioridad
        FOREIGN KEY (prioridad_codigo) REFERENCES prioridades (codigo) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_estado
        FOREIGN KEY (estado_codigo) REFERENCES estados_ticket (codigo) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_tecnico
        FOREIGN KEY (tecnico_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_asignado_por
        FOREIGN KEY (asignado_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_solucion_por
        FOREIGN KEY (solucion_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_actualizado_por
        FOREIGN KEY (actualizado_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_eliminado_por
        FOREIGN KEY (eliminado_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT,

    CONSTRAINT ck_tickets_codigo
        CHECK (codigo ~ '^HD-[0-9]{4}-[0-9]{6,}$'),
    CONSTRAINT ck_tickets_titulo
        CHECK (CHAR_LENGTH(BTRIM(titulo)) BETWEEN 3 AND 150),
    CONSTRAINT ck_tickets_descripcion
        CHECK (CHAR_LENGTH(BTRIM(descripcion)) BETWEEN 10 AND 4000),
    CONSTRAINT ck_tickets_solucion
        CHECK (solucion IS NULL OR CHAR_LENGTH(BTRIM(solucion)) BETWEEN 5 AND 8000),
    CONSTRAINT ck_tickets_eliminacion
        CHECK (
            activo OR
            (eliminado_en IS NOT NULL AND eliminado_por_id IS NOT NULL)
        )
);

-- Índices para los listados y filtros de RF-07 y RF-14.
CREATE INDEX IF NOT EXISTS idx_tickets_solicitante_activos
    ON tickets (solicitante_id, creado_en DESC) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_tickets_tecnico_activos
    ON tickets (tecnico_id, estado_codigo, creado_en DESC) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_tickets_estado_activos
    ON tickets (estado_codigo, creado_en DESC) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_tickets_prioridad_activos
    ON tickets (prioridad_codigo, creado_en DESC) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_tickets_categoria_activos
    ON tickets (categoria_id, creado_en DESC) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_tickets_creados_en
    ON tickets (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_titulo_normalizado
    ON tickets (LOWER(titulo));

-- --------------------------------------------------------------------------
-- 4. Historial inmutable
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS historial_tickets (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id               BIGINT NOT NULL,
    tipo_evento_codigo      VARCHAR(30) NOT NULL,
    estado_anterior_codigo  VARCHAR(20),
    estado_nuevo_codigo     VARCHAR(20),
    usuario_responsable_id  BIGINT NOT NULL,
    observacion             VARCHAR(500) NOT NULL,
    detalles                JSONB NOT NULL DEFAULT '{}'::JSONB,
    creado_en               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historial_ticket
        FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE RESTRICT,
    CONSTRAINT fk_historial_tipo_evento
        FOREIGN KEY (tipo_evento_codigo)
        REFERENCES tipos_evento_historial (codigo) ON DELETE RESTRICT,
    CONSTRAINT fk_historial_estado_anterior
        FOREIGN KEY (estado_anterior_codigo)
        REFERENCES estados_ticket (codigo) ON DELETE RESTRICT,
    CONSTRAINT fk_historial_estado_nuevo
        FOREIGN KEY (estado_nuevo_codigo)
        REFERENCES estados_ticket (codigo) ON DELETE RESTRICT,
    CONSTRAINT fk_historial_responsable
        FOREIGN KEY (usuario_responsable_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT ck_historial_observacion
        CHECK (CHAR_LENGTH(BTRIM(observacion)) BETWEEN 3 AND 500),
    CONSTRAINT ck_historial_detalles_objeto
        CHECK (JSONB_TYPEOF(detalles) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_historial_ticket_fecha
    ON historial_tickets (ticket_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_historial_responsable_fecha
    ON historial_tickets (usuario_responsable_id, creado_en DESC);

-- --------------------------------------------------------------------------
-- 5. Funciones y disparadores de integridad
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_normalizar_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.nombre_completo := BTRIM(NEW.nombre_completo);
    NEW.correo := LOWER(BTRIM(NEW.correo));
    NEW.actualizado_en := CURRENT_TIMESTAMP;

    IF NEW.activo THEN
        NEW.desactivado_en := NULL;
        NEW.desactivado_por_id := NULL;
    ELSIF NEW.desactivado_en IS NULL THEN
        NEW.desactivado_en := CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalizar_usuario ON usuarios;
CREATE TRIGGER trg_normalizar_usuario
BEFORE INSERT OR UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_normalizar_usuario();

CREATE OR REPLACE FUNCTION fn_normalizar_categoria()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.nombre := BTRIM(NEW.nombre);
    NEW.descripcion := NULLIF(BTRIM(NEW.descripcion), '');
    NEW.actualizado_en := CURRENT_TIMESTAMP;

    IF NEW.activo THEN
        NEW.desactivado_en := NULL;
        NEW.desactivado_por_id := NULL;
    ELSIF NEW.desactivado_en IS NULL THEN
        NEW.desactivado_en := CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalizar_categoria ON categorias;
CREATE TRIGGER trg_normalizar_categoria
BEFORE INSERT OR UPDATE ON categorias
FOR EACH ROW EXECUTE FUNCTION fn_normalizar_categoria();

CREATE OR REPLACE FUNCTION fn_validar_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_rol                  VARCHAR(20);
    v_activo               BOOLEAN;
    v_categoria_activa     BOOLEAN;
BEGIN
    NEW.titulo := BTRIM(NEW.titulo);
    NEW.descripcion := BTRIM(NEW.descripcion);
    NEW.solucion := NULLIF(BTRIM(NEW.solucion), '');
    NEW.actualizado_en := CURRENT_TIMESTAMP;

    -- Se valida al crear o cambiar el solicitante. Si después se desactiva,
    -- sus tickets históricos podrán continuar atendiéndose.
    IF TG_OP = 'INSERT' OR NEW.solicitante_id IS DISTINCT FROM OLD.solicitante_id THEN
        SELECT rol_codigo, activo
          INTO v_rol, v_activo
          FROM usuarios
         WHERE id = NEW.solicitante_id;

        IF NOT FOUND OR NOT v_activo OR v_rol <> 'REQUESTER' THEN
            RAISE EXCEPTION 'El solicitante debe ser un usuario activo con rol REQUESTER';
        END IF;
    END IF;

    -- Los tickets nuevos y los cambios de categoría solo usan categorías activas.
    IF TG_OP = 'INSERT' OR NEW.categoria_id IS DISTINCT FROM OLD.categoria_id THEN
        SELECT activo INTO v_categoria_activa
          FROM categorias
         WHERE id = NEW.categoria_id;

        IF NOT FOUND OR NOT v_categoria_activa THEN
            RAISE EXCEPTION 'La categoría seleccionada no existe o está inactiva';
        END IF;
    END IF;

    -- Se comprueba el técnico al asignarlo o reasignarlo. Desactivar después una
    -- cuenta no bloquea la conservación ni la reasignación de tickets antiguos.
    IF NEW.tecnico_id IS NOT NULL AND
       (TG_OP = 'INSERT' OR NEW.tecnico_id IS DISTINCT FROM OLD.tecnico_id) THEN
        SELECT rol_codigo, activo
          INTO v_rol, v_activo
          FROM usuarios
         WHERE id = NEW.tecnico_id;

        IF NOT FOUND OR NOT v_activo OR v_rol <> 'TECHNICIAN' THEN
            RAISE EXCEPTION 'El responsable debe ser un usuario activo con rol TECHNICIAN';
        END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.estado_codigo := COALESCE(NEW.estado_codigo, 'PENDING');
        NEW.actualizado_por_id := COALESCE(NEW.actualizado_por_id, NEW.creado_por_id);

        IF NEW.tecnico_id IS NOT NULL THEN
            RAISE EXCEPTION 'Un ticket nuevo debe crearse PENDIENTE y sin técnico';
        END IF;

        IF NEW.estado_codigo <> 'PENDING' THEN
            RAISE EXCEPTION 'Todo ticket nuevo debe comenzar en estado PENDING';
        END IF;
    ELSE
        -- Al asignar o reasignar, debe registrarse un administrador responsable.
        IF NEW.tecnico_id IS DISTINCT FROM OLD.tecnico_id THEN
            IF NEW.asignado_por_id IS NULL THEN
                RAISE EXCEPTION 'Debe indicar quién realizó la asignación';
            END IF;

            SELECT rol_codigo, activo
              INTO v_rol, v_activo
              FROM usuarios
             WHERE id = NEW.asignado_por_id;

            IF NOT FOUND OR NOT v_activo OR v_rol <> 'ADMINISTRATOR' THEN
                RAISE EXCEPTION 'Solo un administrador activo puede asignar técnicos';
            END IF;

            NEW.asignado_en := CURRENT_TIMESTAMP;

            IF OLD.estado_codigo = 'PENDING' AND NEW.tecnico_id IS NOT NULL THEN
                NEW.estado_codigo := 'ASSIGNED';
            END IF;
        END IF;

        -- Cada cambio de estado debe seguir el flujo configurado.
        IF NEW.estado_codigo IS DISTINCT FROM OLD.estado_codigo THEN
            IF NOT EXISTS (
                SELECT 1
                  FROM transiciones_estado
                 WHERE estado_origen_codigo = OLD.estado_codigo
                   AND estado_destino_codigo = NEW.estado_codigo
            ) THEN
                RAISE EXCEPTION 'Transición de estado no permitida: % -> %',
                    OLD.estado_codigo, NEW.estado_codigo;
            END IF;
        END IF;
    END IF;

    -- PENDIENTE es el único estado que puede no tener técnico.
    IF NEW.estado_codigo <> 'PENDING' AND NEW.tecnico_id IS NULL THEN
        RAISE EXCEPTION 'El estado % requiere un técnico asignado', NEW.estado_codigo;
    END IF;

    -- RESUELTO y CERRADO requieren solución, autor y fecha.
    IF NEW.estado_codigo IN ('RESOLVED', 'CLOSED') THEN
        IF NEW.solucion IS NULL THEN
            RAISE EXCEPTION 'Debe registrar una solución antes de resolver el ticket';
        END IF;

        NEW.solucion_por_id := COALESCE(NEW.solucion_por_id, NEW.actualizado_por_id);
        NEW.solucion_en := COALESCE(NEW.solucion_en, CURRENT_TIMESTAMP);
        NEW.resuelto_en := COALESCE(NEW.resuelto_en, CURRENT_TIMESTAMP);
    END IF;

    IF NEW.estado_codigo = 'IN_PROGRESS' THEN
        NEW.iniciado_en := COALESCE(NEW.iniciado_en, CURRENT_TIMESTAMP);
    END IF;

    IF NEW.estado_codigo = 'CLOSED' THEN
        NEW.cerrado_en := COALESCE(NEW.cerrado_en, CURRENT_TIMESTAMP);
    END IF;

    -- Eliminación lógica con responsable y fecha.
    IF TG_OP = 'UPDATE' AND OLD.activo AND NOT NEW.activo THEN
        IF NEW.eliminado_por_id IS NULL THEN
            RAISE EXCEPTION 'Debe indicar quién eliminó el ticket';
        END IF;
        NEW.eliminado_en := COALESCE(NEW.eliminado_en, CURRENT_TIMESTAMP);
    ELSIF NEW.activo THEN
        NEW.eliminado_en := NULL;
        NEW.eliminado_por_id := NULL;
        NEW.motivo_eliminacion := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_ticket ON tickets;
CREATE TRIGGER trg_validar_ticket
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION fn_validar_ticket();

CREATE OR REPLACE FUNCTION fn_registrar_historial_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_actor BIGINT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO historial_tickets (
            ticket_id, tipo_evento_codigo, estado_nuevo_codigo,
            usuario_responsable_id, observacion
        ) VALUES (
            NEW.id, 'CREATED', NEW.estado_codigo,
            NEW.creado_por_id, 'Ticket creado con estado PENDIENTE.'
        );
        RETURN NEW;
    END IF;

    v_actor := COALESCE(NEW.actualizado_por_id, NEW.creado_por_id);

    IF NEW.tecnico_id IS DISTINCT FROM OLD.tecnico_id THEN
        INSERT INTO historial_tickets (
            ticket_id, tipo_evento_codigo, estado_anterior_codigo,
            estado_nuevo_codigo, usuario_responsable_id, observacion, detalles
        ) VALUES (
            NEW.id,
            CASE
                WHEN NEW.tecnico_id IS NULL THEN 'UNASSIGNED'
                WHEN OLD.tecnico_id IS NULL THEN 'ASSIGNED'
                ELSE 'REASSIGNED'
            END,
            OLD.estado_codigo,
            NEW.estado_codigo,
            COALESCE(NEW.asignado_por_id, v_actor),
            CASE
                WHEN NEW.tecnico_id IS NULL THEN 'Se retiró la asignación del técnico.'
                WHEN OLD.tecnico_id IS NULL THEN 'Se asignó un técnico al ticket.'
                ELSE 'Se reasignó el ticket a otro técnico.'
            END,
            JSONB_BUILD_OBJECT(
                'tecnico_anterior_id', OLD.tecnico_id,
                'tecnico_nuevo_id', NEW.tecnico_id
            )
        );
    END IF;

    IF NEW.estado_codigo IS DISTINCT FROM OLD.estado_codigo THEN
        INSERT INTO historial_tickets (
            ticket_id, tipo_evento_codigo, estado_anterior_codigo,
            estado_nuevo_codigo, usuario_responsable_id, observacion
        ) VALUES (
            NEW.id, 'STATUS_CHANGED', OLD.estado_codigo,
            NEW.estado_codigo, v_actor,
            'Estado cambiado de ' || OLD.estado_codigo || ' a ' || NEW.estado_codigo || '.'
        );
    END IF;

    IF NEW.solucion IS DISTINCT FROM OLD.solucion AND NEW.solucion IS NOT NULL THEN
        INSERT INTO historial_tickets (
            ticket_id, tipo_evento_codigo, estado_anterior_codigo,
            estado_nuevo_codigo, usuario_responsable_id, observacion
        ) VALUES (
            NEW.id, 'SOLUTION_RECORDED', OLD.estado_codigo,
            NEW.estado_codigo, COALESCE(NEW.solucion_por_id, v_actor),
            'Se registró o actualizó la solución del ticket.'
        );
    END IF;

    IF (
        NEW.titulo IS DISTINCT FROM OLD.titulo OR
        NEW.descripcion IS DISTINCT FROM OLD.descripcion OR
        NEW.categoria_id IS DISTINCT FROM OLD.categoria_id OR
        NEW.prioridad_codigo IS DISTINCT FROM OLD.prioridad_codigo
    ) THEN
        INSERT INTO historial_tickets (
            ticket_id, tipo_evento_codigo, estado_anterior_codigo,
            estado_nuevo_codigo, usuario_responsable_id, observacion
        ) VALUES (
            NEW.id, 'UPDATED', OLD.estado_codigo,
            NEW.estado_codigo, v_actor,
            'Se actualizaron los datos generales del ticket.'
        );
    END IF;

    IF NEW.activo IS DISTINCT FROM OLD.activo THEN
        INSERT INTO historial_tickets (
            ticket_id, tipo_evento_codigo, estado_anterior_codigo,
            estado_nuevo_codigo, usuario_responsable_id, observacion
        ) VALUES (
            NEW.id,
            CASE WHEN NEW.activo THEN 'RESTORED' ELSE 'DELETED' END,
            OLD.estado_codigo,
            NEW.estado_codigo,
            CASE WHEN NEW.activo THEN v_actor ELSE NEW.eliminado_por_id END,
            CASE
                WHEN NEW.activo THEN 'El ticket fue restaurado.'
                ELSE 'El ticket fue eliminado lógicamente.'
            END
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_registrar_historial_ticket ON tickets;
CREATE TRIGGER trg_registrar_historial_ticket
AFTER INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION fn_registrar_historial_ticket();

CREATE OR REPLACE FUNCTION fn_impedir_cambio_historial()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'El historial de tickets es inmutable: no se puede modificar ni eliminar';
END;
$$;

DROP TRIGGER IF EXISTS trg_historial_inmutable ON historial_tickets;
CREATE TRIGGER trg_historial_inmutable
BEFORE UPDATE OR DELETE ON historial_tickets
FOR EACH ROW EXECUTE FUNCTION fn_impedir_cambio_historial();

-- --------------------------------------------------------------------------
-- 6. Vistas para consultas y panel de métricas
-- --------------------------------------------------------------------------

CREATE OR REPLACE VIEW vw_detalle_tickets_activos AS
SELECT
    t.id,
    t.codigo,
    t.titulo,
    t.descripcion,
    t.prioridad_codigo,
    p.nombre AS prioridad,
    t.estado_codigo,
    e.nombre AS estado,
    t.categoria_id,
    c.nombre AS categoria,
    t.solicitante_id,
    s.nombre_completo AS solicitante,
    s.correo AS correo_solicitante,
    t.tecnico_id,
    te.nombre_completo AS tecnico,
    t.solucion,
    t.creado_en,
    t.actualizado_en,
    t.asignado_en,
    t.iniciado_en,
    t.resuelto_en,
    t.cerrado_en
FROM tickets t
JOIN prioridades p ON p.codigo = t.prioridad_codigo
JOIN estados_ticket e ON e.codigo = t.estado_codigo
JOIN categorias c ON c.id = t.categoria_id
JOIN usuarios s ON s.id = t.solicitante_id
LEFT JOIN usuarios te ON te.id = t.tecnico_id
WHERE t.activo;

CREATE OR REPLACE VIEW vw_metricas_resumen AS
SELECT
    COUNT(*)::BIGINT AS total_tickets,
    COUNT(*) FILTER (WHERE estado_codigo = 'PENDING')::BIGINT AS pendientes,
    COUNT(*) FILTER (WHERE estado_codigo = 'ASSIGNED')::BIGINT AS asignados,
    COUNT(*) FILTER (WHERE estado_codigo = 'IN_PROGRESS')::BIGINT AS en_proceso,
    COUNT(*) FILTER (WHERE estado_codigo = 'RESOLVED')::BIGINT AS resueltos,
    COUNT(*) FILTER (WHERE estado_codigo = 'CLOSED')::BIGINT AS cerrados,
    ROUND(
        AVG(EXTRACT(EPOCH FROM (resuelto_en - creado_en)) / 3600.0)
        FILTER (WHERE resuelto_en IS NOT NULL)::NUMERIC,
        2
    ) AS horas_promedio_resolucion
FROM tickets
WHERE activo;

CREATE OR REPLACE VIEW vw_metricas_por_estado AS
SELECT
    e.codigo AS estado_codigo,
    e.nombre AS estado,
    e.orden_flujo,
    COUNT(t.id)::BIGINT AS cantidad
FROM estados_ticket e
LEFT JOIN tickets t ON t.estado_codigo = e.codigo AND t.activo
WHERE e.activo
GROUP BY e.codigo, e.nombre, e.orden_flujo;

CREATE OR REPLACE VIEW vw_metricas_por_prioridad AS
SELECT
    p.codigo AS prioridad_codigo,
    p.nombre AS prioridad,
    p.nivel,
    COUNT(t.id)::BIGINT AS cantidad
FROM prioridades p
LEFT JOIN tickets t ON t.prioridad_codigo = p.codigo AND t.activo
WHERE p.activo
GROUP BY p.codigo, p.nombre, p.nivel;

CREATE OR REPLACE VIEW vw_metricas_por_categoria AS
SELECT
    c.id AS categoria_id,
    c.nombre AS categoria,
    COUNT(t.id)::BIGINT AS cantidad
FROM categorias c
LEFT JOIN tickets t ON t.categoria_id = c.id AND t.activo
GROUP BY c.id, c.nombre;

CREATE OR REPLACE VIEW vw_metricas_por_tecnico AS
SELECT
    u.id AS tecnico_id,
    u.nombre_completo AS tecnico,
    COUNT(t.id)::BIGINT AS total_asignados,
    COUNT(t.id) FILTER (
        WHERE t.estado_codigo IN ('ASSIGNED', 'IN_PROGRESS')
    )::BIGINT AS carga_actual,
    COUNT(t.id) FILTER (
        WHERE t.estado_codigo IN ('RESOLVED', 'CLOSED')
    )::BIGINT AS finalizados
FROM usuarios u
LEFT JOIN tickets t ON t.tecnico_id = u.id AND t.activo
WHERE u.rol_codigo = 'TECHNICIAN'
GROUP BY u.id, u.nombre_completo;

COMMIT;
