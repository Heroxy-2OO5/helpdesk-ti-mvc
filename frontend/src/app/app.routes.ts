import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
                path: 'tickets/:id',
                loadComponent: () => import( './features/tickets/ticket-detail/ticket-detail.component').then((component) => component.TicketDetailComponent),
            },
            {
                path: 'tickets',
                loadComponent: () => import( './features/tickets/ticket-list/ticket-list.component').then((component) => component.TicketListComponent,),
            },
            {
                path: 'inicio',
                loadComponent: () => import( './features/home/home.component').then((component) => component.HomeComponent),
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'inicio',
            },
            {
                path: 'administracion/usuarios',
                canActivate: [roleGuard],
                data: {
                    roles: ['ADMINISTRATOR'],
                },
                loadComponent: () => import('./features/admin/users/users-admin.component').then((component) => component.UsersAdminComponent),
            },
            {
                path: 'administracion/categorias',
                canActivate: [roleGuard],
                data: {
                    roles: ['ADMINISTRATOR'],
                },
                loadComponent: () => import('./features/admin/categories/categories-admin.component').then((component) => component.CategoriesAdminComponent),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'inicio',
    },
];