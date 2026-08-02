import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal, } from '@angular/core';
import { finalize } from 'rxjs';

import type { MetricsDashboard, } from '../../../core/models/metrics.models';
import { MetricsService } from '../../../core/services/metrics.service';

@Component({
  selector: 'app-metrics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-dashboard.component.html',
  styleUrl: './metrics-dashboard.component.css',
})
export class MetricsDashboardComponent implements OnInit {
  private readonly metricsService = inject(MetricsService);

  readonly metricas = signal<MetricsDashboard | null>(null);
  readonly cargando = signal(false);
  readonly mensajeError = signal('');
  readonly actualizadoEn = signal<Date | null>(null);

  readonly maximoEstados = computed(() =>
    Math.max(
      ...(
        this.metricas()?.porEstado.map(
          (item) => item.cantidad,
        ) ?? [0]
      ),
      1,
    ),
  );

  readonly maximoPrioridades = computed(() =>
    Math.max(
      ...(
        this.metricas()?.porPrioridad.map(
          (item) => item.cantidad,
        ) ?? [0]
      ),
      1,
    ),
  );

  readonly maximoCategorias = computed(() =>
    Math.max(
      ...(
        this.metricas()?.porCategoria.map(
          (item) => item.cantidad,
        ) ?? [0]
      ),
      1,
    ),
  );

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.cargando.set(true);
    this.mensajeError.set('');

    this.metricsService.getDashboard()
      .pipe(
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.metricas.set(response.metricas);
          this.actualizadoEn.set(new Date());
        },
        error: (error: unknown) => {
          this.mensajeError.set(
            this.obtenerMensajeError(
              error,
              'No fue posible cargar las métricas.',
            ),
          );
        },
      });
  }

  anchoBarra(valor: number, maximo: number): string {
    if (valor <= 0 || maximo <= 0) {
      return '0%';
    }

    return `${Math.max((valor / maximo) * 100, 4)}%`;
  }

  porcentaje(valor: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    return Math.round((valor / total) * 100);
  }

  clasePrioridad(codigo: string): string {
    switch (codigo) {
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