import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {afterEach, beforeEach, describe, expect, it, vi, } from 'vitest';

import type {AuthUser, TicketListFilters, TicketListResponse, TicketSummary, TicketsStatusCode,} from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { MetricsService } from '../../core/services/metrics.service';
import { TicketsService } from '../../core/services/tickets.service';
import { HomeComponent } from './home.component';

describe('HomeComponent por rol', () => {
  const currentUser = signal<AuthUser | null>(null);

  const authServiceMock = {
    user: currentUser.asReadonly(),
  };

  const ticketsServiceMock = {
    list: vi.fn(),
  };

  const metricsServiceMock = {
    getDashboard: vi.fn(),
  };

  const ticket: TicketSummary = {
    id: '10',
    codigo: 'HD-2026-000010',
    titulo: 'Problema de acceso institucional',
    prioridadCodigo: 'CRITICAL',
    prioridad: 'Crítica',
    estadoCodigo: 'ASSIGNED',
    estado: 'Asignado',
    categoriaId: '1',
    categoria: 'Accesos',
    solicitanteId: '3',
    solicitante: 'Usuario Solicitante',
    tecnicoId: '2',
    tecnico: 'Técnico de Soporte',
    activo: true,
    creadoEn: '2026-08-02T10:00:00.000Z',
    actualizadoEn: '2026-08-02T10:30:00.000Z',
  };

  const adminMetrics = {
    metricas: {
      resumen: {
        totalTickets: 12,
        pendientes: 3,
        asignados: 2,
        enProceso: 2,
        resueltos: 4,
        cerrados: 1,
        horasPromedioResolucion: 3.5,
      },
      porEstado: [],
      porPrioridad: [
        {
          prioridadCodigo: 'CRITICAL',
          prioridad: 'Crítica',
          nivel: 4,
          cantidad: 2,
        },
      ],
      porCategoria: [],
      porTecnico: [],
    },
  };

  beforeEach(async () => {
    currentUser.set(null);
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: TicketsService,
          useValue: ticketsServiceMock,
        },
        {
          provide: MetricsService,
          useValue: metricsServiceMock,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    currentUser.set(null);
  });

  function createListResponse(
    total: number,
    tickets: TicketSummary[] = [],
  ): TicketListResponse {
    return {
      tickets,
      paginacion: {
        page: 1,
        limit: 5,
        total,
        totalPages: total > 0 ? 1 : 0,
      },
    };
  }

  function configureTicketPanel(
    totals: Record<TicketsStatusCode, number>,
    recentTotal: number,
  ): void {
    ticketsServiceMock.list.mockImplementation(
      (filters: TicketListFilters = {}) => {
        if (!filters.estado) {
          return of(
            createListResponse(recentTotal, [ticket]),
          );
        }

        return of(
          createListResponse(
            totals[filters.estado],
          ),
        );
      },
    );
  }

  function renderComponent(): HTMLElement {
    const fixture =
      TestBed.createComponent(HomeComponent);

    fixture.detectChanges();
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  function normalizedText(
    element: HTMLElement,
  ): string {
    return element.textContent
      ?.replace(/\s+/g, ' ')
      .trim() ?? '';
  }

  it('debe mostrar el panel administrativo completo', () => {
    currentUser.set({
      id: '1',
      nombreCompleto: 'Administrador HelpDesk',
      correo: 'admin@helpdesk.local',
      rol: 'ADMINISTRATOR',
    });

    metricsServiceMock.getDashboard.mockReturnValue(
      of(adminMetrics),
    );

    ticketsServiceMock.list.mockReturnValue(
      of(createListResponse(12, [ticket])),
    );

    const element = renderComponent();
    const content = normalizedText(element);

    expect(content).toContain('Administrador');
    expect(content).toContain(
      'Administrador HelpDesk',
    );
    expect(content).toContain(
      'Tickets recientes del sistema',
    );
    expect(content).toContain('Total de tickets');
    expect(content).toContain('Prioridad crítica');
    expect(content).toContain('Gestionar usuarios');
    expect(content).toContain(
      'Gestionar categorías',
    );
    expect(content).toContain('Consultar métricas');
    expect(content).toContain(
      'Supervisa las prioridades',
    );
    expect(content).toContain(
      'Problema de acceso institucional',
    );

    expect(
      metricsServiceMock.getDashboard,
    ).toHaveBeenCalledTimes(1);

    expect(
      ticketsServiceMock.list,
    ).toHaveBeenCalledWith({
      page: 1,
      limit: 5,
    });
  });

  it('debe mostrar asignaciones y carga del técnico', () => {
    currentUser.set({
      id: '2',
      nombreCompleto: 'Técnico de Soporte',
      correo: 'tecnico@helpdesk.local',
      rol: 'TECHNICIAN',
    });

    configureTicketPanel(
      {
        PENDING: 0,
        ASSIGNED: 3,
        IN_PROGRESS: 2,
        RESOLVED: 4,
        CLOSED: 1,
      },
      10,
    );

    const element = renderComponent();
    const content = normalizedText(element);

    expect(content).toContain('Técnico de soporte');
    expect(content).toContain(
      'Mis asignaciones recientes',
    );
    expect(content).toContain('Mis tickets');
    expect(content).toContain('Asignados');
    expect(content).toContain('En proceso');
    expect(content).toContain('Resueltos');
    expect(content).toContain('Cerrados');
    expect(content).toContain(
      'Mantén los estados actualizados',
    );
    expect(content).toContain('Gestionar tickets');

    expect(content).not.toContain(
      'Gestionar usuarios',
    );
    expect(content).not.toContain(
      'Gestionar categorías',
    );
    expect(content).not.toContain(
      'Consultar métricas',
    );

    expect(
      metricsServiceMock.getDashboard,
    ).not.toHaveBeenCalled();

    expect(
      ticketsServiceMock.list,
    ).toHaveBeenCalledTimes(6);
  });

  it('debe mostrar solicitudes y creación de tickets al solicitante', () => {
    currentUser.set({
      id: '3',
      nombreCompleto: 'Usuario Solicitante',
      correo: 'solicitante@helpdesk.local',
      rol: 'REQUESTER',
    });

    configureTicketPanel(
      {
        PENDING: 2,
        ASSIGNED: 1,
        IN_PROGRESS: 2,
        RESOLVED: 3,
        CLOSED: 1,
      },
      9,
    );

    const element = renderComponent();
    const content = normalizedText(element);

    expect(content).toContain('Solicitante');
    expect(content).toContain(
      'Usuario Solicitante',
    );
    expect(content).toContain(
      'Crear o consultar ticket',
    );
    expect(content).toContain(
      'Mis solicitudes recientes',
    );
    expect(content).toContain('Registrar un ticket');
    expect(content).toContain('Mis tickets');
    expect(content).toContain('Pendientes');
    expect(content).toContain('En atención');
    expect(content).toContain(
      'Describe claramente el problema',
    );

    expect(content).not.toContain(
      'Gestionar usuarios',
    );
    expect(content).not.toContain(
      'Gestionar categorías',
    );
    expect(content).not.toContain(
      'Consultar métricas',
    );

    expect(
      metricsServiceMock.getDashboard,
    ).not.toHaveBeenCalled();

    expect(
      ticketsServiceMock.list,
    ).toHaveBeenCalledTimes(6);
  });

  it('debe mostrar un mensaje controlado si falla la carga', () => {
    currentUser.set({
      id: '3',
      nombreCompleto: 'Usuario Solicitante',
      correo: 'solicitante@helpdesk.local',
      rol: 'REQUESTER',
    });

    ticketsServiceMock.list.mockReturnValue(
      throwError(
        () => new Error('Error controlado'),
      ),
    );

    const element = renderComponent();
    const content = normalizedText(element);

    expect(content).toContain(
      'No se pudo actualizar el panel',
    );
    expect(content).toContain(
      'No pudimos cargar el resumen de tu cuenta.',
    );
    expect(content).toContain('Reintentar');
    expect(content).toContain(
      'No existen tickets para mostrar',
    );
  });

  it('debe manejar la ausencia de usuario autenticado', () => {
    currentUser.set(null);

    const element = renderComponent();
    const content = normalizedText(element);

    expect(content).toContain(
      'No se pudo actualizar el panel',
    );
    expect(content).toContain(
      'No fue posible identificar al usuario de la sesión.',
    );

    expect(
      ticketsServiceMock.list,
    ).not.toHaveBeenCalled();

    expect(
      metricsServiceMock.getDashboard,
    ).not.toHaveBeenCalled();
  });
});