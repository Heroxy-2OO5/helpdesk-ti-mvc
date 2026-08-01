import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';

import type { ChangeTicketStatusInput, Category, PriorityCatalogItem, PriorityCode, TicketDetail, TicketStatusCatalogItem, TicketsStatusCode, UpdateTicketInput, User, UserListResponse, } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { TicketsService } from '../../../core/services/tickets.service';
import { UsersService } from '../../../core/services/users.service';
import { getApiErrorMessage } from '../../../core/utils/api-error';

const EMPTY_USERS: UserListResponse = {
  usuarios: [],
  paginacion: {
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  },
};

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
  private readonly usersService = inject(UsersService);

  private readonly ticketId =
    this.route.snapshot.paramMap.get('id') ?? '';

  readonly currentUser = this.authService.user;
  readonly ticket = signal<TicketDetail | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly priorities = signal<PriorityCatalogItem[]>([]);
  readonly states = signal<TicketStatusCatalogItem[]>([]);
  readonly technicians = signal<User[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly processingAction = signal(false);
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

  readonly canManageAssignment = computed(() => {
    const currentTicket = this.ticket();

    return Boolean(
      this.isAdministrator() &&
      currentTicket?.activo &&
      ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(
        currentTicket.estadoCodigo,
      ),
    );
  });

  readonly canRemoveAssignment = computed(() => {
    const currentTicket = this.ticket();

    return Boolean(
      this.isAdministrator() &&
      currentTicket?.activo &&
      currentTicket.estadoCodigo === 'ASSIGNED' &&
      currentTicket.tecnicoId,
    );
  });

  readonly availableStates = computed(() => {
    const currentTicket = this.ticket();

    if (!currentTicket || !currentTicket.activo) {
      return [];
    }

    let allowedCodes: TicketsStatusCode[] = [];

    switch (currentTicket.estadoCodigo) {
      case 'PENDING':
        allowedCodes = [];
        break;

      case 'ASSIGNED':
        allowedCodes = ['IN_PROGRESS'];
        break;

      case 'IN_PROGRESS':
        allowedCodes = ['ASSIGNED', 'RESOLVED'];
        break;

      case 'RESOLVED':
        allowedCodes = this.isAdministrator()
          ? ['IN_PROGRESS', 'CLOSED']
          : ['IN_PROGRESS'];
        break;

      case 'CLOSED':
        allowedCodes = [];
        break;
    }

    return this.states().filter((state) =>
      allowedCodes.includes(state.codigo),
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
    categoriaId: ['', [Validators.required]],
    prioridadCodigo:
      this.formBuilder.nonNullable.control<
        PriorityCode | ''
      >('', [Validators.required]),
  });

  readonly assignmentForm = this.formBuilder.nonNullable.group({
    tecnicoId: ['', [Validators.required]],
  });

  readonly statusForm = this.formBuilder.nonNullable.group({
    estadoCodigo:
      this.formBuilder.nonNullable.control<
        TicketsStatusCode | ''
      >('', [Validators.required]),
    solucion: [
      '',
      [Validators.maxLength(8000)],
    ],
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

    const techniciansRequest = this.isAdministrator()
      ? this.usersService.list({
          page: 1,
          limit: 100,
          rol: 'TECHNICIAN',
          activo: true,
        })
      : of(EMPTY_USERS);

    forkJoin({
      ticket: this.ticketsService.getById(this.ticketId),
      categories: this.categoriesService.list({
        page: 1,
        limit: 100,
        activo: this.isAdministrator() ? undefined : true,
      }),
      priorities: this.catalogsService.listPriorities(),
      states: this.catalogsService.listStates(),
      technicians: techniciansRequest,
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
          this.states.set(response.states);
          this.technicians.set(response.technicians.usuarios);
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
    this.clearMessages();

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

  assignTechnician(): void {
    this.clearMessages();

    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    const technicianId =
      this.assignmentForm.controls.tecnicoId.value;

    this.processingAction.set(true);

    this.ticketsService
      .assign(this.ticketId, {
        tecnicoId: technicianId,
      })
      .pipe(
        finalize(() => {
          this.processingAction.set(false);
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
              'No fue posible asignar el técnico',
            ),
          );
        },
      });
  }

  removeAssignment(): void {
    this.clearMessages();

    const confirmed = window.confirm(
      '¿Deseas retirar al técnico asignado?',
    );

    if (!confirmed) {
      return;
    }

    this.processingAction.set(true);

    this.ticketsService
      .assign(this.ticketId, {
        tecnicoId: null,
      })
      .pipe(
        finalize(() => {
          this.processingAction.set(false);
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
              'No fue posible retirar la asignación',
            ),
          );
        },
      });
  }

  changeStatus(): void {
    this.clearMessages();

    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    const values = this.statusForm.getRawValue();
    const status = values.estadoCodigo as TicketsStatusCode;
    const solution = values.solucion.trim();
    const currentTicket = this.ticket();

    if (
      status === 'RESOLVED' &&
      !solution &&
      !currentTicket?.solucion
    ) {
      this.errorMessage.set(
        'Debes registrar una solución para resolver el ticket',
      );
      return;
    }

    if (
      solution &&
      solution.length < 5
    ) {
      this.errorMessage.set(
        'La solución debe tener al menos 5 caracteres',
      );
      return;
    }

    const input: ChangeTicketStatusInput = {
      estadoCodigo: status,
    };

    if (
      solution &&
      ['RESOLVED', 'CLOSED'].includes(status)
    ) {
      input.solucion = solution;
    }

    this.processingAction.set(true);

    this.ticketsService
      .changeStatus(this.ticketId, input)
      .pipe(
        finalize(() => {
          this.processingAction.set(false);
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
              'No fue posible cambiar el estado',
            ),
          );
        },
      });
  }

  deactivateTicket(): void {
    this.clearMessages();

    const reason = window.prompt(
      'Escribe el motivo de eliminación del ticket:',
    );

    if (reason === null) {
      return;
    }

    const normalizedReason = reason.trim();

    if (normalizedReason.length < 5) {
      this.errorMessage.set(
        'El motivo debe tener al menos 5 caracteres',
      );
      return;
    }

    const confirmed = window.confirm(
      'El ticket se ocultará de las consultas normales. ¿Deseas continuar?',
    );

    if (!confirmed) {
      return;
    }

    this.processingAction.set(true);

    this.ticketsService
      .deactivate(this.ticketId, {
        motivo: normalizedReason,
      })
      .pipe(
        finalize(() => {
          this.processingAction.set(false);
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/tickets');
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'No fue posible eliminar el ticket',
            ),
          );
        },
      });
  }

  goBack(): void {
    void this.router.navigateByUrl('/tickets');
  }

  eventLabel(code: string): string {
    const labels: Record<string, string> = {
      CREATED: 'Ticket creado',
      UPDATED: 'Información actualizada',
      ASSIGNED: 'Técnico asignado',
      REASSIGNED: 'Técnico reasignado',
      UNASSIGNED: 'Asignación retirada',
      STATUS_CHANGED: 'Estado actualizado',
      SOLUTION_RECORDED: 'Solución registrada',
      DELETED: 'Ticket eliminado',
      RESTORED: 'Ticket restaurado',
    };

    return labels[code] ?? code;
  }

  stateLabel(code: TicketsStatusCode | null): string {
    if (!code) {
      return 'Sin estado';
    }

    return (
      this.states().find((state) => state.codigo === code)
        ?.nombre ?? code
    );
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

    this.assignmentForm.reset({
      tecnicoId: ticket.tecnicoId ?? '',
    });

    this.statusForm.reset({
      estadoCodigo: '',
      solucion: '',
    });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}