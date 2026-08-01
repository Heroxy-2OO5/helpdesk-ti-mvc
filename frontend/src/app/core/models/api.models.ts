export type Role = 'ADMINISTRATOR' | 'TECHNICIAN' | 'REQUESTER';

export type PriorityCode = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketsStatusCode = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
    }
}

export interface HealthResponse {
    api: 'ok' | 'error';
    database: 'ok' | 'error';
    message: string
}

export interface AuthUser {
    id: string;
    nombreCompleto: string;
    correo: string;
    rol: Role;
}

export interface LoginRequest {
    correo: string;
    contrasena: string;
}

export interface LoginResponse {
    token: string;
    expiresIn: string;
    usuario: AuthUser;
}

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

export interface UserListResponse {
    usuarios: User[];
    paginacion: Pagination;
}

export interface CreateUserInput {
    nombreCompleto: string;
    correo: string;
    contrasena: string;
    rol: Role;
}

export interface UpdateUserInput {
    nombreCompleto? : string;
    correo?: string;
    contrasena?: string;
    rol?: Role;
    activo?: boolean;
}

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

export interface CategoryListResponse {
    categorias: Category[];
    paginacion: Pagination;
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

export interface RoleCatalogItem {
    codigo: Role;
    nombre: string;
    descripcion: string | null;
}

export interface PriorityCatalogItem {
    codigo: PriorityCode;
    nombre: string;
    nivel: number;
    color: string | null;
}

export interface TicketStatusCatalogItem {
    codigo: TicketsStatusCode;
    nombre: string;
    ordenFlujo: number;
    esFinal: boolean;
}

export interface TicketSummary {
    id: string;
    codigo: string;
    titulo: string;
    prioridadCodigo: PriorityCode;
    prioridad: string;
    estadoCodigo: TicketsStatusCode;
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
    estadoAnteriorCodigo: TicketsStatusCode | null;
    estadoNuevoCodigo: TicketsStatusCode | null;
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
    actualiazdoPorId: string;
    asignadoEn: string | null;
    iniciadoEn: string | null;
    resueltoEn: string | null;
    cerradoEn: string | null;
    eliminadoEn: string | null;
    eliminadoPorId: string | null;
    motivoEliminacion: string | null;
    historial: TicketHistoryItem[];
}

export interface TicketListResponse {
    tickets: TicketSummary[];
    paginacion: Pagination;
}

export interface CreateTicketInput {
    titulo: string;
    descripcion:string;
    categoriaId: string;
    prioridadCodigo: PriorityCode;
    solicitanteId?: string;
}

export interface UpdateTicketInput {
    titulo?: string;
    descripcion?: string;
    categoriaId?: string;
    prioridadCodigo?: PriorityCode;
}

export interface MetricsSummary {
    totalTickets: number;
    pendientes: number;
    asignados: number;
    enProceso: number;
    resueltos: number;
    cerrados: number;
    horasPromedioResolucion: number | null;
}

export interface MetricsDashboard {
    resumen: MetricsSummary;

    porEstado: Array<{
        estadoCodigo: string;
        estado: string;
        ordenFlujo: number;
        cantidad: number;
    }>;

    porPrioridad: Array<{
        prioridadCodigo: string;
        prioridad: string;
        nivel: number;
        cantidad: number;
    }>;

    porCategoria: Array<{
        categoriaId: string;
        categoria: string;
        cantidad: number;
    }>;

    porTecnico: Array<{
        tecnicoId: string;
        tecnico: string;
        totalAsignados: number;
        cargaActual: number;
        finalizados: number;
    }>;
}

export interface UserListFilters {
    page?: number;
    limit?: number;
    search?: string;
    rol?: Role;
    activo?: boolean;
}

export interface CategoryListFilters {
    page?: number;
    limit?: number;
    search?: string;
    activo?: boolean;
}

export interface TicketListFilters {
    page?: number;
    limit?: number;
    search?: string;
    estado?: TicketsStatusCode;
    prioridad?: PriorityCode;
    categoriaId?: string;
    tecnicoId?: string;
    activo?: boolean;
}

export interface DeleteTicketInput {
    motivo: string;
}

export interface AssignTicketInput {
    tecnicoId: string | null;
}

export interface ChangeTicketStatusInput {
    estadoCodigo: TicketsStatusCode;
    solucion?: string;
}