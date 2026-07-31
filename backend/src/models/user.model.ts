import type { QueryResultRow } from 'pg';

import { pool } from '../config/database.js';
import type {
    AuthenticatedUser,
    Role,
    UserWithPassword,
} from '../types/auth.types.js';

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

const toAuthenticatedUser = (
    row: AuthenticatedUserRow,
): AuthenticatedUser => ({
    id: row.id,
    nombreCompleto: row.nombre_completo,
    correo: row.correo,
    rol: row.rol_codigo,
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