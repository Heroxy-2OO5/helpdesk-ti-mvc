import { CommonModule } from '@angular/common';
import {ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import type {
  TicketSummary,
} from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { MetricsService } from '../../core/services/metrics.service';
import { TicketsService } from '../../core/services/tickets.service';

interface HomeSummary {
  total: number;
  pendientes: number;
  asignados: number;
  enProceso: number;
  resueltos: number;
  cerrados: number;
  criticos: number;
}

const EMPTY_SUMMARY: HomeSummary = {
  total: 0,
  pendientes: 0,
  asignados: 0,
  enProceso: 0,
  resueltos: 0,
  cerrados: 0,
  criticos: 0,
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly ticketsService = inject(TicketsService);
  private readonly metricsService = inject(MetricsService);

  readonly user = this.authService.user;

  readonly resumen = signal<HomeSummary>({
    ...EMPTY_SUMMARY,
  });

  readonly ticketsRecientes = signal<TicketSummary[]>([]);
  readonly cargando = signal(false);
  readonly mensajeError = signal('');

  readonly saludo = this.obtenerSaludo();

  readonly esAdministrador = computed(
    () => this.user()?.rol === 'ADMINISTRATOR',
  );

  readonly esTecnico = computed(
    () => this.user()?.rol === 'TECHNICIAN',
  );

  readonly esSolicitante = computed(
    () => this.user()?.rol === 'REQUESTER',
  );

  readonly ticketsEnAtencion = computed(
    () => (
      this.resumen().asignados
      + this.resumen().enProceso
    ),
  );

  ngOnInit(): void {
    this.cargarPanel();
  }

  cargarPanel(): void {
    const usuario = this.user();

    if (!usuario) {
      this.mensajeError.set(
        'No fue posible identificar al usuario de la sesión.',
      );
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set('');

    if (usuario.rol === 'ADMINISTRATOR') {
      this.cargarPanelAdministrador();
      return;
    }

    this.cargarPanelTickets();
  }

  nombreRol(): string {
    switch (this.user()?.rol) {
      case 'ADMINISTRATOR':
        return 'Administrador';
      case 'TECHNICIAN':
        return 'Técnico de soporte';
      case 'REQUESTER':
        return 'Solicitante';
      default:
        return 'Usuario';
    }
  }

  descripcionRol(): string {
    switch (this.user()?.rol) {
      case 'ADMINISTRATOR':
        return 'Supervisa la operación del HelpDesk y gestiona los recursos del sistema.';
      case 'TECHNICIAN':
        return 'Consulta tus asignaciones y continúa atendiendo las incidencias pendientes.';
      case 'REQUESTER':
        return 'Registra solicitudes de soporte y consulta el avance de tus tickets.';
      default:
        return 'Consulta la información disponible en el sistema.';
    }
  }

  tituloTickets(): string {
    switch (this.user()?.rol) {
      case 'ADMINISTRATOR':
        return 'Tickets recientes del sistema';
      case 'TECHNICIAN':
        return 'Mis asignaciones recientes';
      case 'REQUESTER':
        return 'Mis solicitudes recientes';
      default:
        return 'Tickets recientes';
    }
  }

  subtituloTickets(): string {
    switch (this.user()?.rol) {
      case 'ADMINISTRATOR':
        return 'Últimas incidencias registradas por los usuarios.';
      case 'TECHNICIAN':
        return 'Tickets que han sido asignados a tu cuenta.';
      case 'REQUESTER':
        return 'Seguimiento de tus solicitudes de soporte.';
      default:
        return 'Actividad reciente.';
    }
  }

  clasePrioridad(prioridad: string): string {
    switch (prioridad) {
      case 'CRITICAL':
        return 'priority-critical';
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'PENDING':
        return 'status-pending';
      case 'ASSIGNED':
        return 'status-assigned';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'RESOLVED':
        return 'status-resolved';
      case 'CLOSED':
        return 'status-closed';
      default:
        return '';
    }
  }

  private cargarPanelAdministrador(): void {
    forkJoin({
      metricas: this.metricsService.getDashboard(),
      recientes: this.ticketsService.list({
        page: 1,
        limit: 5,
      }),
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: ({ metricas, recientes }) => {
          const dashboard = metricas.metricas;

          const criticos = dashboard.porPrioridad.find(
            (item) => item.prioridadCodigo === 'CRITICAL',
          )?.cantidad ?? 0;

          this.resumen.set({
            total: dashboard.resumen.totalTickets,
            pendientes: dashboard.resumen.pendientes,
            asignados: dashboard.resumen.asignados,
            enProceso: dashboard.resumen.enProceso,
            resueltos: dashboard.resumen.resueltos,
            cerrados: dashboard.resumen.cerrados,
            criticos,
          });

          this.ticketsRecientes.set(recientes.tickets);
        },
        error: () => {
          this.mostrarErrorCarga();
        },
      });
  }

  private cargarPanelTickets(): void {
    forkJoin({
      recientes: this.ticketsService.list({
        page: 1,
        limit: 5,
      }),
      pendientes: this.ticketsService.list({
        page: 1,
        limit: 1,
        estado: 'PENDING',
      }),
      asignados: this.ticketsService.list({
        page: 1,
        limit: 1,
        estado: 'ASSIGNED',
      }),
      enProceso: this.ticketsService.list({
        page: 1,
        limit: 1,
        estado: 'IN_PROGRESS',
      }),
      resueltos: this.ticketsService.list({
        page: 1,
        limit: 1,
        estado: 'RESOLVED',
      }),
      cerrados: this.ticketsService.list({
        page: 1,
        limit: 1,
        estado: 'CLOSED',
      }),
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.resumen.set({
            total: response.recientes.paginacion.total,
            pendientes: response.pendientes.paginacion.total,
            asignados: response.asignados.paginacion.total,
            enProceso: response.enProceso.paginacion.total,
            resueltos: response.resueltos.paginacion.total,
            cerrados: response.cerrados.paginacion.total,
            criticos: 0,
          });

          this.ticketsRecientes.set(response.recientes.tickets);
        },
        error: () => {
          this.mostrarErrorCarga();
        },
      });
  }

  private mostrarErrorCarga(): void {
    this.resumen.set({
      ...EMPTY_SUMMARY,
    });

    this.ticketsRecientes.set([]);

    this.mensajeError.set(
      'No pudimos cargar el resumen de tu cuenta. Intenta nuevamente.',
    );
  }

  private obtenerSaludo(): string {
    const hora = new Date().getHours();

    if (hora < 12) {
      return 'Buenos días';
    }

    if (hora < 19) {
      return 'Buenas tardes';
    }

    return 'Buenas noches';
  }
}