import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { CategoriesService } from './categories.service';
import { MetricsService } from './metrics.service';
import { TicketsService } from './tickets.service';
import { UsersService } from './users.service';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

describe('Servicios de integración con la API REST', () => {
  let httpTesting: HttpTestingController;
  let usersService: UsersService;
  let categoriesService: CategoriesService;
  let ticketsService: TicketsService;
  let metricsService: MetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    usersService = TestBed.inject(UsersService);
    categoriesService = TestBed.inject(CategoriesService);
    ticketsService = TestBed.inject(TicketsService);
    metricsService = TestBed.inject(MetricsService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('debe enviar correctamente los filtros de usuarios', () => {
    usersService.list({
      page: 1,
      limit: 10,
      rol: 'TECHNICIAN',
      activo: true,
    }).subscribe((response) => {
      expect(response.usuarios).toHaveLength(1);
      expect(response.paginacion.total).toBe(1);
      expect(response.usuarios[0]?.rol).toBe('TECHNICIAN');
    });

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === '/api/users'
        && candidate.params.get('page') === '1'
        && candidate.params.get('limit') === '10'
        && candidate.params.get('rol') === 'TECHNICIAN'
        && candidate.params.get('activo') === 'true',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      usuarios: [
        {
          id: '2',
          nombreCompleto: 'Técnico de Prueba',
          correo: 'tecnico.prueba@helpdesk.local',
          rol: 'TECHNICIAN',
          activo: true,
          ultimoAccesoEn: null,
          creadoEn: '2026-08-01T10:00:00.000Z',
          actualizadoEn: '2026-08-01T10:00:00.000Z',
          desactivadoEn: null,
          desactivadoPorId: null,
        },
      ],
      paginacion: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('debe enviar correctamente los filtros de categorías', () => {
    categoriesService.list({
      page: 1,
      limit: 20,
      search: 'Redes',
      activo: true,
    }).subscribe((response) => {
      expect(response.categorias).toHaveLength(1);
      expect(response.categorias[0]?.nombre).toBe('Redes');
    });

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === '/api/categories'
        && candidate.params.get('page') === '1'
        && candidate.params.get('limit') === '20'
        && candidate.params.get('search') === 'Redes'
        && candidate.params.get('activo') === 'true',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      categorias: [
        {
          id: '1',
          nombre: 'Redes',
          descripcion: 'Problemas de conectividad',
          activo: true,
          creadoEn: '2026-08-01T10:00:00.000Z',
          actualizadoEn: '2026-08-01T10:00:00.000Z',
          desactivadoEn: null,
          desactivadoPorId: null,
        },
      ],
      paginacion: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('debe consultar tickets con filtros y paginación', () => {
    ticketsService.list({
      page: 1,
      limit: 5,
      estado: 'PENDING',
      prioridad: 'HIGH',
    }).subscribe((response) => {
      expect(response.tickets).toHaveLength(1);
      expect(response.tickets[0]?.estadoCodigo).toBe('PENDING');
      expect(response.tickets[0]?.prioridadCodigo).toBe('HIGH');
    });

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === '/api/tickets'
        && candidate.params.get('page') === '1'
        && candidate.params.get('limit') === '5'
        && candidate.params.get('estado') === 'PENDING'
        && candidate.params.get('prioridad') === 'HIGH',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      tickets: [
        {
          id: '10',
          codigo: 'HD-2026-000010',
          titulo: 'Problema de conexión',
          prioridadCodigo: 'HIGH',
          prioridad: 'Alta',
          estadoCodigo: 'PENDING',
          estado: 'Pendiente',
          categoriaId: '1',
          categoria: 'Redes',
          solicitanteId: '3',
          solicitante: 'Solicitante de Prueba',
          tecnicoId: null,
          tecnico: null,
          activo: true,
          creadoEn: '2026-08-01T10:00:00.000Z',
          actualizadoEn: '2026-08-01T10:00:00.000Z',
        },
      ],
      paginacion: {
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('debe consultar el panel administrativo de métricas', () => {
    metricsService.getDashboard().subscribe((response) => {
      expect(response.metricas.resumen.totalTickets).toBe(4);
      expect(response.metricas.porEstado).toHaveLength(1);
      expect(response.metricas.porTecnico).toHaveLength(1);
    });

    const request = httpTesting.expectOne('/api/metrics');

    expect(request.request.method).toBe('GET');

    request.flush({
      metricas: {
        resumen: {
          totalTickets: 4,
          pendientes: 1,
          asignados: 1,
          enProceso: 1,
          resueltos: 1,
          cerrados: 0,
          horasPromedioResolucion: 2.5,
        },
        porEstado: [
          {
            estadoCodigo: 'PENDING',
            estado: 'Pendiente',
            ordenFlujo: 1,
            cantidad: 1,
          },
        ],
        porPrioridad: [
          {
            prioridadCodigo: 'HIGH',
            prioridad: 'Alta',
            nivel: 3,
            cantidad: 1,
          },
        ],
        porCategoria: [
          {
            categoriaId: '1',
            categoria: 'Redes',
            cantidad: 1,
          },
        ],
        porTecnico: [
          {
            tecnicoId: '2',
            tecnico: 'Técnico de Prueba',
            totalAsignados: 3,
            cargaActual: 2,
            finalizados: 1,
          },
        ],
      },
    });
  });
});