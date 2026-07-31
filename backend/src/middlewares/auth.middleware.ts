import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { environment } from '../config/environment.js';
import { HttpError } from '../errors/http-errors.js';
import {findActiveUserById,} from '../models/user.model.js';

const UNAUTHORIZED_MESSAGE =
    'Debes iniciar sesión para acceder a este recurso';

export const authenticate: RequestHandler = async (
    request,
    _response,
    next,
) => {
    const authorization = request.header('authorization');

    if (!authorization?.startsWith('Bearer ')) {
        next(
            new HttpError(
            401,
            'UNAUTHORIZED',
            UNAUTHORIZED_MESSAGE,
            ),
        );
    return;
    }

    const token = authorization
        .slice('Bearer '.length)
        .trim();

    if (!token) {
        next(
            new HttpError(
                401,
                'UNAUTHORIZED',
                UNAUTHORIZED_MESSAGE,
                ),
            );
    return;
    }

    let payload: string | jwt.JwtPayload;

    try {
        payload = jwt.verify(
            token,
            environment.jwtSecret,
            {
                algorithms: ['HS256'],
            },
        );
    } catch {
        next(
            new HttpError(
                401,
                'UNAUTHORIZED',
                UNAUTHORIZED_MESSAGE,
                ),
            );
        return;
    }

    if (
        typeof payload === 'string' ||
        typeof payload.sub !== 'string'
    ) {
        next(
            new HttpError(
            401,
            'UNAUTHORIZED',
            UNAUTHORIZED_MESSAGE,
            ),
        );
        return;
    }

    try {
        const user = await findActiveUserById(payload.sub);

        if (!user) {
            next(
            new HttpError(
                401,
                'UNAUTHORIZED',
                UNAUTHORIZED_MESSAGE,
                ),
            );
        return;
        }

        request.authUser = user;
        next();
    } catch (error) {
        next(error);
    }
};