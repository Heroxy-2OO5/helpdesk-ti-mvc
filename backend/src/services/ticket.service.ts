import { HttpError } from '../errors/http-errors.js';
import { findActivePriorities } from '../models/catalog.model.js';
import { findCategoryById } from '../models/category.model.js';
import {
    findTicketById,
    findTicketHistory,
    insertTicket,
    listTickets as listTicketsModel,
} from '../models/ticket.model.js';
import { findUserById } from '../models/user.model.js';
import type { AuthenticatedUser } from '../types/auth.types.js';
import type {
    CreateTicketInput,
    PriorityCode,
    TicketDetail,
    TicketDetailWithoutHistory,
    TicketFilters,
    TicketListResult,
} from '../types/ticket.types.js';
import { hasPostgresCode } from '../utils/postgres-error.js';

const throwTicketDatabaseError = (error: unknown): never => {
    if (hasPostgresCode(error, '23505')) {
        throw new HttpError(
            409,
            'TICKET_CODE_CONFLICT',
            'No fue posible generar un código único para el ticket',
        );
    }

    if (
        hasPostgresCode(error, '23503')
        || hasPostgresCode(error, 'P0001')
    ) {
        throw new HttpError(
            400,
            'TICKET_RULE_VIOLATION',
            'Los datos del ticket no cumplen las reglas del sistema',
        );
    }

    throw error;
};

const ensureRequester = async (id: string): Promise<void> => {
    const user = await findUserById(id);

    if (!user || !user.activo || user.rol !== 'REQUESTER') {
        throw new HttpError(
            400,
            'INVALID_REQUESTER',
            'El solicitante debe ser un usuario activo con rol de solicitante',
        );
    }
};

const ensureCategory = async (id: string): Promise<void> => {
    const category = await findCategoryById(id);

    if (!category || !category.activo) {
        throw new HttpError(
            400,
            'INVALID_CATEGORY',
            'La categoría seleccionada no existe o está inactiva',
        );
    }
};

const ensurePriority = async (
    code: PriorityCode,
): Promise<void> => {
    const priorities = await findActivePriorities();

    if (!priorities.some((priority) => priority.codigo === code)) {
        throw new HttpError(
            400,
            'INVALID_PRIORITY',
            'La prioridad seleccionada no existe o está inactiva',
        );
    }
};

const ensureTicketAccess = (
    ticket: TicketDetailWithoutHistory,
    user: AuthenticatedUser,
): void => {
    if (!ticket.activo && user.rol !== 'ADMINISTRATOR') {
        throw new HttpError(
            404,
            'TICKET_NOT_FOUND',
            'El ticket solicitado no existe',
        );
    }

    const hasAccess = user.rol === 'ADMINISTRATOR'
        || (
            user.rol === 'REQUESTER'
            && ticket.solicitanteId === user.id
        )
        || (
            user.rol === 'TECHNICIAN'
            && ticket.tecnicoId === user.id
        );

    if (!hasAccess) {
        throw new HttpError(
            403,
            'FORBIDDEN',
            'No tienes permisos para consultar este ticket',
        );
    }
};

export const getTicket = async (
    id: string,
    user: AuthenticatedUser,
): Promise<TicketDetail> => {
    const ticket = await findTicketById(id);

    if (!ticket) {
        throw new HttpError(
            404,
            'TICKET_NOT_FOUND',
            'El ticket solicitado no existe',
        );
    }

    ensureTicketAccess(ticket, user);

    const historial = await findTicketHistory(id);

    return {
        ...ticket,
        historial,
    };
};

export const getTickets = async (
    filters: TicketFilters,
    user: AuthenticatedUser,
): Promise<TicketListResult> => {
    const result = await listTicketsModel({
        ...filters,
        usuarioId: user.id,
        rol: user.rol,
    });

    return {
        tickets: result.tickets,
        paginacion: {
            page: filters.page,
            limit: filters.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / filters.limit),
        },
    };
};

export const createTicket = async (
    input: CreateTicketInput,
    user: AuthenticatedUser,
): Promise<TicketDetail> => {
    if (user.rol === 'TECHNICIAN') {
        throw new HttpError(
            403,
            'FORBIDDEN',
            'Los técnicos no pueden crear tickets',
        );
    }

    let requesterId: string;

    if (user.rol === 'REQUESTER') {
        if (input.solicitanteId && input.solicitanteId !== user.id) {
            throw new HttpError(
                403,
                'FORBIDDEN',
                'No puedes crear tickets para otro solicitante',
            );
        }

        requesterId = user.id;
    } else {
        if (!input.solicitanteId) {
            throw new HttpError(
                400,
                'REQUESTER_REQUIRED',
                'Debes seleccionar el solicitante del ticket',
            );
        }

        requesterId = input.solicitanteId;
    }

    await Promise.all([
        ensureRequester(requesterId),
        ensureCategory(input.categoriaId),
        ensurePriority(input.prioridadCodigo),
    ]);

    try {
        const ticket = await insertTicket({
            titulo: input.titulo,
            descripcion: input.descripcion,
            categoriaId: input.categoriaId,
            prioridadCodigo: input.prioridadCodigo,
            solicitanteId: requesterId,
            creadoPorId: user.id,
        });

        if (!ticket) {
            throw new Error('El ticket no pudo recuperarse después de crearlo');
        }

        const historial = await findTicketHistory(ticket.id);

        return {
            ...ticket,
            historial,
        };
    } catch (error) {
        return throwTicketDatabaseError(error);
    }
};
