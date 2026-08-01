import { HttpError } from '../errors/http-errors.js';
import { findActivePriorities } from '../models/catalog.model.js';
import { findCategoryById } from '../models/category.model.js';
import {
    assignTechnicianById,
    changeTicketStatusById,
    deactivateTicketById,
    findTicketById,
    findTicketHistory,
    insertTicket,
    isTransitionAllowed,
    listTickets as listTicketsModel,
    updateTicketById,
} from '../models/ticket.model.js';
import { findUserById } from '../models/user.model.js';
import type { AuthenticatedUser } from '../types/auth.types.js';
import type {
    AssignTicketInput,
    ChangeTicketStatusInput,
    CreateTicketInput,
    DeleteTicketInput,
    PriorityCode,
    TicketDetail,
    TicketDetailWithoutHistory,
    TicketFilters,
    TicketListResult,
    UpdateTicketInput,
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

export const updateTicket = async (
    id: string,
    input: UpdateTicketInput,
    user: AuthenticatedUser,
): Promise<TicketDetail> => {
    const currentTicket = await getTicket(id, user);

    if (!currentTicket.activo) {
        throw new HttpError(
            409,
            'TICKET_ALREADY_INACTIVE',
            'No puedes actualizar un ticket eliminado',
        );
    }

    if (user.rol === 'TECHNICIAN') {
        throw new HttpError(
            403,
            'FORBIDDEN',
            'Los técnicos no pueden modificar los datos generales del ticket',
        );
    }

    if (
        user.rol === 'REQUESTER'
        && currentTicket.estadoCodigo !== 'PENDING'
    ) {
        throw new HttpError(
            409,
            'TICKET_NOT_EDITABLE',
            'Solo puedes modificar tickets que estén pendientes',
        );
    }

    const validations: Promise<void>[] = [];

    if (input.categoriaId) {
        validations.push(ensureCategory(input.categoriaId));
    }

    if (input.prioridadCodigo) {
        validations.push(ensurePriority(input.prioridadCodigo));
    }

    await Promise.all(validations);

    try {
        const ticket = await updateTicketById(id, {
            ...input,
            actualizadoPorId: user.id,
        });

        if (!ticket) {
            throw new HttpError(
                404,
                'TICKET_NOT_FOUND',
                'El ticket solicitado no existe',
            );
        }

        const historial = await findTicketHistory(id);

        return {
            ...ticket,
            historial,
        };
    } catch (error) {
        return throwTicketDatabaseError(error);
    }
};

export const deactivateTicket = async (
    id: string,
    input: DeleteTicketInput,
    user: AuthenticatedUser,
): Promise<TicketDetail> => {
    if (user.rol !== 'ADMINISTRATOR') {
        throw new HttpError(
            403,
            'FORBIDDEN',
            'Solo un administrador puede eliminar tickets',
        );
    }

    const currentTicket = await getTicket(id, user);

    if (!currentTicket.activo) {
        throw new HttpError(
            409,
            'TICKET_ALREADY_INACTIVE',
            'El ticket ya se encuentra eliminado',
        );
    }

    try {
        const ticket = await deactivateTicketById(
            id,
            user.id,
            input.motivo,
        );

        if (!ticket) {
            throw new HttpError(
                404,
                'TICKET_NOT_FOUND',
                'El ticket solicitado no existe',
            );
        }

        const historial = await findTicketHistory(id);

        return {
            ...ticket,
            historial,
        };
    } catch (error) {
        return throwTicketDatabaseError(error);
    }
};

export const assignTicket = async (
    id: string,
    input: AssignTicketInput,
    user: AuthenticatedUser,
): Promise<TicketDetail> => {
    if (user.rol !== 'ADMINISTRATOR') {
        throw new HttpError(
            403,
            'FORBIDDEN',
            'Solo un administrador puede asignar técnicos',
        );
    }

    const currentTicket = await getTicket(id, user);

    if (!currentTicket.activo) {
        throw new HttpError(
            409,
            'TICKET_ALREADY_INACTIVE',
            'No puedes asignar un ticket eliminado',
        );
    }

    if (input.tecnicoId === currentTicket.tecnicoId) {
        throw new HttpError(
            409,
            'TECHNICIAN_ALREADY_ASSIGNED',
            input.tecnicoId
                ? 'El técnico ya se encuentra asignado a este ticket'
                : 'El ticket ya se encuentra sin técnico asignado',
        );
    }

    if (input.tecnicoId === null) {
        if (currentTicket.estadoCodigo !== 'ASSIGNED') {
            throw new HttpError(
                409,
                'UNASSIGNMENT_NOT_ALLOWED',
                'Solo puedes retirar un técnico de un ticket asignado',
            );
        }
    } else {
        if (![
            'PENDING',
            'ASSIGNED',
            'IN_PROGRESS',
        ].includes(currentTicket.estadoCodigo)) {
            throw new HttpError(
                409,
                'ASSIGNMENT_NOT_ALLOWED',
                'No puedes asignar técnicos en el estado actual del ticket',
            );
        }

        const technician = await findUserById(input.tecnicoId);

        if (
            !technician
            || !technician.activo
            || technician.rol !== 'TECHNICIAN'
        ) {
            throw new HttpError(
                400,
                'INVALID_TECHNICIAN',
                'El responsable debe ser un técnico activo',
            );
        }
    }

    try {
        const ticket = await assignTechnicianById(
            id,
            input.tecnicoId,
            user.id,
        );

        if (!ticket) {
            throw new HttpError(
                404,
                'TICKET_NOT_FOUND',
                'El ticket solicitado no existe',
            );
        }

        const historial = await findTicketHistory(id);

        return {
            ...ticket,
            historial,
        };
    } catch (error) {
        return throwTicketDatabaseError(error);
    }
};

export const changeTicketStatus = async (
    id: string,
    input: ChangeTicketStatusInput,
    user: AuthenticatedUser,
): Promise<TicketDetail> => {
    if (user.rol === 'REQUESTER') {
        throw new HttpError(
            403,
            'FORBIDDEN',
            'Los solicitantes no pueden cambiar el estado de los tickets',
        );
    }

    const currentTicket = await getTicket(id, user);

    if (!currentTicket.activo) {
        throw new HttpError(
            409,
            'TICKET_ALREADY_INACTIVE',
            'No puedes cambiar el estado de un ticket eliminado',
        );
    }

    if (
        user.rol === 'TECHNICIAN'
        && currentTicket.tecnicoId !== user.id
    ) {
        throw new HttpError(
            403,
            'FORBIDDEN',
            'Solo el técnico asignado puede cambiar el estado del ticket',
        );
    }

    if (input.estadoCodigo === currentTicket.estadoCodigo) {
        throw new HttpError(
            409,
            'STATUS_NOT_CHANGED',
            'El ticket ya se encuentra en el estado indicado',
        );
    }

    if (input.estadoCodigo === 'PENDING') {
        throw new HttpError(
            409,
            'USE_ASSIGNMENT_ROUTE',
            'Retira la asignación para devolver el ticket a pendiente',
        );
    }

    if (
        currentTicket.estadoCodigo === 'PENDING'
        && input.estadoCodigo === 'ASSIGNED'
    ) {
        throw new HttpError(
            409,
            'USE_ASSIGNMENT_ROUTE',
            'Asigna un técnico para cambiar el ticket a asignado',
        );
    }

    if (
        input.estadoCodigo === 'CLOSED'
        && user.rol !== 'ADMINISTRATOR'
    ) {
        throw new HttpError(
            403,
            'FORBIDDEN',
            'Solo un administrador puede cerrar tickets',
        );
    }

    if (
        input.solucion
        && !['RESOLVED', 'CLOSED'].includes(input.estadoCodigo)
    ) {
        throw new HttpError(
            400,
            'SOLUTION_NOT_ALLOWED',
            'La solución solo se registra al resolver o cerrar un ticket',
        );
    }

    if (
        input.estadoCodigo === 'RESOLVED'
        && !input.solucion
        && !currentTicket.solucion
    ) {
        throw new HttpError(
            400,
            'SOLUTION_REQUIRED',
            'Debes registrar una solución para resolver el ticket',
        );
    }

    const allowed = await isTransitionAllowed(
        currentTicket.estadoCodigo,
        input.estadoCodigo,
    );

    if (!allowed) {
        throw new HttpError(
            409,
            'INVALID_STATUS_TRANSITION',
            `No se permite cambiar de ${currentTicket.estadoCodigo} a ${input.estadoCodigo}`,
        );
    }

    try {
        const ticket = await changeTicketStatusById(
            id,
            input.estadoCodigo,
            input.solucion,
            user.id,
        );

        if (!ticket) {
            throw new HttpError(
                404,
                'TICKET_NOT_FOUND',
                'El ticket solicitado no existe',
            );
        }

        const historial = await findTicketHistory(id);

        return {
            ...ticket,
            historial,
        };
    } catch (error) {
        return throwTicketDatabaseError(error);
    }
};
