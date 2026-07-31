import { z } from 'zod';

import { ROLES } from '../types/auth.types.js';
import { paginationFields } from './common.validator.js';

const nombreCompletoSchema = z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(120, 'El nombre no puede superar los 120 caracteres');

const correoSchema = z.string().trim().min(1, 'El correo es obligatorio').max(254, 'El correo no puede superar los 254 caracteres').email('El correo no tiene un formato válido').toLowerCase();

const contrasenaSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72, 'La contraseña no puede superar los 72 caracteres');

const rolSchema = z.enum(ROLES, 'El rol seleccionado no es válido',);

export const createUserSchema = z.object({ nombreCompleto: nombreCompletoSchema, correo: correoSchema, contrasena: contrasenaSchema, rol: rolSchema,}).strict();

export const updateUserSchema = z.object({
    nombreCompleto: nombreCompletoSchema.optional(),
    correo: correoSchema.optional(),
    contrasena: contrasenaSchema.optional(),
    rol: rolSchema.optional(),
    activo: z.boolean({
        error: 'El estado activo debe ser verdadero o falso',
    }).optional(), }).strict().refine(
    (data) => Object.keys(data).length > 0,
    'Debes enviar al menos un campo para actualizar',
);

export const userListQuerySchema = z.object({
    ...paginationFields,
    search: z.string().trim().min(1, 'La búsqueda no puede estar vacía').max(120, 'La búsqueda no puede superar los 120 caracteres').optional(),
    rol: rolSchema.optional(),
    activo: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
}).strict();