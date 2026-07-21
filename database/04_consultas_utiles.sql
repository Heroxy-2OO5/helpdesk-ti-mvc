-- HelpDesk TI - Consultas de referencia para Node.js/Express
-- Use parámetros del driver pg ($1, $2, etc.); nunca concatene texto del usuario.

-- Inicio de sesión: el backend compara la contraseña con bcrypt.
SELECT id, nombre_completo, correo, contrasena_hash, rol_codigo, activo
FROM usuarios
WHERE correo = LOWER($1);

-- Categorías activas para el formulario de ticket.
SELECT id, nombre, descripcion
FROM categorias
WHERE activo
ORDER BY nombre;

-- Tickets del solicitante.
SELECT *
FROM vw_detalle_tickets_activos
WHERE solicitante_id = $1
ORDER BY creado_en DESC;

-- Tickets asignados al técnico.
SELECT *
FROM vw_detalle_tickets_activos
WHERE tecnico_id = $1
ORDER BY creado_en DESC;

-- Búsqueda por código o título (administrador).
SELECT *
FROM vw_detalle_tickets_activos
WHERE codigo ILIKE '%' || $1 || '%'
   OR titulo ILIKE '%' || $1 || '%'
ORDER BY creado_en DESC;

-- Historial completo de un ticket.
SELECT
    h.id,
    h.tipo_evento_codigo,
    h.estado_anterior_codigo,
    h.estado_nuevo_codigo,
    u.nombre_completo AS responsable,
    h.observacion,
    h.detalles,
    h.creado_en
FROM historial_tickets h
JOIN usuarios u ON u.id = h.usuario_responsable_id
WHERE h.ticket_id = $1
ORDER BY h.creado_en, h.id;

-- Panel del administrador.
SELECT * FROM vw_metricas_resumen;
SELECT * FROM vw_metricas_por_estado ORDER BY orden_flujo;
SELECT * FROM vw_metricas_por_prioridad ORDER BY nivel;
SELECT * FROM vw_metricas_por_categoria ORDER BY cantidad DESC;
SELECT * FROM vw_metricas_por_tecnico ORDER BY carga_actual DESC;
