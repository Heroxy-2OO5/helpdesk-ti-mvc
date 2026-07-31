import { z } from 'zod';

import { paginationFields } from './common.validator.js';

const nombreSchema = z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre no puede superar los 80 caracteres');

const descripcionSchema = z.string().trim().max(300, 'La descripción no puede superar los 300 caracteres');

export const createCategorySchema = z.object({
    nombre: nombreSchema,
    descripcion: descripcionSchema.optional(),}).strict();

export const updateCategorySchema = z.object({
    nombre: nombreSchema.optional(),
    descripcion: descripcionSchema.optional(),
    activo: z.boolean({
        error: 'El estado activo debe ser verdadero o falso',
    }).optional(),}).strict().refine(
    (data) => Object.keys(data).length > 0,
    'Debes enviar al menos un campo para actualizar',
);

export const categoryListQuerySchema = z.object({
    ...paginationFields,
    search: z.string().trim().min(1, 'La búsqueda no puede estar vacía').max(80, 'La búsqueda no puede superar los 80 caracteres').optional(),
    activo: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
}).strict();