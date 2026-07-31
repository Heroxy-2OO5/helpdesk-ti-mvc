import { int } from "zod";
import type { Role} from "./auth.types.js";

export interface User {
    id: string;
    nombreCompleto: string;
    correo: string;
    rol: Role;
    activo: boolean;
    ultimoAccesoEn: string | null;
    creadoEn: string;
    actualizadoEn: string;
    desactivadoEn: string | null;
    desactivadoPorId: string | null;
}

export interface createUserInput {
    nombreCompleto: string;
    correo: string;
    contrasena: string;
    rol: Role;
}

export interface updateUserInput {
    nombreCompleto?: string;
    correo?: string;
    contrasena?: string;
    rol?: Role;
    activo?: boolean;
}

export interface CreateUserData {
    nombreCompleto: string;
    correo: string;
    contrasenaHash: string;
    rol: Role;
}

export interface UpdateUserData {
    nombreCompleto?: string;
    correo?: string;
    contrasenaHash?: string;
    rol?: Role;
    activo?: boolean;
    desactivadoPorId?: string;
}

export interface UserFilters {
    page: number;
    limit: number;
    search?: string;
    rol?: Role;
    activo?: boolean;
}

export interface UserListResult {
    usuarios: User[];
    paginacion: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}