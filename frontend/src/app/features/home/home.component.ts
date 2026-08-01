import { ChangeDetectionStrategy, Component, inject, OnInit, signal, } from '@angular/core';
import { finalize } from 'rxjs';

import type { HealthResponse } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
    private readonly healthService = inject(HealthService);
    private readonly authService = inject(AuthService);

    readonly user = this.authService.user;
    readonly health = signal<HealthResponse | null>(null);
    readonly loading = signal(false);
    readonly errorMessage = signal('');

    ngOnInit(): void {
        this.verifyConnection();
    }

    verifyConnection(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.healthService.check().pipe(
            finalize(() => {
                this.loading.set(false);
            }),
        ).subscribe({
            next: (health) => {
                this.health.set(health);
            },
            error: (error: unknown) => {
                this.health.set(null);
                this.errorMessage.set(
                    getApiErrorMessage(
                        error,
                    'No se pudo comprobar la conexión',
                    ),
                );
            },
        });
    }

    roleName(): string {
        switch (this.user()?.rol) {
            case 'ADMINISTRATOR': return 'Administrador';
            case 'TECHNICIAN': return 'Técnico';
            case 'REQUESTER': return 'Solicitante';
            default: return 'Sin rol';
        }
    }
}