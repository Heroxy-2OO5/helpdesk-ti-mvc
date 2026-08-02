import { provideHttpClient } from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting, } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, } from 'vitest';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  const usuario = {
    id: '1',
    nombreCompleto: 'Administrador HelpDesk',
    correo: 'admin@helpdesk.local',
    rol: 'ADMINISTRATOR' as const,
  };

  const loginResponse = {
    token: 'jwt-de-prueba',
    expiresIn: '8h',
    usuario,
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('debe iniciar sesión y almacenar el token y el usuario', () => {
    service
      .login({
        correo: 'admin@helpdesk.local',
        contrasena: 'Admin123*',
      })
      .subscribe((response) => {
        expect(response).toEqual(loginResponse);
      });

    const request = httpTesting.expectOne('/api/auth/login');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      correo: 'admin@helpdesk.local',
      contrasena: 'Admin123*',
    });

    request.flush(loginResponse);

    expect( localStorage.getItem('helpdesk_ti_token'),).toBe('jwt-de-prueba');

    expect(service.user()).toEqual(usuario);

    expect(localStorage.getItem('helpdesk_ti_token')).toBe(
      'jwt-de-prueba',
    );

    expect(
      JSON.parse(
        localStorage.getItem('helpdesk_ti_user') ?? 'null',
      ),
    ).toEqual(usuario);
  });

  it('debe recuperar la sesión almacenada al crear el servicio', () => {
    service.clearSession();

    localStorage.setItem(
      'helpdesk_ti_token',
      'jwt-almacenado',
    );

    localStorage.setItem(
      'helpdesk_ti_user',
      JSON.stringify(usuario),
    );

    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);

    expect( localStorage.getItem('helpdesk_ti_token'), ).toBe('jwt-almacenado');

    expect(service.user()).toEqual(usuario);
  });

  it('debe eliminar completamente la sesión local', () => {
    localStorage.setItem(
      'helpdesk_ti_token',
      'jwt-de-prueba',
    );

    localStorage.setItem(
      'helpdesk_ti_user',
      JSON.stringify(usuario),
    );

    service.clearSession();

    expect(service.user()).toBeNull();
    expect(
      localStorage.getItem('helpdesk_ti_token'),
    ).toBeNull();
    expect(
      localStorage.getItem('helpdesk_ti_user'),
    ).toBeNull();
  });
});