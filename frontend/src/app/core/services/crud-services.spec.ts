import {HttpErrorResponse, provideHttpClient, } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it,} from 'vitest';

import { CategoriesService } from './categories.service';
import { TicketsService } from './tickets.service';
import { UsersService } from './users.service';

describe('Servicios CRUD, filtros y errores HTTP', () => {
  let httpTesting: HttpTestingController;
  let usersService: UsersService;
  let categoriesService: CategoriesService;
  let ticketsService: TicketsService;

  const usuario = {
    id: '2',
    nombreCompleto: 'Técnico de Prueba',
    correo: 'tecnico.prueba@helpdesk.local',
    rol: 'TECHNICIAN' as const,
    activo: true,
    ultimoAccesoEn: null,
    creadoEn: '2026-08-02T10:00:00.000Z',
    actualizadoEn: '2026-08-02T10:00:00.000Z',
    desactivadoEn: null,
    desactivadoPorId: null,
  };

  const categoria = {
    id: '1',
    nombre: 'Redes',
    descripcion: 'Problemas de conectividad',
    activo: true,
    creadoEn: '2026-08-02T10:00:00.000Z',
    actualizadoEn: '2026-08-02T10:00:00.000Z',
    desactivadoEn: null,
    desactivadoPorId: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    usersService = TestBed.inject(UsersService);
    categoriesService = TestBed.inject(
      CategoriesService,
    );
    ticketsService = TestBed.inject(TicketsService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  function expectBackendError(
    request$: Observable<unknown>,
    expectedUrl: string,
    expectedMethod: string,
    status: number,
    statusText: string,
    errorCode: string,
  ): void {
    let receivedError: HttpErrorResponse | undefined;

    request$.subscribe({
      next: () => {
        expect.fail(
          `La solicitud debía responder con HTTP ${status}`,
        );
      },
      error: (error: HttpErrorResponse) => {
        receivedError = error;
      },
    });

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === expectedUrl,
    );

    expect(request.request.method).toBe(expectedMethod);

    request.flush(
      {
        error: {
          code: errorCode,
          message: 'Error controlado de prueba',
        },
      },
      {
        status,
        statusText,
      },
    );

    expect(receivedError).toBeDefined();
    expect(receivedError?.status).toBe(status);
    expect(receivedError?.error.error.code).toBe(
      errorCode,
    );
  }

  it('debe consultar un usuario por su identificador', () => {
    usersService
      .getById('usuario/2')
      .subscribe((response) => {
        expect(response.usuario.id).toBe('2');
        expect(response.usuario.rol).toBe('TECHNICIAN');
      });

    const request = httpTesting.expectOne(
      '/api/users/usuario%2F2',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      usuario,
    });
  });

  it('debe crear un usuario mediante POST', () => {
    const input = {
      nombreCompleto: 'Técnico de Prueba',
      correo: 'tecnico.prueba@helpdesk.local',
      contrasena: 'Tecnico123*',
      rol: 'TECHNICIAN' as const,
    };

    usersService.create(input).subscribe((response) => {
      expect(response.message).toBe(
        'Usuario creado correctamente.',
      );
      expect(response.usuario).toEqual(usuario);
    });

    const request =
      httpTesting.expectOne('/api/users');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);

    request.flush({
      message: 'Usuario creado correctamente.',
      usuario,
    });
  });

  it('debe actualizar un usuario mediante PATCH', () => {
    const input = {
      nombreCompleto: 'Técnico Actualizado',
      rol: 'TECHNICIAN' as const,
      activo: true,
    };

    usersService
      .update('2', input)
      .subscribe((response) => {
        expect(response.usuario.nombreCompleto).toBe(
          'Técnico Actualizado',
        );
      });

    const request =
      httpTesting.expectOne('/api/users/2');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(input);

    request.flush({
      message: 'Usuario actualizado correctamente.',
      usuario: {
        ...usuario,
        nombreCompleto: 'Técnico Actualizado',
      },
    });
  });

  it('debe desactivar un usuario mediante DELETE', () => {
    usersService
      .deactivate('2')
      .subscribe((response) => {
        expect(response.usuario.activo).toBe(false);
      });

    const request =
      httpTesting.expectOne('/api/users/2');

    expect(request.request.method).toBe('DELETE');

    request.flush({
      message: 'Usuario desactivado correctamente.',
      usuario: {
        ...usuario,
        activo: false,
        desactivadoEn:
          '2026-08-02T11:00:00.000Z',
        desactivadoPorId: '1',
      },
    });
  });

  it('debe crear una categoría mediante POST', () => {
    const input = {
      nombre: 'Redes',
      descripcion: 'Problemas de conectividad',
    };

    categoriesService
      .create(input)
      .subscribe((response) => {
        expect(response.categoria.nombre).toBe('Redes');
        expect(response.categoria.activo).toBe(true);
      });

    const request = httpTesting.expectOne(
      '/api/categories',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);

    request.flush({
      message: 'Categoría creada correctamente.',
      categoria,
    });
  });

  it('debe actualizar una categoría mediante PATCH', () => {
    const input = {
      nombre: 'Redes y conectividad',
      descripcion:
        'Incidencias de red y acceso a internet',
    };

    categoriesService
      .update('1', input)
      .subscribe((response) => {
        expect(response.categoria.nombre).toBe(
          'Redes y conectividad',
        );
      });

    const request = httpTesting.expectOne(
      '/api/categories/1',
    );

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(input);

    request.flush({
      message: 'Categoría actualizada correctamente.',
      categoria: {
        ...categoria,
        nombre: 'Redes y conectividad',
        descripcion:
          'Incidencias de red y acceso a internet',
      },
    });
  });

  it('debe desactivar una categoría mediante DELETE', () => {
    categoriesService
      .deactivate('1')
      .subscribe((response) => {
        expect(response.categoria.activo).toBe(false);
      });

    const request = httpTesting.expectOne(
      '/api/categories/1',
    );

    expect(request.request.method).toBe('DELETE');

    request.flush({
      message: 'Categoría desactivada correctamente.',
      categoria: {
        ...categoria,
        activo: false,
        desactivadoEn:
          '2026-08-02T11:30:00.000Z',
        desactivadoPorId: '1',
      },
    });
  });

  it('debe combinar todos los filtros disponibles de tickets', () => {
    ticketsService
      .list({
        page: 2,
        limit: 25,
        search: 'conexión',
        estado: 'ASSIGNED',
        prioridad: 'CRITICAL',
        categoriaId: 'categoria/1',
        tecnicoId: 'tecnico/2',
        activo: true,
      })
      .subscribe((response) => {
        expect(response.tickets).toEqual([]);
        expect(response.paginacion.page).toBe(2);
      });

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === '/api/tickets'
        && candidate.params.get('page') === '2'
        && candidate.params.get('limit') === '25'
        && candidate.params.get('search')
          === 'conexión'
        && candidate.params.get('estado')
          === 'ASSIGNED'
        && candidate.params.get('prioridad')
          === 'CRITICAL'
        && candidate.params.get('categoriaId')
          === 'categoria/1'
        && candidate.params.get('tecnicoId')
          === 'tecnico/2'
        && candidate.params.get('activo')
          === 'true',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      tickets: [],
      paginacion: {
        page: 2,
        limit: 25,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it('debe propagar un error HTTP 400 de validación', () => {
    expectBackendError(
      usersService.create({
        nombreCompleto: '',
        correo: 'correo-invalido',
        contrasena: '123',
        rol: 'REQUESTER',
      }),
      '/api/users',
      'POST',
      400,
      'Bad Request',
      'VALIDATION_ERROR',
    );
  });

  it('debe propagar un error HTTP 401 de autenticación', () => {
    expectBackendError(
      usersService.list(),
      '/api/users',
      'GET',
      401,
      'Unauthorized',
      'UNAUTHORIZED',
    );
  });

  it('debe propagar un error HTTP 403 de autorización', () => {
    expectBackendError(
      categoriesService.deactivate('1'),
      '/api/categories/1',
      'DELETE',
      403,
      'Forbidden',
      'FORBIDDEN',
    );
  });

  it('debe propagar un error HTTP 404 de recurso inexistente', () => {
    expectBackendError(
      ticketsService.getById('999'),
      '/api/tickets/999',
      'GET',
      404,
      'Not Found',
      'TICKET_NOT_FOUND',
    );
  });

  it('debe propagar un error HTTP 500 del servidor', () => {
    expectBackendError(
      ticketsService.list(),
      '/api/tickets',
      'GET',
      500,
      'Internal Server Error',
      'INTERNAL_SERVER_ERROR',
    );
  });
});