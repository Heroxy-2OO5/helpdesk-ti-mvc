import type { QueryResultRow } from 'pg';

import { pool } from '../config/database.js';
import type {
    CreateTicketData,
    PriorityCode,
    ScopedTicketFilters,
    TicketDetailWithoutHistory,
    TicketHistoryItem,
    TicketStatusCode,
    TicketSummary,
} from '../types/ticket.types.js';

interface TicketSummaryRow extends QueryResultRow {
    id: string;
    codigo: string;
    titulo: string;
    prioridad_codigo: PriorityCode;
    prioridad: string;
    estado_codigo: TicketStatusCode;
    estado: string;
    categoria_id: string;
    categoria: string;
    solicitante_id: string;
    solicitante: string;
    tecnico_id: string | null;
    tecnico: string | null;
    activo: boolean;
    creado_en: Date;
    actualizado_en: Date;
}

interface TicketDetailRow extends TicketSummaryRow {
    descripcion: string;
    correo_solicitante: string;
    solucion: string | null;
    creado_por_id: string;
    actualizado_por_id: string;
    asignado_en: Date | null;
    iniciado_en: Date | null;
    resuelto_en: Date | null;
    cerrado_en: Date | null;
    eliminado_en: Date | null;
    eliminado_por_id: string | null;
    motivo_eliminacion: string | null;
}

interface TicketHistoryRow extends QueryResultRow {
    id: string;
    tipo_evento_codigo: string;
    estado_anterior_codigo: TicketStatusCode | null;
    estado_nuevo_codigo: TicketStatusCode | null;
    usuario_responsable_id: string;
    responsable: string;
    observacion: string;
    detalles: Record<string, unknown>;
    creado_en: Date;
}

interface CountRow extends QueryResultRow {
    total: string;
}

interface IdRow extends QueryResultRow {
    id: string;
}

const TICKET_SUMMARY_COLUMNS = `
    t.id::text,
    t.codigo,
    t.titulo,
    t.prioridad_codigo,
    p.nombre AS prioridad,
    t.estado_codigo,
    e.nombre AS estado,
    t.categoria_id::text,
    c.nombre AS categoria,
    t.solicitante_id::text,
    s.nombre_completo AS solicitante,
    t.tecnico_id::text,
    te.nombre_completo AS tecnico,
    t.activo,
    t.creado_en,
    t.actualizado_en
`;

const TICKET_JOINS = `
    JOIN prioridades p ON p.codigo = t.prioridad_codigo
    JOIN estados_ticket e ON e.codigo = t.estado_codigo
    JOIN categorias c ON c.id = t.categoria_id
    JOIN usuarios s ON s.id = t.solicitante_id
    LEFT JOIN usuarios te ON te.id = t.tecnico_id
`;

const toIsoString = (value: Date | null): string | null => (
    value ? value.toISOString() : null
);

const toTicketSummary = (row: TicketSummaryRow): TicketSummary => ({
    id: row.id,
    codigo: row.codigo,
    titulo: row.titulo,
    prioridadCodigo: row.prioridad_codigo,
    prioridad: row.prioridad,
    estadoCodigo: row.estado_codigo,
    estado: row.estado,
    categoriaId: row.categoria_id,
    categoria: row.categoria,
    solicitanteId: row.solicitante_id,
    solicitante: row.solicitante,
    tecnicoId: row.tecnico_id,
    tecnico: row.tecnico,
    activo: row.activo,
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString(),
});

const toTicketDetail = (
    row: TicketDetailRow,
): TicketDetailWithoutHistory => ({
    ...toTicketSummary(row),
    descripcion: row.descripcion,
    correoSolicitante: row.correo_solicitante,
    solucion: row.solucion,
    creadoPorId: row.creado_por_id,
    actualizadoPorId: row.actualizado_por_id,
    asignadoEn: toIsoString(row.asignado_en),
    iniciadoEn: toIsoString(row.iniciado_en),
    resueltoEn: toIsoString(row.resuelto_en),
    cerradoEn: toIsoString(row.cerrado_en),
    eliminadoEn: toIsoString(row.eliminado_en),
    eliminadoPorId: row.eliminado_por_id,
    motivoEliminacion: row.motivo_eliminacion,
});

export const findTicketById = async (
    id: string,
): Promise<TicketDetailWithoutHistory | null> => {
    const result = await pool.query<TicketDetailRow>(
        `SELECT
            ${TICKET_SUMMARY_COLUMNS},
            t.descripcion,
            s.correo AS correo_solicitante,
            t.solucion,
            t.creado_por_id::text,
            t.actualizado_por_id::text,
            t.asignado_en,
            t.iniciado_en,
            t.resuelto_en,
            t.cerrado_en,
            t.eliminado_en,
            t.eliminado_por_id::text,
            t.motivo_eliminacion
        FROM tickets t
        ${TICKET_JOINS}
        WHERE t.id = $1
        LIMIT 1`,
        [id],
    );

    const row = result.rows[0];

    return row ? toTicketDetail(row) : null;
};

