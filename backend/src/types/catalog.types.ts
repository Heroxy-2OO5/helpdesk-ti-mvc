import type { Role } from './auth.types.js';

export interface RoleCatalogItem {
    codigo: Role;
    nombre: string;
    descripcion: string | null;
}

export interface PriorityCatalogItem {
    codigo: string;
    nombre: string;
    nivel: number;
    color: string | null;
}

export interface TicketStatusCatalogItem {
    codigo: string;
    nombre: string;
    ordenFlujo: number;
    esFinal: boolean;
}