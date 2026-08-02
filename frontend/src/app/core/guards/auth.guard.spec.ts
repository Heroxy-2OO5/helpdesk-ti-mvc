import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree, } from '@angular/router';
import { beforeEach, describe, expect, it, vi, } from 'vitest';

import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let router: Router;

  const authServiceMock = {
    isAuthenticated: vi.fn(),
    getToken: vi.fn(),
  };

  const route =
    {} as ActivatedRouteSnapshot;

  const state =
    {} as RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock.isAuthenticated.mockReset();
    authServiceMock.getToken.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('debe permitir el acceso a un usuario autenticado', () => {
    authServiceMock.isAuthenticated.mockReturnValue(true);
    authServiceMock.getToken.mockReturnValue(
      'jwt-de-prueba',
    );

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state),
    );

    expect(result).toBe(true);
  });

  it('debe redirigir al login cuando no existe sesión', () => {
    authServiceMock.isAuthenticated.mockReturnValue(false);
    authServiceMock.getToken.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state),
    );

    expect(
      router.serializeUrl(result as UrlTree),
    ).toBe('/login');
  });
});