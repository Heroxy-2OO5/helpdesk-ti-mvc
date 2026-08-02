import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal, } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, } from '@angular/forms';
import { finalize } from 'rxjs';

import type { Category, } from '../../../core/models/api.models';
import { CategoriesService } from '../../../core/services/categories.service';

@Component({
  selector: 'app-categories-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './categories-admin.component.html',
  styleUrls: ['../admin-crud.css'],
})
export class CategoriesAdminComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly formBuilder = inject(FormBuilder);

  readonly categorias = signal<Category[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly formularioAbierto = signal(false);
  readonly categoriaEditandoId = signal<string | null>(null);
  readonly procesandoId = signal<string | null>(null);

  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  readonly mensajeExito = signal('');
  readonly mensajeError = signal('');

  readonly filtrosForm = this.formBuilder.nonNullable.group({
    search: ['', Validators.maxLength(80)],
    activo: [''],
  });

  readonly categoriaForm = this.formBuilder.nonNullable.group({
    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
      ],
    ],
    descripcion: [
      '',
      Validators.maxLength(300),
    ],
  });

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(pagina = 1): void {
    const filtros = this.filtrosForm.getRawValue();
    const search = filtros.search.trim();

    this.cargando.set(true);
    this.mensajeError.set('');

    this.categoriesService.list({
      page: pagina,
      limit: 10,
      search: search || undefined,
      activo: filtros.activo === ''
        ? undefined
        : filtros.activo === 'true',
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.categorias.set(response.categorias);
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
              'No fue posible consultar las categorías.',
            ),
          );
        },
      });
  }

  aplicarFiltros(): void {
    this.cargarCategorias(1);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      search: '',
      activo: '',
    });

    this.cargarCategorias(1);
  }

  abrirCreacion(): void {
    this.categoriaEditandoId.set(null);

    this.categoriaForm.reset({
      nombre: '',
      descripcion: '',
    });

    this.mensajeError.set('');
    this.formularioAbierto.set(true);
  }

  abrirEdicion(categoria: Category): void {
    this.categoriaEditandoId.set(categoria.id);

    this.categoriaForm.reset({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
    });

    this.mensajeError.set('');
    this.formularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    if (this.guardando()) {
      return;
    }

    this.formularioAbierto.set(false);
    this.categoriaEditandoId.set(null);
  }

  guardarCategoria(): void {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      return;
    }

    const value = this.categoriaForm.getRawValue();
    const categoriaId = this.categoriaEditandoId();

    const input = {
      nombre: value.nombre.trim(),
      descripcion: value.descripcion.trim(),
    };

    this.guardando.set(true);
    this.mensajeError.set('');

    if (categoriaId) {
      this.categoriesService.update(categoriaId, input)
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
                'No fue posible actualizar la categoría.',
              ),
            );
          },
        });

      return;
    }

    this.categoriesService.create(input)
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
              'No fue posible crear la categoría.',
            ),
          );
        },
      });
  }

  desactivarCategoria(categoria: Category): void {
    const confirmado = window.confirm(
      `¿Deseas desactivar la categoría "${categoria.nombre}"?`,
    );

    if (!confirmado) {
      return;
    }

    this.procesandoId.set(categoria.id);
    this.mensajeError.set('');

    this.categoriesService.deactivate(categoria.id)
      .pipe(
        finalize(() => this.procesandoId.set(null)),
      )
      .subscribe({
        next: (response) => {
          this.mostrarExito(response.message);
          this.cargarCategorias(this.pagina());
        },
        error: (error: unknown) => {
          this.mensajeError.set(
            this.obtenerMensajeError(
              error,
              'No fue posible desactivar la categoría.',
            ),
          );
        },
      });
  }

  reactivarCategoria(categoria: Category): void {
    this.procesandoId.set(categoria.id);
    this.mensajeError.set('');

    this.categoriesService.update(categoria.id, {
      activo: true,
    })
      .pipe(
        finalize(() => this.procesandoId.set(null)),
      )
      .subscribe({
        next: (response) => {
          this.mostrarExito(response.message);
          this.cargarCategorias(this.pagina());
        },
        error: (error: unknown) => {
          this.mensajeError.set(
            this.obtenerMensajeError(
              error,
              'No fue posible reactivar la categoría.',
            ),
          );
        },
      });
  }

  paginaAnterior(): void {
    if (this.pagina() > 1) {
      this.cargarCategorias(this.pagina() - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.pagina() < this.totalPaginas()) {
      this.cargarCategorias(this.pagina() + 1);
    }
  }

  private finalizarGuardado(mensaje: string): void {
    this.formularioAbierto.set(false);
    this.categoriaEditandoId.set(null);
    this.mostrarExito(mensaje);
    this.cargarCategorias(this.pagina());
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