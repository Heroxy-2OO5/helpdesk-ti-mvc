import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import type { Category, PriorityCatalogItem, PriorityCode, TicketDetail, TicketsStatusCode, UpdateTicketInput, } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { TicketsService } from '../../../core/services/tickets.service';
import { getApiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-ticket-detail',
  imports: [
    DatePipe,
    ReactiveFormsModule,
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetailComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly ticketsService = inject(TicketsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly catalogsService = inject(CatalogsService);

  private readonly ticketId =
    this.route.snapshot.paramMap.get('id') ?? '';

  readonly currentUser = this.authService.user;
  readonly ticket = signal<TicketDetail | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly priorities = signal<PriorityCatalogItem[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly isAdministrator = computed(
    () => this.authService.hasRole('ADMINISTRATOR'),
  );

  readonly canEdit = computed(() => {
    const currentTicket = this.ticket();
    const user = this.currentUser();

    if (!currentTicket || !user || !currentTicket.activo) {
      return false;
    }

    if (user.rol === 'ADMINISTRATOR') {
      return true;
    }

    return (
      user.rol === 'REQUESTER' &&
      currentTicket.solicitanteId === user.id &&
      currentTicket.estadoCodigo === 'PENDING'
    );
  });

  readonly updateForm = this.formBuilder.nonNullable.group({
    titulo: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(150),
      ],
    ],
    descripcion: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(4000),
      ],
    ],
    categoriaId: [
      '',
      [Validators.required],
    ],
    prioridadCodigo:
      this.formBuilder.nonNullable.control<
        PriorityCode | ''
      >(
        '',
        [Validators.required],
      ),
  });

  ngOnInit(): void {
    if (!this.ticketId) {
      void this.router.navigateByUrl('/tickets');
      return;
    }

    this.loadPage();
  }

  loadPage(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const categoriesRequest = this.categoriesService.list({
      page: 1,
      limit: 100,
      activo: this.isAdministrator() ? undefined : true,
    });

    forkJoin({
      ticket: this.ticketsService.getById(this.ticketId),
      categories: categoriesRequest,
      priorities: this.catalogsService.listPriorities(),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.categories.set(response.categories.categorias);
          this.priorities.set(response.priorities);
          this.setTicket(response.ticket.ticket);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'No fue posible consultar el ticket',
            ),
          );
        },
      });
  }

  updateTicket(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.canEdit()) {
      this.errorMessage.set(
        'No tienes autorización para modificar este ticket',
      );
      return;
    }

    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const values = this.updateForm.getRawValue();

    const input: UpdateTicketInput = {
      titulo: values.titulo.trim(),
      descripcion: values.descripcion.trim(),
      categoriaId: values.categoriaId,
      prioridadCodigo:
        values.prioridadCodigo as PriorityCode,
    };

    this.saving.set(true);

    this.ticketsService
      .update(this.ticketId, input)
      .pipe(
        finalize(() => {
          this.saving.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.setTicket(response.ticket);
          this.successMessage.set(response.message);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'No fue posible actualizar el ticket',
            ),
          );
        },
      });
  }

  goBack(): void {
    void this.router.navigateByUrl('/tickets');
  }

  priorityClass(code: PriorityCode): string {
    switch (code) {
      case 'LOW':
        return 'badge priority-low';

      case 'MEDIUM':
        return 'badge priority-medium';

      case 'HIGH':
        return 'badge priority-high';

      case 'CRITICAL':
        return 'badge priority-critical';
    }
  }

  statusClass(code: TicketsStatusCode): string {
    switch (code) {
      case 'PENDING':
        return 'badge status-pending';

      case 'ASSIGNED':
        return 'badge status-assigned';

      case 'IN_PROGRESS':
        return 'badge status-progress';

      case 'RESOLVED':
        return 'badge status-resolved';

      case 'CLOSED':
        return 'badge status-closed';
    }
  }

  private setTicket(ticket: TicketDetail): void {
    this.ticket.set(ticket);

    this.updateForm.reset({
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      categoriaId: ticket.categoriaId,
      prioridadCodigo: ticket.prioridadCodigo,
    });
  }
}