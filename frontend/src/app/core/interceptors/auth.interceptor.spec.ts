import { HttpClient, provideHttpClient, withInterceptors, } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, } from 'vitest';

import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  const authServiceMock = {
    token: vi.fn(),
  };

  beforeEach(() => {
    authServiceMock.token.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([authInterceptor]),
        ),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('debe agregar el token JWT a las solicitudes autenticadas', () => {
    authServiceMock.token.mockReturnValue(
      'jwt-de-prueba',
    );

    http.get('/api/tickets').subscribe();

    const request =
      httpTesting.expectOne('/api/tickets');

    expect(request.request.method).toBe('GET');

    expect(
      request.request.headers.get('Authorization'),
    ).toBe('Bearer jwt-de-prueba');

    request.flush({
      tickets: [],
    });
  });

  it('no debe agregar Authorization cuando no existe token', () => {
    authServiceMock.token.mockReturnValue(null);

    http
      .get('/api/catalogs/states')
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/catalogs/states',
    );

    expect(request.request.method).toBe('GET');

    expect(
      request.request.headers.has('Authorization'),
    ).toBe(false);

    request.flush({
      estados: [],
    });
  });
});