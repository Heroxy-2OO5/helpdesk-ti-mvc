import jwt, { type SignOptions } from 'jsonwebtoken';

import { environment } from '../config/environment.js';
import { HttpError } from '../errors/http-errors.js';
import { findUserByEmail, updateLastAccess } from '../models/user.model.js';
import type { AuthenticatedUser } from '../types/auth.types.js';
import { verifyPassword } from '../utils/password.js'
import type { LoginInput } from '../validators/auth.validator.js';

interface LoginResult {
    token: string;
    expiresIn: string;
    usuario: AuthenticatedUser;
}

const INVALID_CREDENTIALS = 'El correo o la contraseña son incorrectos';

export const login = async (
    input: LoginInput,
): Promise<LoginResult> => {
    const user = await findUserByEmail(input.correo);

    if (!user || !user.activo){
        throw new HttpError(
            401,
            'INVALID_CREDENTIALS',
            INVALID_CREDENTIALS,
        );
    }

    const isPasswordValid = await verifyPassword(
        input.contrasena,
        user.contrasenaHash,
    );

    if (!isPasswordValid){
        throw new HttpError(
            401,
            'INVALID_CREDENTIALS',
            INVALID_CREDENTIALS,
        );
    }

    const usuario: AuthenticatedUser = {
        id: user.id,
        nombreCompleto: user.nombreCompleto,
        correo: user.correo,
        rol: user.rol,
    };

    const signOptions: SignOptions = {
        subject: usuario.id,
        expiresIn: environment.jwtExpiresIn as SignOptions['expiresIn'],
        algorithm: 'HS256',
    };

    const token = jwt.sign(
        {
            correo: usuario.correo,
            rol: usuario.rol,
        },
        environment.jwtSecret,
        signOptions,
    );

    await updateLastAccess(usuario.id);

    return {
        token,
        expiresIn: environment.jwtExpiresIn,
        usuario,
    };
};