import type { QueryResultRow } from 'pg';

import { pool } from '../config/database.js';
import type { AuthenticatedUser, Role, UserWithPassword} from '../types/auth.types.js';
import type { CreateUserData, UpdateUserData, User, UserFilters } from '../types/user.types.js';

interface AuthenticatedUserRow extends QueryResultRow {
    id: string;
    nombre_completo: string;
    correo: string;
    rol_codigo: Role;
}

interface UserWithPasswordRow extends AuthenticatedUserRow {
    contrasena_hash: string;
    activo: boolean;
}

interface UserRow extends AuthenticatedUserRow {
    activo: boolean;
    ultimo_acceso_en: Date | null;
    creado_en: Date;
    actualizado_en: Date;
    desactivado_en: Date | null;
    desactivado_por_id: string | null;
}

interface CountRow extends QueryResultRow {
    total: string;
}

const USER_COLUMNS = `
    id::text,
    nombre_completo,
    correo,
    rol_codigo,
    activo,
    ultimo_acceso_en,
    creado_en,
    actualizado_en,
    desactivado_en,
    desactivado_por_id::text`;

const toAuthenticatedUser = (
    row: AuthenticatedUserRow,
): AuthenticatedUser => ({
    id: row.id,
    nombreCompleto: row.nombre_completo,
    correo: row.correo,
    rol: row.rol_codigo,
});

const toIsoString = (value: Date | null): string | null => (
    value ? value.toISOString() : null
);

const toUser = (row: UserRow): User => ({
    ...toAuthenticatedUser(row),
    activo: row.activo,
    ultimoAccesoEn: toIsoString(row.ultimo_acceso_en),
    creadoEn: row.creado_en.toISOString(),
    actualizadoEn: row.actualizado_en.toISOString(),
    desactivadoEn: toIsoString(row.desactivado_en),
    desactivadoPorId: row.desactivado_por_id,
});

export const findUserByEmail = async (
    email: string,
): Promise<UserWithPassword | null> => {
    const result = await pool.query<UserWithPasswordRow>(
        `SELECT
        id::text,
        nombre_completo,
        correo,
        contrasena_hash,
        rol_codigo,
        activo
        FROM usuarios
        WHERE LOWER(correo) = LOWER($1)
        LIMIT 1`,
        [email],
    );

    const row = result.rows[0];

    if(!row) {
        return null;
    }

    return {
        ...toAuthenticatedUser(row),
        contrasenaHash: row.contrasena_hash,
        activo: row.activo,
    };
};

export const findActiveUserById = async (
    id: string,
): Promise<AuthenticatedUser | null> => {
    const result = await pool.query<AuthenticatedUserRow>(
        `SELECT
        id::text,
        nombre_completo,
        correo,
        rol_codigo
        FROM usuarios
        WHERE id = $1
        AND activo = TRUE
        LIMIT 1`,
        [id],
    );

    const row = result.rows[0];

    return row ? toAuthenticatedUser(row) : null;
};

export const updateLastAccess = async (
    id: string,
): Promise<void> => {
    await pool.query(
        `UPDATE usuarios
        SET ultimo_acceso_en = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [id],
    );
};

export const findUserById = async (
    id: string,
): Promise<User | null> => {
    const result = await pool.query<UserRow>(
        `SELECT ${USER_COLUMNS}
        FROM usuarios
        WHERE id = $1
        LIMIT 1`,
        [id],
    );

    const row = result.rows[0];

    return row ? toUser(row) : null;
};

export const listUsers = async (
    filters: UserFilters,
): Promise<{ usuarios: User[]; total: number }> => {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.search) {
        values.push(filters.search);
        const parameter = `$${values.length}`;

        conditions.push(
            `(nombre_completo ILIKE '%' || ${parameter} || '%'
            OR correo ILIKE '%' || ${parameter} || '%')`,
        );
    }

    if (filters.rol) {
        values.push(filters.rol);
        conditions.push(`rol_codigo = $${values.length}`);
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

    const [usersResult, countResult] = await Promise.all([
        pool.query<UserRow>(
            `SELECT ${USER_COLUMNS}
            FROM usuarios
            ${where}
            ORDER BY creado_en DESC, id DESC
            LIMIT ${limitParameter}
            OFFSET ${offsetParameter}`,
            listValues,
        ),
        pool.query<CountRow>(
            `SELECT COUNT(*)::text AS total
            FROM usuarios
            ${where}`,
            values,
        ),
    ]);

    return {
        usuarios: usersResult.rows.map(toUser),
        total: Number(countResult.rows[0]?.total ?? 0),
    };
};

export const insertUser = async (
    data: CreateUserData,
): Promise<User> => {
    const result = await pool.query<UserRow>(
        `INSERT INTO usuarios (
            nombre_completo,
            correo,
            contrasena_hash,
            rol_codigo
        )
        VALUES ($1, $2, $3, $4)
        RETURNING ${USER_COLUMNS}`,
        [
            data.nombreCompleto,
            data.correo,
            data.contrasenaHash,
            data.rol,
        ],
    );

    return toUser(result.rows[0]!);
};

export const updateUserById = async (
    id: string,
    data: UpdateUserData,
): Promise<User | null> => {
    const result = await pool.query<UserRow>(
        `UPDATE usuarios
        SET
            nombre_completo = COALESCE($2::varchar, nombre_completo),
            correo = COALESCE($3::varchar, correo),
            contrasena_hash = COALESCE($4::varchar, contrasena_hash),
            rol_codigo = COALESCE($5::varchar, rol_codigo),
            activo = COALESCE($6::boolean, activo),
            desactivado_por_id = CASE
                WHEN $6::boolean IS FALSE THEN $7::bigint
                WHEN $6::boolean IS TRUE THEN NULL
                ELSE desactivado_por_id
            END
        WHERE id = $1
        RETURNING ${USER_COLUMNS}`,
        [
            id,
            data.nombreCompleto ?? null,
            data.correo ?? null,
            data.contrasenaHash ?? null,
            data.rol ?? null,
            data.activo ?? null,
            data.desactivadoPorId ?? null,
        ],
    );

    const row = result.rows[0];

    return row ? toUser(row) : null;
};

export const deactivateUserById = async (
    id: string,
    deactivatedById: string,
): Promise<User | null> => {
    const result = await pool.query<UserRow>(
        `UPDATE usuarios
        SET
            activo = FALSE,
            desactivado_por_id = $2
        WHERE id = $1
        RETURNING ${USER_COLUMNS}`,
        [id, deactivatedById],
    );

    const row = result.rows[0];

    return row ? toUser(row) : null;
};