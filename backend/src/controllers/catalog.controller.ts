import type { RequestHandler } from 'express';

import { getPrioritiesCatalog, getRolesCatalog, getTicketStatusesCatalog, } from '../services/catalog.service.js';

export const listRolesController: RequestHandler = async (
    _request,
    response,
    next,
) => {
    try {
        const roles = await getRolesCatalog();

        response.status(200).json({ roles });
    } catch (error) {
        next(error);
    }
};

export const listPrioritiesController: RequestHandler = async (
    _request,
    response,
    next,
) => {
    try {
        const prioridades = await getPrioritiesCatalog();

        response.status(200).json({ prioridades });
    } catch (error) {
        next(error);
    }
};

export const listTicketStatusesController: RequestHandler = async (
    _request,
    response,
    next,
) => {
    try {
        const estados = await getTicketStatusesCatalog();

        response.status(200).json({ estados });
    } catch (error) {
        next(error);
    }
};