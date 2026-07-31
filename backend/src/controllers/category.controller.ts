import type { Request, RequestHandler } from 'express';

import { HttpError } from '../errors/http-errors.js';
import { createCategory, deactivateCategory, getCategories, getCategory, updateCategory, } from '../services/category.service.js';
import { validate } from '../utils/validate.js';
import { categoryListQuerySchema, createCategorySchema, updateCategorySchema, } from '../validators/category.validator.js';
import { idParamsSchema } from '../validators/common.validator.js';

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

export const listCategoriesController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const user = getAuthenticatedUser(request);
        const validatedFilters = validate(
            categoryListQuerySchema,
            request.query,
        );
        const filters = user.rol === 'ADMINISTRATOR'
            ? validatedFilters
            : {
                ...validatedFilters,
                activo: true,
            };
        const result = await getCategories(filters);

        response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getCategoryController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const user = getAuthenticatedUser(request);
        const { id } = validate(
            idParamsSchema,
            request.params,
        );
        const categoria = await getCategory(
            id,
            user.rol !== 'ADMINISTRATOR',
        );

        response.status(200).json({ categoria });
    } catch (error) {
        next(error);
    }
};

export const createCategoryController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const input = validate(
            createCategorySchema,
            request.body,
        );
        const categoria = await createCategory(input);

        response.status(201).json({
            message: 'Categoría creada correctamente',
            categoria,
        });
    } catch (error) {
        next(error);
    }
};

export const updateCategoryController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const user = getAuthenticatedUser(request);
        const { id } = validate(
            idParamsSchema,
            request.params,
        );
        const input = validate(
            updateCategorySchema,
            request.body,
        );
        const categoria = await updateCategory(
            id,
            input,
            user.id,
        );

        response.status(200).json({
            message: 'Categoría actualizada correctamente',
            categoria,
        });
    } catch (error) {
        next(error);
    }
};

export const deactivateCategoryController: RequestHandler = async (
    request,
    response,
    next,
) => {
    try {
        const user = getAuthenticatedUser(request);
        const { id } = validate(
            idParamsSchema,
            request.params,
        );
        const categoria = await deactivateCategory(
            id,
            user.id,
        );

        response.status(200).json({
            message: 'Categoría desactivada correctamente',
            categoria,
        });
    } catch (error) {
        next(error);
    }
};