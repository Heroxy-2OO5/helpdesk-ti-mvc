import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { switchMap } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it,} from 'vitest';

import type {
  TicketDetail,
  TicketHistoryItem,
  TicketsStatusCode,
} from '../models/api.models';
import { TicketsService } from './tickets.service';

describe('Flujo completo de tickets', () => {
  let httpTesting: HttpTestingController;
  let ticketsService: TicketsService;

  const fechaCreacion =
    '2026-08-02T12:00:00.000Z';

  function createHistory(
    id: string,
    tipoEventoCodigo: string,
    estadoAnteriorCodigo:
      | TicketsStatusCode
      | null,
    estadoNuevoCodigo:
      | TicketsStatusCode
      | null,
    observacion: string,
  ): TicketHistoryItem {
    return {
      id,
      tipoEventoCodigo,
      estadoAnteriorCodigo,
      estadoNuevoCodigo,
      usuarioResponsableId: '1',
      responsable: 'Administrador HelpDesk',
      observacion,
      detalles: {},
      creadoEn: fechaCreacion,
    };
  }

  const historialCreacion = createHistory(
    'H1',
    'TICKET_CREATED',
    null,
    'PENDING',
    'Ticket creado con estado PENDIENTE.',
  );

  const historialActualizacion = createHistory(
    'H2',
    'TICKET_UPDATED',
    'PENDING',
    'PENDING',
    'Información general del ticket actualizada.',
  );

  const historialAsignacion = createHistory(
    'H3',
    'TECHNICIAN_ASSIGNED',
    'PENDING',
    'ASSIGNED',
    'Técnico asignado al ticket.',
  );

  const historialInicio = createHistory(
    'H4',
    'STATUS_CHANGED',
    'ASSIGNED',
    'IN_PROGRESS',
    'El técnico inició la atención.',
  );

  const historialResolucion = createHistory(
    'H5',
    'TICKET_RESOLVED',
    'IN_PROGRESS',
    'RESOLVED',
    'Se registró la solución del ticket.',
  );

  const historialCierre = createHistory(
    'H6',
    'TICKET_CLOSED',
    'RESOLVED',
    'CLOSED',
    'El ticket fue cerrado.',
  );

  const nombresEstado: Record<
    TicketsStatusCode,
    string
  > = {
    PENDING: 'Pendiente',
    ASSIGNED: 'Asignado',
    IN_PROGRESS: 'En proceso',
    RESOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
  };

  function createTicket(
    estadoCodigo: TicketsStatusCode,
    overrides: Partial<TicketDetail> = {},
  ): TicketDetail {
    const tieneTecnico =
      estadoCodigo !== 'PENDING';

    const fueIniciado = [
      'IN_PROGRESS',
      'RESOLVED',
      'CLOSED',
    ].includes(estadoCodigo);

    const fueResuelto = [
      'RESOLVED',
      'CLOSED',
    ].includes(estadoCodigo);

    return {
      id: '10',
      codigo: 'HD-2026-000010',
      titulo: 'Sin acceso al sistema institucional',
      descripcion:
        'El usuario no puede ingresar al sistema.',
      prioridadCodigo: 'CRITICAL',
      prioridad: 'Crítica',
      estadoCodigo,
      estado: nombresEstado[estadoCodigo],
      categoriaId: '1',
      categoria: 'Accesos',
      solicitanteId: '3',
      solicitante: 'Usuario Solicitante',
      correoSolicitante:
        'solicitante@helpdesk.local',
      tecnicoId: tieneTecnico ? '2' : null,
      tecnico: tieneTecnico
        ? 'Técnico de Soporte'
        : null,
      solucion: fueResuelto
        ? 'Se restableció la contraseña y se verificó el acceso.'
        : null,
      activo: true,
      creadoPorId: '3',

      // La interfaz actual del proyecto utiliza este
      // nombre exacto, aunque contiene una errata.
      actualiazdoPorId: '1',

      creadoEn: fechaCreacion,
      actualizadoEn:
        '2026-08-02T13:00:00.000Z',
      asignadoEn: tieneTecnico
        ? '2026-08-02T12:20:00.000Z'
        : null,
      iniciadoEn: fueIniciado
        ? '2026-08-02T12:30:00.000Z'
        : null,
      resueltoEn: fueResuelto
        ? '2026-08-02T13:00:00.000Z'
        : null,
      cerradoEn:
        estadoCodigo === 'CLOSED'
          ? '2026-08-02T13:15:00.000Z'
          : null,
      eliminadoEn: null,
      eliminadoPorId: null,
      motivoEliminacion: null,
      historial: [historialCreacion],
      ...overrides,
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpTesting = TestBed.inject(
      HttpTestingController,
    );

    ticketsService = TestBed.inject(
      TicketsService,
    );
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('debe completar el ciclo de vida de un ticket', () => {
    const createInput = {
      titulo: 'Sin acceso al sistema',
      descripcion:
        'El usuario no puede ingresar al sistema.',
      categoriaId: '1',
      prioridadCodigo: 'HIGH' as const,
    };

    const updateInput = {
      titulo:
        'Sin acceso al sistema institucional',
      prioridadCodigo: 'CRITICAL' as const,
    };

    const pendingTicket = createTicket(
      'PENDING',
      {
        titulo: createInput.titulo,
        prioridadCodigo: 'HIGH',
        prioridad: 'Alta',
        actualiazdoPorId: '3',
        actualizadoEn: fechaCreacion,
      },
    );

    const updatedTicket = createTicket(
      'PENDING',
      {
        historial: [
          historialCreacion,
          historialActualizacion,
        ],
      },
    );

    const assignedTicket = createTicket(
      'ASSIGNED',
      {
        historial: [
          historialCreacion,
          historialActualizacion,
          historialAsignacion,
        ],
      },
    );

    const inProgressTicket = createTicket(
      'IN_PROGRESS',
      {
        historial: [
          historialCreacion,
          historialActualizacion,
          historialAsignacion,
          historialInicio,
        ],
      },
    );

    const resolvedTicket = createTicket(
      'RESOLVED',
      {
        historial: [
          historialCreacion,
          historialActualizacion,
          historialAsignacion,
          historialInicio,
          historialResolucion,
        ],
      },
    );

    const closedTicket = createTicket(
      'CLOSED',
      {
        historial: [
          historialCreacion,
          historialActualizacion,
          historialAsignacion,
          historialInicio,
          historialResolucion,
          historialCierre,
        ],
      },
    );

    const deletedTicket = createTicket(
      'CLOSED',
      {
        activo: false,
        eliminadoEn:
          '2026-08-02T13:30:00.000Z',
        eliminadoPorId: '1',
        motivoEliminacion:
          'Cierre del ciclo automatizado de prueba.',
        historial: closedTicket.historial,
      },
    );

    let flowCompleted = false;

    ticketsService
      .create(createInput)
      .pipe(
        switchMap((response) => {
          expect(response.ticket.codigo).toBe(
            'HD-2026-000010',
          );

          expect(
            response.ticket.estadoCodigo,
          ).toBe('PENDING');

          return ticketsService.getById(
            response.ticket.id,
          );
        }),

        switchMap((response) => {
          expect(response.ticket.id).toBe('10');
          expect(response.ticket.historial).toHaveLength(
            1,
          );

          return ticketsService.update(
            response.ticket.id,
            updateInput,
          );
        }),

        switchMap((response) => {
          expect(response.ticket.titulo).toBe(
            updateInput.titulo,
          );

          expect(
            response.ticket.prioridadCodigo,
          ).toBe('CRITICAL');

          return ticketsService.assign(
            response.ticket.id,
            {
              tecnicoId: '2',
            },
          );
        }),

        switchMap((response) => {
          expect(
            response.ticket.estadoCodigo,
          ).toBe('ASSIGNED');

          expect(response.ticket.tecnicoId).toBe('2');

          return ticketsService.changeStatus(
            response.ticket.id,
            {
              estadoCodigo: 'IN_PROGRESS',
            },
          );
        }),

        switchMap((response) => {
          expect(
            response.ticket.estadoCodigo,
          ).toBe('IN_PROGRESS');

          return ticketsService.changeStatus(
            response.ticket.id,
            {
              estadoCodigo: 'RESOLVED',
              solucion:
                'Se restableció la contraseña y se verificó el acceso.',
            },
          );
        }),

        switchMap((response) => {
          expect(
            response.ticket.estadoCodigo,
          ).toBe('RESOLVED');

          expect(response.ticket.solucion).toContain(
            'restableció la contraseña',
          );

          return ticketsService.changeStatus(
            response.ticket.id,
            {
              estadoCodigo: 'CLOSED',
            },
          );
        }),

        switchMap((response) => {
          expect(
            response.ticket.estadoCodigo,
          ).toBe('CLOSED');

          return ticketsService.getById(
            response.ticket.id,
          );
        }),

        switchMap((response) => {
          expect(response.ticket.historial).toHaveLength(
            6,
          );

          expect(
            response.ticket.historial.at(-1)
              ?.estadoNuevoCodigo,
          ).toBe('CLOSED');

          return ticketsService.deactivate(
            response.ticket.id,
            {
              motivo:
                'Cierre del ciclo automatizado de prueba.',
            },
          );
        }),
      )
      .subscribe({
        next: (response) => {
          expect(response.ticket.activo).toBe(false);

          expect(
            response.ticket.motivoEliminacion,
          ).toBe(
            'Cierre del ciclo automatizado de prueba.',
          );
        },
        error: (error: unknown) => {
          throw error;
        },
        complete: () => {
          flowCompleted = true;
        },
      });

    const createRequest =
      httpTesting.expectOne('/api/tickets');

    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(
      createInput,
    );

    createRequest.flush({
      message: 'Ticket creado correctamente.',
      ticket: pendingTicket,
    });

    const detailRequest = httpTesting.expectOne(
      '/api/tickets/10',
    );

    expect(detailRequest.request.method).toBe('GET');

    detailRequest.flush({
      ticket: pendingTicket,
    });

    const updateRequest = httpTesting.expectOne(
      '/api/tickets/10',
    );

    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual(
      updateInput,
    );

    updateRequest.flush({
      message: 'Ticket actualizado correctamente.',
      ticket: updatedTicket,
    });

    const assignmentRequest = httpTesting.expectOne(
      '/api/tickets/10/assignment',
    );

    expect(
      assignmentRequest.request.method,
    ).toBe('PATCH');

    expect(
      assignmentRequest.request.body,
    ).toEqual({
      tecnicoId: '2',
    });

    assignmentRequest.flush({
      message: 'Técnico asignado correctamente.',
      ticket: assignedTicket,
    });

    const startRequest = httpTesting.expectOne(
      '/api/tickets/10/status',
    );

    expect(startRequest.request.method).toBe('PATCH');

    expect(startRequest.request.body).toEqual({
      estadoCodigo: 'IN_PROGRESS',
    });

    startRequest.flush({
      message: 'Estado actualizado correctamente.',
      ticket: inProgressTicket,
    });

    const resolveRequest = httpTesting.expectOne(
      '/api/tickets/10/status',
    );

    expect(resolveRequest.request.method).toBe('PATCH');

    expect(resolveRequest.request.body).toEqual({
      estadoCodigo: 'RESOLVED',
      solucion:
        'Se restableció la contraseña y se verificó el acceso.',
    });

    resolveRequest.flush({
      message: 'Ticket resuelto correctamente.',
      ticket: resolvedTicket,
    });

    const closeRequest = httpTesting.expectOne(
      '/api/tickets/10/status',
    );

    expect(closeRequest.request.method).toBe('PATCH');

    expect(closeRequest.request.body).toEqual({
      estadoCodigo: 'CLOSED',
    });

    closeRequest.flush({
      message: 'Ticket cerrado correctamente.',
      ticket: closedTicket,
    });

    const finalDetailRequest =
      httpTesting.expectOne('/api/tickets/10');

    expect(
      finalDetailRequest.request.method,
    ).toBe('GET');

    finalDetailRequest.flush({
      ticket: closedTicket,
    });

    const deleteRequest = httpTesting.expectOne(
      '/api/tickets/10',
    );

    expect(deleteRequest.request.method).toBe('DELETE');

    expect(deleteRequest.request.body).toEqual({
      motivo:
        'Cierre del ciclo automatizado de prueba.',
    });

    deleteRequest.flush({
      message: 'Ticket eliminado correctamente.',
      ticket: deletedTicket,
    });

    expect(flowCompleted).toBe(true);
  });
});