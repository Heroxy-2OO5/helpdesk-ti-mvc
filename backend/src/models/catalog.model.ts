import type { QueryResultRow } from 'pg';

import { pool } from '../config/database.js';
import type { Role } from '../types/auth.types.js';
import type {
    PriorityCatalogItem,
    RoleCatalogItem,
    TicketStatusCatalogItem,
} from '../types/catalog.types.js';

interface RoleRow extends QueryResultRow {
    codigo: Role;
    nombre: string;
    descripcion: string | null;
}

interface PriorityRow extends QueryResultRow {
    codigo: string;
    nombre: string;
    nivel: number;
    color: string | null;
}

interface TicketStatusRow extends QueryResultRow {
    codigo: string;
    nombre: string;
    orden_flujo: number;
    es_final: boolean;
}

export const findActiveRoles = async (): Promise<RoleCatalogItem[]> => {
    const result = await pool.query<RoleRow>(
        `SELECT codigo, nombre, descripcion
        FROM roles
        WHERE activo = TRUE
        ORDER BY nombre ASC`,
    );

    return result.rows;
};

export const findActivePriorities = async (): Promise<
    PriorityCatalogItem[]
> => {
    const result = await pool.query<PriorityRow>(
        `SELECT codigo, nombre, nivel, color
        FROM prioridades
        WHERE activo = TRUE
        ORDER BY nivel ASC`,
    );

    return result.rows;
};

export const findActiveTicketStatuses = async (): Promise<
    TicketStatusCatalogItem[]
> => {
    const result = await pool.query<TicketStatusRow>(
        `SELECT codigo, nombre, orden_flujo, es_final
        FROM estados_ticket
        WHERE activo = TRUE
        ORDER BY orden_flujo ASC`,
    );

    return result.rows.map((row) => ({
        codigo: row.codigo,
        nombre: row.nombre,
        ordenFlujo: row.orden_flujo,
        esFinal: row.es_final,
    }));
};