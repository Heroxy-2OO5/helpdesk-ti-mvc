import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree, } from '@angular/router';
import { beforeEach, describe, expect, it, vi, } from 'vitest';

import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let router: Router;

  const authServiceMock = {
    user: vi.fn(),
    hasRole: vi.fn(),
  };

  const state =
    {} as RouterStateSnapshot;

  const administrador = {
    id: '1',
    nombreCompleto: 'Administrador HelpDesk',
    correo: 'admin@helpdesk.local',
    rol: 'ADMINISTRATOR' as const,
  };

  const solicitante = {
    id: '3',
    nombreCompleto: 'Usuario Solicitante',
    correo: 'solicitante@helpdesk.local',
    rol: 'REQUESTER' as const,
  };

  function createRoute(
    roles?: string[],
  ): ActivatedRouteSnapshot {
    return {
      data: roles ? { roles } : {},
    } as unknown as ActivatedRouteSnapshot;
  }

  beforeEach(() => {
    authServiceMock.user.mockReset();
    authServiceMock.hasRole.mockReset();

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

  it('debe redirigir al login si no existe usuario autenticado', () => {
    authServiceMock.user.mockReturnValue(null);
    authServiceMock.hasRole.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(
        createRoute(['ADMINISTRATOR']),
        state,
      ),
    );

    expect(
      router.serializeUrl(result as UrlTree),
    ).toBe('/login');
  });

  it('debe permitir una ruta que no define roles', () => {
    authServiceMock.user.mockReturnValue(administrador);
    authServiceMock.hasRole.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(createRoute(), state),
    );

    expect(result).toBe(true);
  });

  it('debe permitir al administrador acceder a una ruta administrativa', () => {
    authServiceMock.user.mockReturnValue(administrador);
    authServiceMock.hasRole.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(
        createRoute(['ADMINISTRATOR']),
        state,
      ),
    );

    expect(result).toBe(true);
  });

  it('debe rechazar a un solicitante en una ruta administrativa', () => {
    authServiceMock.user.mockReturnValue(solicitante);
    authServiceMock.hasRole.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(
        createRoute(['ADMINISTRATOR']),
        state,
      ),
    );

    expect(
      router.serializeUrl(result as UrlTree),
    ).toBe('/inicio');
  });
});