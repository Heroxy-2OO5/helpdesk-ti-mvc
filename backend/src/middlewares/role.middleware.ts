import type { RequestHandler } from 'express';

import { HttpError } from '../errors/http-errors.js';
import type { Role } from '../types/auth.types.js';

export const authorizeRoles = (
    ...allowedRoles: Role[]
): RequestHandler => (
    request,
    _response,
    next,
) => {
    if (!request.authUser) {
        next(
            new HttpError(
                401,
                'UNAUTHORIZED',
                'Debes iniciar sesión para acceder a este recurso',
            ),
        );
        return;
    }

    if (!allowedRoles.includes(request.authUser.rol)) {
        next(
            new HttpError(
                403,
                'FORBIDDEN',
                'No tienes permisos para realizar esta acción',
            ),
        );
    return;
    }

    next();
};