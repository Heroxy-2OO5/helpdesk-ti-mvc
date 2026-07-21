-- ============================================================================
-- HelpDesk TI - Catálogos, categorías y usuarios de demostración
-- Ejecutar después de 01_esquema.sql.
-- Es seguro volver a ejecutarlo: no duplica registros.
-- ============================================================================

BEGIN;

INSERT INTO roles (codigo, nombre, descripcion) VALUES
    ('ADMINISTRATOR', 'Administrador', 'Gestiona usuarios, categorías, tickets y métricas.'),
    ('TECHNICIAN', 'Técnico', 'Atiende y resuelve los tickets que le han sido asignados.'),
    ('REQUESTER', 'Solicitante', 'Registra y consulta sus propias solicitudes de soporte.')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    activo = TRUE;

INSERT INTO prioridades (codigo, nombre, nivel, color) VALUES
    ('LOW', 'Baja', 1, '#22C55E'),
    ('MEDIUM', 'Media', 2, '#3B82F6'),
    ('HIGH', 'Alta', 3, '#F59E0B'),
    ('CRITICAL', 'Crítica', 4, '#EF4444')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    nivel = EXCLUDED.nivel,
    color = EXCLUDED.color,
    activo = TRUE;

INSERT INTO estados_ticket (codigo, nombre, orden_flujo, es_final) VALUES
    ('PENDING', 'Pendiente', 1, FALSE),
    ('ASSIGNED', 'Asignado', 2, FALSE),
    ('IN_PROGRESS', 'En proceso', 3, FALSE),
    ('RESOLVED', 'Resuelto', 4, FALSE),
    ('CLOSED', 'Cerrado', 5, TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    orden_flujo = EXCLUDED.orden_flujo,
    es_final = EXCLUDED.es_final,
    activo = TRUE;

-- Flujo normal y dos retornos controlados para corregir/reabrir trabajo.
INSERT INTO transiciones_estado (
    estado_origen_codigo, estado_destino_codigo, descripcion
) VALUES
    ('PENDING', 'ASSIGNED', 'El administrador asigna un técnico.'),
    ('ASSIGNED', 'PENDING', 'El administrador retira la asignación.'),
    ('ASSIGNED', 'IN_PROGRESS', 'El técnico inicia la atención.'),
    ('IN_PROGRESS', 'ASSIGNED', 'La atención vuelve a la cola del técnico.'),
    ('IN_PROGRESS', 'RESOLVED', 'El técnico registra la solución.'),
    ('RESOLVED', 'IN_PROGRESS', 'El ticket se reabre para continuar el trabajo.'),
    ('RESOLVED', 'CLOSED', 'El administrador finaliza el ticket.')
ON CONFLICT (estado_origen_codigo, estado_destino_codigo) DO UPDATE SET
    descripcion = EXCLUDED.descripcion;

INSERT INTO tipos_evento_historial (codigo, nombre, descripcion) VALUES
    ('CREATED', 'Creación', 'Creación del ticket.'),
    ('UPDATED', 'Actualización', 'Modificación de los datos generales.'),
    ('ASSIGNED', 'Asignación', 'Primera asignación de un técnico.'),
    ('REASSIGNED', 'Reasignación', 'Cambio del técnico responsable.'),
    ('UNASSIGNED', 'Asignación retirada', 'Retiro del técnico responsable.'),
    ('STATUS_CHANGED', 'Cambio de estado', 'Transición entre estados del ticket.'),
    ('SOLUTION_RECORDED', 'Solución registrada', 'Creación o edición de la solución.'),
    ('DELETED', 'Eliminación lógica', 'Ocultamiento del ticket sin borrar sus datos.'),
    ('RESTORED', 'Restauración', 'Reactivación de un ticket eliminado lógicamente.')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- Categorías iniciales. Se pueden editar desde el CRUD del administrador.
INSERT INTO categorias (nombre, descripcion)
SELECT datos.nombre, datos.descripcion
FROM (VALUES
    ('Hardware', 'Fallas o solicitudes relacionadas con componentes físicos.'),
    ('Software', 'Instalación, configuración o errores de programas.'),
    ('Red', 'Conectividad, internet, Wi-Fi y recursos de red.'),
    ('Acceso al sistema', 'Problemas de credenciales, permisos o acceso.'),
    ('Periféricos', 'Impresoras, teclados, ratones, monitores y otros periféricos.')
) AS datos(nombre, descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM categorias c WHERE LOWER(c.nombre) = LOWER(datos.nombre)
);

-- Usuarios únicamente para desarrollo y pruebas.
-- IMPORTANTE: cambie o desactive estas cuentas antes de una demostración pública.
INSERT INTO usuarios (
    rol_codigo, nombre_completo, correo, contrasena_hash
)
SELECT
    'ADMINISTRATOR', 'Administrador HelpDesk', 'admin@helpdesk.local',
    CRYPT('Admin123*', GEN_SALT('bf', 12))
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE LOWER(correo) = 'admin@helpdesk.local'
);

INSERT INTO usuarios (
    rol_codigo, nombre_completo, correo, contrasena_hash
)
SELECT
    'TECHNICIAN', 'Técnico de Soporte', 'tecnico@helpdesk.local',
    CRYPT('Tecnico123*', GEN_SALT('bf', 12))
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE LOWER(correo) = 'tecnico@helpdesk.local'
);

INSERT INTO usuarios (
    rol_codigo, nombre_completo, correo, contrasena_hash
)
SELECT
    'REQUESTER', 'Usuario Solicitante', 'solicitante@helpdesk.local',
    CRYPT('Solicitante123*', GEN_SALT('bf', 12))
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE LOWER(correo) = 'solicitante@helpdesk.local'
);

COMMIT;
