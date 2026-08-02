import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {provideRouter, Router, } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi, } from 'vitest';

import type { AuthUser, } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent por rol', () => {
  const currentUser = signal<AuthUser | null>(null);

  const authServiceMock = {
    user: currentUser.asReadonly(),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    currentUser.set(null);
    authServiceMock.logout.mockReset();

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compileComponents();
  });

  function renderComponent(): {
    element: HTMLElement;
    button: HTMLButtonElement;
  } {
    const fixture = TestBed.createComponent(
      AppShellComponent,
    );

    fixture.detectChanges();

    return {
      element: fixture.nativeElement as HTMLElement,
      button: fixture.nativeElement.querySelector(
        '.logout-button',
      ) as HTMLButtonElement,
    };
  }

  function normalizedText(
    element: HTMLElement,
  ): string {
    return element.textContent
      ?.replace(/\s+/g, ' ')
      .trim() ?? '';
  }

  it('debe mostrar la navegación administrativa', () => {
    currentUser.set({
      id: '1',
      nombreCompleto: 'Administrador HelpDesk',
      correo: 'admin@helpdesk.local',
      rol: 'ADMINISTRATOR',
    });

    const { element } = renderComponent();
    const content = normalizedText(element);

    expect(content).toContain('Inicio');
    expect(content).toContain('Tickets');
    expect(content).toContain('Usuarios');
    expect(content).toContain('Categorías');
    expect(content).toContain('Métricas');
    expect(content).toContain(
      'Administrador HelpDesk',
    );
    expect(content).toContain(
      'admin@helpdesk.local',
    );
  });

  it('debe ocultar la administración al técnico', () => {
    currentUser.set({
      id: '2',
      nombreCompleto: 'Técnico de Soporte',
      correo: 'tecnico@helpdesk.local',
      rol: 'TECHNICIAN',
    });

    const { element } = renderComponent();
    const content = normalizedText(element);

    expect(content).toContain('Inicio');
    expect(content).toContain('Tickets');
    expect(content).toContain(
      'Técnico de Soporte',
    );

    expect(content).not.toContain('Usuarios');
    expect(content).not.toContain('Categorías');
    expect(content).not.toContain('Métricas');
  });

  it('debe ocultar la administración al solicitante', () => {
    currentUser.set({
      id: '3',
      nombreCompleto: 'Usuario Solicitante',
      correo: 'solicitante@helpdesk.local',
      rol: 'REQUESTER',
    });

    const { element } = renderComponent();
    const content = normalizedText(element);

    expect(content).toContain('Inicio');
    expect(content).toContain('Tickets');
    expect(content).toContain(
      'Usuario Solicitante',
    );

    expect(content).not.toContain('Usuarios');
    expect(content).not.toContain('Categorías');
    expect(content).not.toContain('Métricas');
  });

  it('debe cerrar la sesión y navegar al login', () => {
    currentUser.set({
      id: '1',
      nombreCompleto: 'Administrador HelpDesk',
      correo: 'admin@helpdesk.local',
      rol: 'ADMINISTRATOR',
    });

    authServiceMock.logout.mockReturnValue(
      of({
        message: 'Sesión cerrada correctamente',
      }),
    );

    const router = TestBed.inject(Router);

    const navigateSpy = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);

    const { button } = renderComponent();

    button.click();

    expect(
      authServiceMock.logout,
    ).toHaveBeenCalledTimes(1);

    expect(navigateSpy).toHaveBeenCalledWith(
      '/login',
    );
  });
});