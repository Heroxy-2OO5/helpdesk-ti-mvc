import type { Role } from './auth.types.js';

export const PRIORITY_CODES = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
] as const;

export type PriorityCode = (typeof PRIORITY_CODES)[number];

export const TICKET_STATUS_CODES = [
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
] as const;

export type TicketStatusCode = (typeof TICKET_STATUS_CODES)[number];

export interface TicketSummary {
    id: string;
    codigo: string;
    titulo: string;
    prioridadCodigo: PriorityCode;
    prioridad: string;
    estadoCodigo: TicketStatusCode;
    estado: string;
    categoriaId: string;
    categoria: string;
    solicitanteId: string;
    solicitante: string;
    tecnicoId: string | null;
    tecnico: string | null;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface TicketHistoryItem {
    id: string;
    tipoEventoCodigo: string;
    estadoAnteriorCodigo: TicketStatusCode | null;
    estadoNuevoCodigo: TicketStatusCode | null;
    usuarioResponsableId: string;
    responsable: string;
    observacion: string;
    detalles: Record<string, unknown>;
    creadoEn: string;
}

export interface TicketDetail extends TicketSummary {
    descripcion: string;
    correoSolicitante: string;
    solucion: string | null;
    creadoPorId: string;
    actualizadoPorId: string;
    asignadoEn: string | null;
    iniciadoEn: string | null;
    resueltoEn: string | null;
    cerradoEn: string | null;
    eliminadoEn: string | null;
    eliminadoPorId: string | null;
    motivoEliminacion: string | null;
    historial: TicketHistoryItem[];
}

export type TicketDetailWithoutHistory = Omit<TicketDetail, 'historial'>;

export interface CreateTicketInput {
    titulo: string;
    descripcion: string;
    categoriaId: string;
    prioridadCodigo: PriorityCode;
    solicitanteId?: string;
}

export interface CreateTicketData {
    titulo: string;
    descripcion: string;
    categoriaId: string;
    prioridadCodigo: PriorityCode;
    solicitanteId: string;
    creadoPorId: string;
}

export interface UpdateTicketInput {
    titulo?: string;
    descripcion?: string;
    categoriaId?: string;
    prioridadCodigo?: PriorityCode;
}

export interface UpdateTicketData extends UpdateTicketInput {
    actualizadoPorId: string;
}

export interface DeleteTicketInput {
    motivo: string;
}

export interface AssignTicketInput {
    tecnicoId: string | null;
}

export interface ChangeTicketStatusInput {
    estadoCodigo: TicketStatusCode;
    solucion?: string;
}

export interface TicketFilters {
    page: number;
    limit: number;
    search?: string;
    estado?: TicketStatusCode;
    prioridad?: PriorityCode;
    categoriaId?: string;
    tecnicoId?: string;
    activo?: boolean;
}

export interface ScopedTicketFilters extends TicketFilters {
    usuarioId: string;
    rol: Role;
}

export interface TicketListResult {
    tickets: TicketSummary[];
    paginacion: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
