import { ChangeDetectionStrategy, Component, inject, signal, } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly user = this.authService.user;
    readonly closingSession = signal(false);

    logout(): void {
        this.closingSession.set(true);

        this.authService.logout().subscribe({
            next: () => {
                void this.router.navigateByUrl('/login');
            },
            error: () => {
                void this.router.navigateByUrl('/login');
            },
        });
    }
}