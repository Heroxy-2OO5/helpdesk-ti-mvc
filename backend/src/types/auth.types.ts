export const ROLES = [
    'ADMINISTRATOR',
    'TECHNICIAN',
    'REQUESTER',
] as const;

export type Role = (typeof ROLES)[number];

export interface AuthenticatedUser {
    id: string;
    nombreCompleto: string;
    correo: string;
    rol: Role;
}

export interface UserWithPassword extends AuthenticatedUser{
    contrasenaHash: string;
    activo: boolean;
}