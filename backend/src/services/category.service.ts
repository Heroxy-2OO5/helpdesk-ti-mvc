import { HttpError } from '../errors/http-errors.js';
import { deactivateCategoryById, findCategoryById, insertCategory,listCategories as listCategoriesModel, updateCategoryById, } from '../models/category.model.js';
import type {
    Category,
    CategoryFilters,
    CategoryListResult,
    CreateCategoryInput,
    UpdateCategoryInput,
} from '../types/category.types.js';
import { hasPostgresCode } from '../utils/postgres-error.js';

const throwCategoryDatabaseError = (error: unknown): never => {
    if (hasPostgresCode(error, '23505')) {
        throw new HttpError(
            409,
            'CATEGORY_ALREADY_EXISTS',
            'Ya existe una categoría registrada con ese nombre',
        );
    }

    throw error;
};

export const getCategory = async (
    id: string,
    activeOnly = false,
): Promise<Category> => {
    const category = await findCategoryById(id);

    if (!category || (activeOnly && !category.activo)) {
        throw new HttpError(
            404,
            'CATEGORY_NOT_FOUND',
            'La categoría solicitada no existe',
        );
    }

    return category;
};

export const getCategories = async (
    filters: CategoryFilters,
): Promise<CategoryListResult> => {
    const result = await listCategoriesModel(filters);

    return {
        categorias: result.categorias,
        paginacion: {
            page: filters.page,
            limit: filters.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / filters.limit),
        },
    };
};

export const createCategory = async (
    input: CreateCategoryInput,
): Promise<Category> => {
    try {
        return await insertCategory(input);
    } catch (error) {
        return throwCategoryDatabaseError(error);
    }
};

export const updateCategory = async (
    id: string,
    input: UpdateCategoryInput,
    administratorId: string,
): Promise<Category> => {
    await getCategory(id);

    try {
        const category = await updateCategoryById(id, {
            ...input,
            desactivadoPorId: input.activo === false
                ? administratorId
                : undefined,
        });

        if (!category) {
            throw new HttpError(
                404,
                'CATEGORY_NOT_FOUND',
                'La categoría solicitada no existe',
            );
        }

        return category;
    } catch (error) {
        return throwCategoryDatabaseError(error);
    }
};

export const deactivateCategory = async (
    id: string,
    administratorId: string,
): Promise<Category> => {
    const currentCategory = await getCategory(id);

    if (!currentCategory.activo) {
        throw new HttpError(
            409,
            'CATEGORY_ALREADY_INACTIVE',
            'La categoría ya se encuentra inactiva',
        );
    }

    const category = await deactivateCategoryById(
        id,
        administratorId,
    );

    if (!category) {
        throw new HttpError(
            404,
            'CATEGORY_NOT_FOUND',
            'La categoría solicitada no existe',
        );
    }

    return category;
};