import type { RequestHandler } from 'express';

import { HttpError } from '../errors/http-errors.js';
import { login } from '../services/auth.service.js';
import { loginSchema } from '../validators/auth.validator.js';

export const loginController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try { 
        const validation = loginSchema.safeParse(request.body);

        if (!validation.success) {
            const firstIssue = validation.error.issues[0];

            throw new HttpError(
                400,
                'VALIDATION_ERROR',
                firstIssue?.message ?? 'Los datos no son validos',
            );
        }

        const result = await login(validation.data);

        response.status(200).json(result);
    }catch (error){
        next(error);
    }
};

export const meController: RequestHandler = (
    request,
    response,
) => {
    response.status(200).json({
        usuario: request.authUser,
    });
};

export const logoutController: RequestHandler = (
    _request,
    response,
) => {
    response.status(200).json({
        message: 'Sesión cerrada correctamente',
    });
};

export const adminCheckController: RequestHandler = (
    _request,
    response,
) => {
    response.status(200).json({
        message: 'Permiso de administrador verificado',
    });
};