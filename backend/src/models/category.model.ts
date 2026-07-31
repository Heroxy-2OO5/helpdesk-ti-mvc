import type { QueryResultRow } from 'pg';

import { pool } from '../config/database.js';
import type {Category, CategoryFilters, CreateCategoryInput, UpdateCategoryData,} from '../types/category.types.js';

interface CategoryRow extends QueryResultRow {
    id: string;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    creado_en: Date;
    actualizado_en: Date;
    desactivado_en: Date | null;
    desactivado_por_id: string | null;
}

interface CountRow extends QueryResultRow {
    total: string;
}

const CATEGORY_COLUMNS = `
    id::text,
    nombre,
    descripcion,
    activo,
    creado_en,
    actualizado_en,
    desactivado_en,
    desactivado_por_id::text
`;

const toIsoString = (value: Date | null): string | null => (
    value ? value.toISOString() : null
);

const toCategory = (row: CategoryRow): Category => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    activo: row.activo,
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString(),
    desactivadoEn: toIsoString(row.desactivado_en),
    desactivadoPorId: row.desactivado_por_id,
});

export const findCategoryById = async (
    id: string,
): Promise<Category | null> => {
    const result = await pool.query<CategoryRow>(
        `SELECT ${CATEGORY_COLUMNS}
        FROM categorias
        WHERE id = $1
        LIMIT 1`,
        [id],
    );

    const row = result.rows[0];

    return row ? toCategory(row) : null;
};

export const listCategories = async (
    filters: CategoryFilters,
): Promise<{ categorias: Category[]; total: number }> => {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.search) {
        values.push(filters.search);
        const parameter = `$${values.length}`;

        conditions.push(
            `(nombre ILIKE '%' || ${parameter} || '%'
            OR COALESCE(descripcion, '') ILIKE '%' || ${parameter} || '%')`,
        );
    }

    if (filters.activo !== undefined) {
        values.push(filters.activo);
        conditions.push(`activo = $${values.length}`);
    }

    const where = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';
    const offset = (filters.page - 1) * filters.limit;
    const listValues = [
        ...values,
        filters.limit,
        offset,
    ];
    const limitParameter = `$${values.length + 1}`;
    const offsetParameter = `$${values.length + 2}`;

    const [categoriesResult, countResult] = await Promise.all([
        pool.query<CategoryRow>(
            `SELECT ${CATEGORY_COLUMNS}
            FROM categorias
            ${where}
            ORDER BY nombre ASC, id ASC
            LIMIT ${limitParameter}
            OFFSET ${offsetParameter}`,
            listValues,
        ),
        pool.query<CountRow>(
            `SELECT COUNT(*)::text AS total
            FROM categorias
            ${where}`,
            values,
        ),
    ]);

    return {
        categorias: categoriesResult.rows.map(toCategory),
        total: Number(countResult.rows[0]?.total ?? 0),
    };
};

export const insertCategory = async (
    data: CreateCategoryInput,
): Promise<Category> => {
    const result = await pool.query<CategoryRow>(
        `INSERT INTO categorias (nombre, descripcion)
        VALUES ($1, $2)
        RETURNING ${CATEGORY_COLUMNS}`,
        [data.nombre, data.descripcion ?? null],
    );

    return toCategory(result.rows[0]!);
};

export const updateCategoryById = async (
    id: string,
    data: UpdateCategoryData,
): Promise<Category | null> => {
    const assignments: string[] = [];
    const values: unknown[] = [id];

    if (data.nombre !== undefined) {
        values.push(data.nombre);
        assignments.push(`nombre = $${values.length}`);
    }

    if (data.descripcion !== undefined) {
        values.push(data.descripcion);
        assignments.push(`descripcion = $${values.length}`);
    }

    if (data.activo !== undefined) {
        values.push(data.activo);
        assignments.push(`activo = $${values.length}`);

        values.push(
            data.activo === false
                ? data.desactivadoPorId ?? null
                : null,
        );
        assignments.push(`desactivado_por_id = $${values.length}`);
    }

    if (assignments.length === 0) {
        return findCategoryById(id);
    }

    const result = await pool.query<CategoryRow>(
        `UPDATE categorias
        SET ${assignments.join(', ')}
        WHERE id = $1
        RETURNING ${CATEGORY_COLUMNS}`,
        values,
    );

    const row = result.rows[0];

    return row ? toCategory(row) : null;
};

export const deactivateCategoryById = async (
    id: string,
    deactivatedById: string,
): Promise<Category | null> => {
    const result = await pool.query<CategoryRow>(
        `UPDATE categorias
        SET
            activo = FALSE,
            desactivado_por_id = $2
        WHERE id = $1
        RETURNING ${CATEGORY_COLUMNS}`,
        [id, deactivatedById],
    );

    const row = result.rows[0];

    return row ? toCategory(row) : null;
};