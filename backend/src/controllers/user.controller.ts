import type { Request, RequestHandler } from 'express';

import { HttpError } from '../errors/http-errors.js';
import {
    createUser,
    deactivateUser,
    getUser,
    getUsers,
    updateUser,
} from '../services/user.service.js';
import { validate } from '../utils/validate.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
    createUserSchema,
    updateUserSchema,
    userListQuerySchema,
} from '../validators/user.validator.js';

const getAdministratorId = (request: Request): string => {
    if (!request.authUser) {
        throw new HttpError(
            401,
            'UNAUTHORIZED',
            'Debes iniciar sesión para acceder a este recurso',
        );
    }

    return request.authUser.id;
};

export const listUsersController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const filters = validate(
            userListQuerySchema,
            request.query,
        );
        const result = await getUsers(filters);

        response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getUserController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const { id } = validate(
            idParamsSchema,
            request.params,
        );
        const usuario = await getUser(id);

        response.status(200).json({ usuario });
    } catch (error) {
        next(error);
    }
};

export const createUserController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const input = validate(
            createUserSchema,
            request.body,
        );
        const usuario = await createUser(input);

        response.status(201).json({
            message: 'Usuario creado correctamente',
            usuario,
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const { id } = validate(
            idParamsSchema,
            request.params,
        );
        const input = validate(
            updateUserSchema,
            request.body,
        );
        const usuario = await updateUser(
            id,
            input,
            getAdministratorId(request),
        );

        response.status(200).json({
            message: 'Usuario actualizado correctamente',
            usuario,
        });
    } catch (error) {
        next(error);
    }
};

export const deactivateUserController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const { id } = validate(
            idParamsSchema,
            request.params,
        );
        const usuario = await deactivateUser(
            id,
            getAdministratorId(request),
        );

        response.status(200).json({
            message: 'Usuario desactivado correctamente',
            usuario,
        });
    } catch (error) {
        next(error);
    }
};