import { z } from 'zod';

import { PRIORITY_CODES, TICKET_STATUS_CODES, } from '../types/ticket.types.js';
import { idParamsSchema, paginationFields, } from './common.validator.js';

const idSchema = idParamsSchema.shape.id;

const tituloSchema = z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(150, 'El título no puede superar los 150 caracteres');

const descripcionSchema = z.string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(4000, 'La descripción no puede superar los 4000 caracteres');

const prioridadSchema = z.enum(
    PRIORITY_CODES,
    'La prioridad seleccionada no es válida',
);

const estadoSchema = z.enum(
    TICKET_STATUS_CODES,
    'El estado seleccionado no es válido',
);

export const createTicketSchema = z.object({
    titulo: tituloSchema,
    descripcion: descripcionSchema,
    categoriaId: idSchema,
    prioridadCodigo: prioridadSchema,
    solicitanteId: idSchema.optional(),
}).strict();

export const ticketListQuerySchema = z.object({
    ...paginationFields,
    search: z.string()
        .trim()
        .min(1, 'La búsqueda no puede estar vacía')
        .max(150, 'La búsqueda no puede superar los 150 caracteres')
        .optional(),
    estado: estadoSchema.optional(),
    prioridad: prioridadSchema.optional(),
    categoriaId: idSchema.optional(),
    tecnicoId: idSchema.optional(),
    activo: z.enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional(),
}).strict();

export const updateTicketSchema = z.object({
    titulo: tituloSchema.optional(),
    descripcion: descripcionSchema.optional(),
    categoriaId: idSchema.optional(),
    prioridadCodigo: prioridadSchema.optional(),
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    'Debes enviar al menos un campo para actualizar',
);

export const deleteTicketSchema = z.object({
    motivo: z.string()
        .trim()
        .min(5, 'El motivo debe tener al menos 5 caracteres')
        .max(300, 'El motivo no puede superar los 300 caracteres'),
}).strict();
