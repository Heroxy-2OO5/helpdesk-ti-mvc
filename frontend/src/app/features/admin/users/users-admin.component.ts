import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal, } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, } from '@angular/forms';
import { finalize } from 'rxjs';

import type { Role, User, } from '../../../core/models/api.models';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './users-admin.component.html',
  styleUrls: ['../admin-crud.css'],
})
export class UsersAdminComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly formBuilder = inject(FormBuilder);

  readonly usuarios = signal<User[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly formularioAbierto = signal(false);
  readonly usuarioEditandoId = signal<string | null>(null);
  readonly procesandoId = signal<string | null>(null);

  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  readonly mensajeExito = signal('');
  readonly mensajeError = signal('');

  readonly roles: ReadonlyArray<{
    codigo: Role;
    nombre: string;
  }> = [
    {
      codigo: 'ADMINISTRATOR',
      nombre: 'Administrador',
    },
    {
      codigo: 'TECHNICIAN',
      nombre: 'Técnico',
    },
    {
      codigo: 'REQUESTER',
      nombre: 'Solicitante',
    },
  ];

  readonly filtrosForm = this.formBuilder.nonNullable.group({
    search: ['', Validators.maxLength(120)],
    rol: [''],
    activo: [''],
  });

  readonly usuarioForm = this.formBuilder.nonNullable.group({
    nombreCompleto: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
      ],
    ],
    correo: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ],
    ],
    contrasena: [
      '',
      [
        Validators.minLength(8),
        Validators.maxLength(72),
      ],
    ],
    rol: ['REQUESTER' as Role, Validators.required],
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(pagina = 1): void {
    const filtros = this.filtrosForm.getRawValue();
    const search = filtros.search.trim();

    this.cargando.set(true);
    this.mensajeError.set('');

    this.usersService.list({
      page: pagina,
      limit: 10,
      search: search || undefined,
      rol: filtros.rol
        ? filtros.rol as Role
        : undefined,
      activo: filtros.activo === ''
        ? undefined
        : filtros.activo === 'true',
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.usuarios.set(response.usuarios);
          this.pagina.set(response.paginacion.page);
          this.totalPaginas.set(
            Math.max(response.paginacion.totalPages, 1),
          );
          this.totalRegistros.set(response.paginacion.total);
        },
        error: (error: unknown) => {
          this.mensajeError.set(
            this.obtenerMensajeError(
              error,
              'No fue posible consultar los usuarios.',
            ),
          );
        },
      });
  }

  aplicarFiltros(): void {
    this.cargarUsuarios(1);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      search: '',
      rol: '',
      activo: '',
    });

    this.cargarUsuarios(1);
  }

  abrirCreacion(): void {
    this.usuarioEditandoId.set(null);

    this.usuarioForm.controls.contrasena.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(72),
    ]);

    this.usuarioForm.controls.contrasena.updateValueAndValidity();

    this.usuarioForm.reset({
      nombreCompleto: '',
      correo: '',
      contrasena: '',
      rol: 'REQUESTER',
    });

    this.mensajeError.set('');
    this.formularioAbierto.set(true);
  }

  abrirEdicion(usuario: User): void {
    this.usuarioEditandoId.set(usuario.id);

    this.usuarioForm.controls.contrasena.setValidators([
      Validators.minLength(8),
      Validators.maxLength(72),
    ]);

    this.usuarioForm.controls.contrasena.updateValueAndValidity();

    this.usuarioForm.reset({
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      contrasena: '',
      rol: usuario.rol,
    });

    this.mensajeError.set('');
    this.formularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    if (this.guardando()) {
      return;
    }

    this.formularioAbierto.set(false);
    this.usuarioEditandoId.set(null);
  }

  guardarUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const value = this.usuarioForm.getRawValue();
    const usuarioId = this.usuarioEditandoId();

    this.guardando.set(true);
    this.mensajeError.set('');

    if (usuarioId) {
      const input: {
        nombreCompleto: string;
        correo: string;
        rol: Role;
        contrasena?: string;
      } = {
        nombreCompleto: value.nombreCompleto.trim(),
        correo: value.correo.trim(),
        rol: value.rol,
      };

      if (value.contrasena.length > 0) {
        input.contrasena = value.contrasena;
      }

      this.usersService.update(usuarioId, input)
        .pipe(
          finalize(() => this.guardando.set(false)),
        )
        .subscribe({
          next: (response) => {
            this.finalizarGuardado(response.message);
          },
          error: (error: unknown) => {
            this.mensajeError.set(
              this.obtenerMensajeError(
                error,
                'No fue posible actualizar el usuario.',
              ),
            );
          },
        });

      return;
    }

    this.usersService.create({
      nombreCompleto: value.nombreCompleto.trim(),
      correo: value.correo.trim(),
      contrasena: value.contrasena,
      rol: value.rol,
    })
      .pipe(
        finalize(() => this.guardando.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.finalizarGuardado(response.message);
        },
        error: (error: unknown) => {
          this.mensajeError.set(
            this.obtenerMensajeError(
              error,
              'No fue posible crear el usuario.',
            ),
          );
        },
      });
  }

  desactivarUsuario(usuario: User): void {
    const confirmado = window.confirm(
      `¿Deseas desactivar al usuario "${usuario.nombreCompleto}"?`,
    );

    if (!confirmado) {
      return;
    }

    this.procesandoId.set(usuario.id);
    this.mensajeError.set('');

    this.usersService.deactivate(usuario.id)
      .pipe(
        finalize(() => this.procesandoId.set(null)),
      )
      .subscribe({
        next: (response) => {
          this.mostrarExito(response.message);
          this.cargarUsuarios(this.pagina());
        },
        error: (error: unknown) => {
          this.mensajeError.set(
            this.obtenerMensajeError(
              error,
              'No fue posible desactivar el usuario.',
            ),
          );
        },
      });
  }

  reactivarUsuario(usuario: User): void {
    this.procesandoId.set(usuario.id);
    this.mensajeError.set('');

    this.usersService.update(usuario.id, {
      activo: true,
    })
      .pipe(
        finalize(() => this.procesandoId.set(null)),
      )
      .subscribe({
        next: (response) => {
          this.mostrarExito(response.message);
          this.cargarUsuarios(this.pagina());
        },
        error: (error: unknown) => {
          this.mensajeError.set(
            this.obtenerMensajeError(
              error,
              'No fue posible reactivar el usuario.',
            ),
          );
        },
      });
  }

  paginaAnterior(): void {
    if (this.pagina() > 1) {
      this.cargarUsuarios(this.pagina() - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.pagina() < this.totalPaginas()) {
      this.cargarUsuarios(this.pagina() + 1);
    }
  }

  nombreRol(rol: Role): string {
    return this.roles.find(
      (item) => item.codigo === rol,
    )?.nombre ?? rol;
  }

  claseRol(rol: Role): string {
    switch (rol) {
      case 'ADMINISTRATOR':
        return 'role-administrator';
      case 'TECHNICIAN':
        return 'role-technician';
      default:
        return 'role-requester';
    }
  }

  private finalizarGuardado(mensaje: string): void {
    this.formularioAbierto.set(false);
    this.usuarioEditandoId.set(null);
    this.mostrarExito(mensaje);
    this.cargarUsuarios(this.pagina());
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito.set(mensaje);

    window.setTimeout(() => {
      this.mensajeExito.set('');
    }, 3500);
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string,
  ): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.error?.message
        ?? mensajePredeterminado;
    }

    return mensajePredeterminado;
  }
}