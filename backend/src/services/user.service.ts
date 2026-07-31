import { HttpError } from '../errors/http-errors.js';
import {
    deactivateUserById,
    findUserById,
    insertUser,
    listUsers as listUsersModel,
    updateUserById,
} from '../models/user.model.js';
import type {
    createUserInput,
    updateUserInput,
    User,
    UserFilters,
    UserListResult,
} from '../types/user.types.js';
import { hashPassword } from '../utils/password.js';
import { hasPostgresCode } from '../utils/postgres-error.js';

const throwUserDatabaseError = (error: unknown): never => {
    if (hasPostgresCode(error, '23505')) {
        throw new HttpError(
            409,
            'EMAIL_ALREADY_EXISTS',
            'Ya existe un usuario registrado con ese correo',
        );
    }

    if (hasPostgresCode(error, '23503')) {
        throw new HttpError(
            400,
            'INVALID_ROLE',
            'El rol seleccionado no existe',
        );
    }

    throw error;
};

export const getUser = async (id: string): Promise<User> => {
    const user = await findUserById(id);

    if (!user) {
        throw new HttpError(
            404,
            'USER_NOT_FOUND',
            'El usuario solicitado no existe',
        );
    }

    return user;
};

export const getUsers = async (
    filters: UserFilters,
): Promise<UserListResult> => {
    const result = await listUsersModel(filters);

    return {
        usuarios: result.usuarios,
        paginacion: {
            page: filters.page,
            limit: filters.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / filters.limit),
        },
    };
};

export const createUser = async (
    input: createUserInput,
): Promise<User> => {
    const contrasenaHash = await hashPassword(input.contrasena);

    try {
        return await insertUser({
            nombreCompleto: input.nombreCompleto,
            correo: input.correo,
            contrasenaHash,
            rol: input.rol,
        });
    } catch (error) {
        return throwUserDatabaseError(error);
    }
};

export const updateUser = async (
    id: string,
    input: updateUserInput,
    administratorId: string,
): Promise<User> => {
    await getUser(id);

    if (id === administratorId && input.activo === false) {
        throw new HttpError(
            409,
            'SELF_DEACTIVATION_NOT_ALLOWED',
            'No puedes desactivar tu propia cuenta',
        );
    }

    const contrasenaHash = input.contrasena
        ? await hashPassword(input.contrasena)
        : undefined;

    try {
        const user = await updateUserById(id, {
            nombreCompleto: input.nombreCompleto,
            correo: input.correo,
            contrasenaHash,
            rol: input.rol,
            activo: input.activo,
            desactivadoPorId: input.activo === false
                ? administratorId
                : undefined,
        });

        if (!user) {
            throw new HttpError(
                404,
                'USER_NOT_FOUND',
                'El usuario solicitado no existe',
            );
        }

        return user;
    } catch (error) {
        return throwUserDatabaseError(error);
    }
};

export const deactivateUser = async (
    id: string,
    administratorId: string,
): Promise<User> => {
    const currentUser = await getUser(id);

    if (id === administratorId) {
        throw new HttpError(
            409,
            'SELF_DEACTIVATION_NOT_ALLOWED',
            'No puedes desactivar tu propia cuenta',
        );
    }

    if (!currentUser.activo) {
        throw new HttpError(
            409,
            'USER_ALREADY_INACTIVE',
            'El usuario ya se encuentra inactivo',
        );
    }

    const user = await deactivateUserById(
        id,
        administratorId,
    );

    if (!user) {
        throw new HttpError(
            404,
            'USER_NOT_FOUND',
            'El usuario solicitado no existe',
        );
    }

    return user;
};