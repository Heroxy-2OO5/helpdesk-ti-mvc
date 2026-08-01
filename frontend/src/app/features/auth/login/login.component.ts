import { ChangeDetectionStrategy, Component, inject, signal, } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { getApiErrorMessage } from '../../../core/utils/api-error';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
    private readonly formBuilder = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly loading = signal(false);
    readonly errorMessage = signal('');

    readonly form = this.formBuilder.nonNullable.group({
        correo: ['', [
            Validators.required,
            Validators.email,
            Validators.maxLength(150),
            ],
        ],
        contrasena: ['', [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(72),
            ],
        ],
    });

    constructor() {
        if (this.authService.isAuthenticated()) {
            void this.authService.redirectToStart();
        }
    }

    submit(): void {
        this.errorMessage.set('');

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);

        this.authService.login(this.form.getRawValue()).pipe(
            finalize(() => {
                this.loading.set(false);
            }),
        ).subscribe({
            next: () => {
                void this.router.navigateByUrl('/inicio');
            },
            error: (error: unknown) => {
                this.errorMessage.set(getApiErrorMessage(error,'No fue posible iniciar sesión',),);
            },
        });
    }
}