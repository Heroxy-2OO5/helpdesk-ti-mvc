import type { Request, RequestHandler } from 'express';

import { HttpError } from '../errors/http-errors.js';
import {
    createTicket,
    deactivateTicket,
    getTicket,
    getTickets,
    updateTicket,
} from '../services/ticket.service.js';
import { validate } from '../utils/validate.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
    createTicketSchema,
    deleteTicketSchema,
    ticketListQuerySchema,
    updateTicketSchema,
} from '../validators/ticket.validator.js';

const getAuthenticatedUser = (request: Request) => {
    if (!request.authUser) {
        throw new HttpError(
            401,
            'UNAUTHORIZED',
            'Debes iniciar sesión para acceder a este recurso',
        );
    }

    return request.authUser;
};

export const listTicketsController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const filters = validate(
            ticketListQuerySchema,
            request.query,
        );
        const result = await getTickets(
            filters,
            getAuthenticatedUser(request),
        );

        response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getTicketController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const { id } = validate(
            idParamsSchema,
            request.params,
        );
        const ticket = await getTicket(
            id,
            getAuthenticatedUser(request),
        );

        response.status(200).json({ ticket });
    } catch (error) {
        next(error);
    }
};

export const createTicketController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const input = validate(
            createTicketSchema,
            request.body,
        );
        const ticket = await createTicket(
            input,
            getAuthenticatedUser(request),
        );

        response.status(201).json({
            message: 'Ticket creado correctamente',
            ticket,
        });
    } catch (error) {
        next(error);
    }
};

export const updateTicketController: RequestHandler = async (
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
            updateTicketSchema,
            request.body,
        );
        const ticket = await updateTicket(
            id,
            input,
            getAuthenticatedUser(request),
        );

        response.status(200).json({
            message: 'Ticket actualizado correctamente',
            ticket,
        });
    } catch (error) {
        next(error);
    }
};

export const deactivateTicketController: RequestHandler = async (
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
            deleteTicketSchema,
            request.body,
        );
        const ticket = await deactivateTicket(
            id,
            input,
            getAuthenticatedUser(request),
        );

        response.status(200).json({
            message: 'Ticket eliminado correctamente',
            ticket,
        });
    } catch (error) {
        next(error);
    }
};
