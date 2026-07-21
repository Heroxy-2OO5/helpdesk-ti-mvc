-- ============================================================================
-- HelpDesk TI - Verificación automática del esquema
-- Ejecutar después de 02_datos_iniciales.sql.
-- Las operaciones de prueba terminan en ROLLBACK y no dejan datos guardados.
-- ============================================================================

-- 1. Comprobación rápida de catálogos y cuentas.
SELECT 'roles' AS elemento, COUNT(*) AS cantidad FROM roles
UNION ALL
SELECT 'prioridades', COUNT(*) FROM prioridades
UNION ALL
SELECT 'estados', COUNT(*) FROM estados_ticket
UNION ALL
SELECT 'transiciones', COUNT(*) FROM transiciones_estado
UNION ALL
SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;

-- 2. Prueba completa del flujo de un ticket.
BEGIN;

DO $$
DECLARE
    v_admin_id          BIGINT;
    v_tecnico_id        BIGINT;
    v_solicitante_id    BIGINT;
    v_categoria_id      BIGINT;
    v_ticket_id         BIGINT;
    v_codigo            VARCHAR(25);
    v_estado            VARCHAR(20);
    v_eventos           BIGINT;
BEGIN
    SELECT id INTO STRICT v_admin_id
      FROM usuarios WHERE correo = 'admin@helpdesk.local';
    SELECT id INTO STRICT v_tecnico_id
      FROM usuarios WHERE correo = 'tecnico@helpdesk.local';
    SELECT id INTO STRICT v_solicitante_id
      FROM usuarios WHERE correo = 'solicitante@helpdesk.local';
    SELECT id INTO STRICT v_categoria_id
      FROM categorias WHERE LOWER(nombre) = 'hardware';

    INSERT INTO tickets (
        titulo, descripcion, solicitante_id, creado_por_id,
        categoria_id, prioridad_codigo, actualizado_por_id
    ) VALUES (
        'Prueba automática del esquema',
        'Ticket temporal utilizado para comprobar el flujo y el historial.',
        v_solicitante_id, v_solicitante_id,
        v_categoria_id, 'MEDIUM', v_solicitante_id
    )
    RETURNING id, codigo, estado_codigo INTO v_ticket_id, v_codigo, v_estado;

    IF v_estado <> 'PENDING' OR v_codigo IS NULL THEN
        RAISE EXCEPTION 'Falló la creación automática del ticket';
    END IF;

    UPDATE tickets
       SET tecnico_id = v_tecnico_id,
           asignado_por_id = v_admin_id,
           actualizado_por_id = v_admin_id
     WHERE id = v_ticket_id;

    SELECT estado_codigo INTO v_estado FROM tickets WHERE id = v_ticket_id;
    IF v_estado <> 'ASSIGNED' THEN
        RAISE EXCEPTION 'La asignación no cambió el estado a ASSIGNED';
    END IF;

    UPDATE tickets
       SET estado_codigo = 'IN_PROGRESS',
           actualizado_por_id = v_tecnico_id
     WHERE id = v_ticket_id;

    UPDATE tickets
       SET estado_codigo = 'RESOLVED',
           solucion = 'Se comprobó correctamente el funcionamiento del esquema.',
           solucion_por_id = v_tecnico_id,
           actualizado_por_id = v_tecnico_id
     WHERE id = v_ticket_id;

    UPDATE tickets
       SET estado_codigo = 'CLOSED',
           actualizado_por_id = v_admin_id
     WHERE id = v_ticket_id;

    SELECT estado_codigo INTO v_estado FROM tickets WHERE id = v_ticket_id;
    SELECT COUNT(*) INTO v_eventos
      FROM historial_tickets WHERE ticket_id = v_ticket_id;

    IF v_estado <> 'CLOSED' THEN
        RAISE EXCEPTION 'El ticket de prueba no llegó al estado CLOSED';
    END IF;

    IF v_eventos < 7 THEN
        RAISE EXCEPTION 'El historial está incompleto: solo % eventos', v_eventos;
    END IF;

    RAISE NOTICE 'VERIFICACIÓN CORRECTA: ticket %, estado %, % eventos.',
        v_codigo, v_estado, v_eventos;
END;
$$;

ROLLBACK;

-- 3. Las vistas deben responder aun cuando no existan tickets reales.
SELECT * FROM vw_metricas_resumen;
SELECT * FROM vw_metricas_por_estado ORDER BY orden_flujo;
SELECT * FROM vw_metricas_por_prioridad ORDER BY nivel;
SELECT * FROM vw_metricas_por_categoria ORDER BY categoria;
SELECT * FROM vw_metricas_por_tecnico ORDER BY tecnico;
