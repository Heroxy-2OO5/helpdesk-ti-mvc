import type { QueryResultRow } from 'pg';

import { pool } from '../config/database.js';
import type {
    MetricsDashboard,
    MetricsSummary,
    TicketsByCategoryMetric,
    TicketsByPriorityMetric,
    TicketsByStatusMetric,
    TicketsByTechnicianMetric,
} from '../types/metrics.types.js';

interface SummaryRow extends QueryResultRow {
    total_tickets: string;
    pendientes: string;
    asignados: string;
    en_proceso: string;
    resueltos: string;
    cerrados: string;
    horas_promedio_resolucion: string | null;
}

interface StatusRow extends QueryResultRow {
    estado_codigo: string;
    estado: string;
    orden_flujo: number;
    cantidad: string;
}

interface PriorityRow extends QueryResultRow {
    prioridad_codigo: string;
    prioridad: string;
    nivel: number;
    cantidad: string;
}

interface CategoryRow extends QueryResultRow {
    categoria_id: string;
    categoria: string;
    cantidad: string;
}

interface TechnicianRow extends QueryResultRow {
    tecnico_id: string;
    tecnico: string;
    total_asignados: string;
    carga_actual: string;
    finalizados: string;
}

const toNumber = (value: string): number => Number(value);

const toSummary = (row: SummaryRow): MetricsSummary => ({
    totalTickets: toNumber(row.total_tickets),
    pendientes: toNumber(row.pendientes),
    asignados: toNumber(row.asignados),
    enProceso: toNumber(row.en_proceso),
    resueltos: toNumber(row.resueltos),
    cerrados: toNumber(row.cerrados),
    horasPromedioResolucion:
        row.horas_promedio_resolucion === null
            ? null
            : toNumber(row.horas_promedio_resolucion),
});

export const findMetricsDashboard = async (): Promise<MetricsDashboard> => {
    const [
        summaryResult,
        statusResult,
        priorityResult,
        categoryResult,
        technicianResult,
    ] = await Promise.all([
        pool.query<SummaryRow>(
            'SELECT * FROM vw_metricas_resumen',
        ),
        pool.query<StatusRow>(
            `SELECT *
            FROM vw_metricas_por_estado
            ORDER BY orden_flujo ASC`,
        ),
        pool.query<PriorityRow>(
            `SELECT *
            FROM vw_metricas_por_prioridad
            ORDER BY nivel ASC`,
        ),
        pool.query<CategoryRow>(
            `SELECT
                categoria_id::text,
                categoria,
                cantidad
            FROM vw_metricas_por_categoria
            ORDER BY cantidad DESC, categoria ASC`,
        ),
        pool.query<TechnicianRow>(
            `SELECT
                tecnico_id::text,
                tecnico,
                total_asignados,
                carga_actual,
                finalizados
            FROM vw_metricas_por_tecnico
            ORDER BY carga_actual DESC, tecnico ASC`,
        ),
    ]);

    const summaryRow = summaryResult.rows[0];

    const resumen: MetricsSummary = summaryRow
        ? toSummary(summaryRow)
        : {
            totalTickets: 0,
            pendientes: 0,
            asignados: 0,
            enProceso: 0,
            resueltos: 0,
            cerrados: 0,
            horasPromedioResolucion: null,
        };

    const porEstado: TicketsByStatusMetric[] = statusResult.rows.map(
        (row) => ({
            estadoCodigo: row.estado_codigo,
            estado: row.estado,
            ordenFlujo: row.orden_flujo,
            cantidad: toNumber(row.cantidad),
        }),
    );

    const porPrioridad: TicketsByPriorityMetric[] = priorityResult.rows.map(
        (row) => ({
            prioridadCodigo: row.prioridad_codigo,
            prioridad: row.prioridad,
            nivel: row.nivel,
            cantidad: toNumber(row.cantidad),
        }),
    );

    const porCategoria: TicketsByCategoryMetric[] = categoryResult.rows.map(
        (row) => ({
            categoriaId: row.categoria_id,
            categoria: row.categoria,
            cantidad: toNumber(row.cantidad),
        }),
    );

    const porTecnico: TicketsByTechnicianMetric[] = technicianResult.rows.map(
        (row) => ({
            tecnicoId: row.tecnico_id,
            tecnico: row.tecnico,
            totalAsignados: toNumber(row.total_asignados),
            cargaActual: toNumber(row.carga_actual),
            finalizados: toNumber(row.finalizados),
        }),
    );

    return {
        resumen,
        porEstado,
        porPrioridad,
        porCategoria,
        porTecnico,
    };
};
