export interface Category {
    id: string;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
    desactivadoEn: string | null;
    desactivadoPorId: string | null;
}

export interface CreateCategoryInput {
    nombre: string;
    descripcion?: string;
}

export interface UpdateCategoryInput {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
}

export interface UpdateCategoryData extends UpdateCategoryInput {
    desactivadoPorId?: string;
}

export interface CategoryFilters {
    page: number;
    limit: number;
    search?: string;
    activo?: boolean;
}

export interface CategoryListResult {
    categorias: Category[];
    paginacion: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}