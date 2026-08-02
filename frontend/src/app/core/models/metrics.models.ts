export interface MetricsSummary {
  totalTickets: number;
  pendientes: number;
  asignados: number;
  enProceso: number;
  resueltos: number;
  cerrados: number;
  horasPromedioResolucion: number | null;
}

export interface TicketsByStatusMetric {
  estadoCodigo: string;
  estado: string;
  ordenFlujo: number;
  cantidad: number;
}

export interface TicketsByPriorityMetric {
  prioridadCodigo: string;
  prioridad: string;
  nivel: number;
  cantidad: number;
}

export interface TicketsByCategoryMetric {
  categoriaId: string;
  categoria: string;
  cantidad: number;
}

export interface TicketsByTechnicianMetric {
  tecnicoId: string;
  tecnico: string;
  totalAsignados: number;
  cargaActual: number;
  finalizados: number;
}

export interface MetricsDashboard {
  resumen: MetricsSummary;
  porEstado: TicketsByStatusMetric[];
  porPrioridad: TicketsByPriorityMetric[];
  porCategoria: TicketsByCategoryMetric[];
  porTecnico: TicketsByTechnicianMetric[];
}

export interface MetricsResponse {
  metricas: MetricsDashboard;
}