export const findTicketHistory = async (
    ticketId: string,
): Promise<TicketHistoryItem[]> => {
    const result = await pool.query<TicketHistoryRow>(
        `SELECT
            h.id::text,
            h.tipo_evento_codigo,
            h.estado_anterior_codigo,
            h.estado_nuevo_codigo,
            h.usuario_responsable_id::text,
            u.nombre_completo AS responsable,
            h.observacion,
            h.detalles,
            h.creado_en
        FROM historial_tickets h
        JOIN usuarios u ON u.id = h.usuario_responsable_id
        WHERE h.ticket_id = $1
        ORDER BY h.creado_en ASC, h.id ASC`,
        [ticketId],
    );

    return result.rows.map((row) => ({
        id: row.id,
        tipoEventoCodigo: row.tipo_evento_codigo,
        estadoAnteriorCodigo: row.estado_anterior_codigo,
        estadoNuevoCodigo: row.estado_nuevo_codigo,
        usuarioResponsableId: row.usuario_responsable_id,
        responsable: row.responsable,
        observacion: row.observacion,
        detalles: row.detalles,
        creadoEn: row.creado_en.toISOString(),
    }));
};

export const listTickets = async (
    filters: ScopedTicketFilters,
): Promise<{ tickets: TicketSummary[]; total: number }> => {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.rol === 'REQUESTER') {
        values.push(filters.usuarioId);
        conditions.push(`t.solicitante_id = $${values.length}`);
    } else if (filters.rol === 'TECHNICIAN') {
        values.push(filters.usuarioId);
        conditions.push(`t.tecnico_id = $${values.length}`);
    }

    const activeFilter = filters.rol === 'ADMINISTRATOR'
        ? filters.activo ?? true
        : true;

    values.push(activeFilter);
    conditions.push(`t.activo = $${values.length}`);

    if (filters.search) {
        values.push(filters.search);
        const parameter = `$${values.length}`;

        conditions.push(
            `(t.codigo ILIKE '%' || ${parameter} || '%'
            OR t.titulo ILIKE '%' || ${parameter} || '%')`,
        );
    }

    if (filters.estado) {
        values.push(filters.estado);
        conditions.push(`t.estado_codigo = $${values.length}`);
    }

    if (filters.prioridad) {
        values.push(filters.prioridad);
        conditions.push(`t.prioridad_codigo = $${values.length}`);
    }

    if (filters.categoriaId) {
        values.push(filters.categoriaId);
        conditions.push(`t.categoria_id = $${values.length}`);
    }

    if (filters.tecnicoId) {
        values.push(filters.tecnicoId);
        conditions.push(`t.tecnico_id = $${values.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (filters.page - 1) * filters.limit;
    const listValues = [
        ...values,
        filters.limit,
        offset,
    ];
    const limitParameter = `$${values.length + 1}`;
    const offsetParameter = `$${values.length + 2}`;

    const [ticketsResult, countResult] = await Promise.all([
        pool.query<TicketSummaryRow>(
            `SELECT ${TICKET_SUMMARY_COLUMNS}
            FROM tickets t
            ${TICKET_JOINS}
            ${where}
            ORDER BY t.creado_en DESC, t.id DESC
            LIMIT ${limitParameter}
            OFFSET ${offsetParameter}`,
            listValues,
        ),
        pool.query<CountRow>(
            `SELECT COUNT(*)::text AS total
            FROM tickets t
            ${where}`,
            values,
        ),
    ]);

    return {
        tickets: ticketsResult.rows.map(toTicketSummary),
        total: Number(countResult.rows[0]?.total ?? 0),
    };
};

export const insertTicket = async (
    data: CreateTicketData,
): Promise<TicketDetailWithoutHistory | null> => {
    const result = await pool.query<IdRow>(
        `INSERT INTO tickets (
            titulo,
            descripcion,
            solicitante_id,
            creado_por_id,
            categoria_id,
            prioridad_codigo,
            actualizado_por_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $4)
        RETURNING id::text`,
        [
            data.titulo,
            data.descripcion,
            data.solicitanteId,
            data.creadoPorId,
            data.categoriaId,
            data.prioridadCodigo,
        ],
    );

    const id = result.rows[0]?.id;

    return id ? findTicketById(id) : null;
};
