import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';

import type { Category, CreateTicketInput, Pagination, PriorityCatalogItem, PriorityCode, TicketListFilters, TicketStatusCatalogItem, TicketsStatusCode, TicketSummary, User, UserListResponse, } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { TicketsService } from '../../../core/services/tickets.service';
import { UsersService } from '../../../core/services/users.service';
import { getApiErrorMessage } from '../../../core/utils/api-error';

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const EMPTY_USERS_RESPONSE: UserListResponse = {
  usuarios: [],
  paginacion: EMPTY_PAGINATION,
};

@Component({
  selector: 'app-ticket-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketListComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly ticketsService = inject(TicketsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly catalogsService = inject(CatalogsService);
  private readonly usersService = inject(UsersService);

  readonly currentUser = this.authService.user;

  readonly tickets = signal<TicketSummary[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly priorities = signal<PriorityCatalogItem[]>([]);
  readonly states = signal<TicketStatusCatalogItem[]>([]);
  readonly requesters = signal<User[]>([]);
  readonly technicians = signal<User[]>([]);

  readonly pagination = signal<Pagination>({
    ...EMPTY_PAGINATION,
  });

  readonly loadingTickets = signal(false);
  readonly loadingOptions = signal(false);
  readonly savingTicket = signal(false);
  readonly showCreateForm = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly isAdministrator = computed(
    () => this.authService.hasRole('ADMINISTRATOR'),
  );

  readonly canCreateTicket = computed(
    () =>
      this.authService.hasRole(
        'ADMINISTRATOR',
        'REQUESTER',
      ),
  );

  readonly filterForm = this.formBuilder.nonNullable.group({
    search: [
      '',
      [
        Validators.maxLength(150),
      ],
    ],
    estado:
      this.formBuilder.nonNullable.control<
        TicketsStatusCode | ''
      >(''),
    prioridad:
      this.formBuilder.nonNullable.control<
        PriorityCode | ''
      >(''),
    categoriaId: [''],
    tecnicoId: [''],
  });

  readonly createForm = this.formBuilder.nonNullable.group({
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
    solicitanteId: [''],
  });

  ngOnInit(): void {
    this.loadOptions();
    this.loadTickets(1);
  }

  loadOptions(): void {
    this.loadingOptions.set(true);

    const requestersRequest = this.isAdministrator()
      ? this.usersService.list({
          page: 1,
          limit: 100,
          rol: 'REQUESTER',
          activo: true,
        })
      : of(EMPTY_USERS_RESPONSE);

    const techniciansRequest = this.isAdministrator()
      ? this.usersService.list({
          page: 1,
          limit: 100,
          rol: 'TECHNICIAN',
          activo: true,
        })
      : of(EMPTY_USERS_RESPONSE);

    forkJoin({
      categories: this.categoriesService.list({
        page: 1,
        limit: 100,
        activo: true,
      }),
      priorities: this.catalogsService.listPriorities(),
      states: this.catalogsService.listStates(),
      requesters: requestersRequest,
      technicians: techniciansRequest,
    })
      .pipe(
        finalize(() => {
          this.loadingOptions.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.categories.set(response.categories.categorias);
          this.priorities.set(response.priorities);
          this.states.set(response.states);
          this.requesters.set(response.requesters.usuarios);
          this.technicians.set(response.technicians.usuarios);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'No fue posible cargar las opciones de los formularios',
            ),
          );
        },
      });
  }

  loadTickets(page: number): void {
    this.loadingTickets.set(true);
    this.errorMessage.set('');

    const values = this.filterForm.getRawValue();

    const filters: TicketListFilters = {
      page,
      limit: 10,
    };

    const search = values.search.trim();

    if (search) {
      filters.search = search;
    }

    if (values.estado) {
      filters.estado = values.estado;
    }

    if (values.prioridad) {
      filters.prioridad = values.prioridad;
    }

    if (values.categoriaId) {
      filters.categoriaId = values.categoriaId;
    }

    if (
      this.isAdministrator() &&
      values.tecnicoId
    ) {
      filters.tecnicoId = values.tecnicoId;
    }

    this.ticketsService
      .list(filters)
      .pipe(
        finalize(() => {
          this.loadingTickets.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.tickets.set(response.tickets);
          this.pagination.set(response.paginacion);
        },
        error: (error: unknown) => {
          this.tickets.set([]);
          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'No fue posible consultar los tickets',
            ),
          );
        },
      });
  }

  applyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.loadTickets(1);
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      estado: '',
      prioridad: '',
      categoriaId: '',
      tecnicoId: '',
    });

    this.loadTickets(1);
  }

  openCreateForm(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showCreateForm.set(true);
  }

  closeCreateForm(): void {
    this.showCreateForm.set(false);
    this.createForm.reset({
      titulo: '',
      descripcion: '',
      categoriaId: '',
      prioridadCodigo: '',
      solicitanteId: '',
    });
  }

  createTicket(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const values = this.createForm.getRawValue();

    if (
      this.isAdministrator() &&
      !values.solicitanteId
    ) {
      this.errorMessage.set(
        'Debes seleccionar el solicitante del ticket',
      );
      return;
    }

    const input: CreateTicketInput = {
      titulo: values.titulo.trim(),
      descripcion: values.descripcion.trim(),
      categoriaId: values.categoriaId,
      prioridadCodigo: values.prioridadCodigo as PriorityCode,
    };

    if (this.isAdministrator()) {
      input.solicitanteId = values.solicitanteId;
    }

    this.savingTicket.set(true);

    this.ticketsService
      .create(input)
      .pipe(
        finalize(() => {
          this.savingTicket.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set(
            `${response.message}. Código generado: ${response.ticket.codigo}`,
          );

          this.closeCreateForm();
          this.loadTickets(1);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'No fue posible crear el ticket',
            ),
          );
        },
      });
  }

  previousPage(): void {
    const currentPage = this.pagination().page;

    if (currentPage > 1) {
      this.loadTickets(currentPage - 1);
    }
  }

  nextPage(): void {
    const current = this.pagination();

    if (current.page < current.totalPages) {
      this.loadTickets(current.page + 1);
    }
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
}