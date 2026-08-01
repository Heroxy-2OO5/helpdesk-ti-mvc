import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import( './features/auth/login/login.component').then((component) => component.LoginComponent),
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import( './layout/app-shell/app-shell.component').then((component) => component.AppShellComponent),
        children: [
            {
                path: 'inicio',
                loadComponent: () => import( './features/home/home.component').then((component) => component.HomeComponent),
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'inicio',
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'inicio',
    },
];