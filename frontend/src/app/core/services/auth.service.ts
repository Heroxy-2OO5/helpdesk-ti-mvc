import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, Observable, of, tap } from 'rxjs';

import { API_URL } from '../config/api.config';
import type {AuthUser, LoginRequest, LoginResponse, Role } from '../models/api.models';

const TOKEN_KEY = 'helpdesk_ti_token';
const USER_KEY = 'helpdesk_ti_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly storage = typeof window !== 'undefined' ? window.localStorage : null;

    private readonly tokenState = signal<string | null>(this.storage?.getItem(TOKEN_KEY) ?? null,);

    private readonly userState = signal<AuthUser | null>(this.readStoredUser());

    readonly token = this.tokenState.asReadonly();
    readonly user = this.userState.asReadonly();

    readonly isAuthenticated = computed( () => Boolean(this.tokenState() && this.userState()) );

    constructor() {
        if (!this.tokenState() || !this.userState()) {
            this.clearSession();
        }
    }

    login(input: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${API_URL}/auth/login`, input).pipe(
            tap((response) => {
                this.saveSession(response);
            }),
        );
    }

    getProfile(): Observable<{ usuario: AuthUser }> {
        return this.http.get<{ usuario: AuthUser }>(`${API_URL}/auth/me`).pipe(
            tap(({ usuario }) => {
                this.userState.set(usuario);
                this.storage?.setItem(USER_KEY, JSON.stringify(usuario));
            }),
        );
    }

    logout(): Observable<{ message: string }> {
        if (!this.tokenState()) {
            this.clearSession();

            return of({
                message: 'Sesión cerrada correctamente',
            });
        }

        return this.http.post<{ message: string }>(`${API_URL}/auth/logout`, {}).pipe(
            finalize(() => {
                this.clearSession();
            }),
        );
    }

    hasRole(...roles: Role[]): boolean {
        const currentUser = this.user();

        return currentUser !== null && roles.includes(currentUser.rol);
    }

    clearSession(): void {
        this.tokenState.set(null);
        this.userState.set(null);
        this.storage?.removeItem(TOKEN_KEY);
        this.storage?.removeItem(USER_KEY);
    }

    redirectToStart(): Promise<boolean> {
        return this.router.navigateByUrl('/inicio');
    }

    private saveSession(response: LoginResponse): void {
        this.tokenState.set(response.token);
        this.userState.set(response.usuario);

        this.storage?.setItem(TOKEN_KEY, response.token);
        this.storage?.setItem(USER_KEY, JSON.stringify(response.usuario),);
    }

    private readStoredUser(): AuthUser | null {
        const storedUser = this.storage?.getItem(USER_KEY);

        if (!storedUser) {
            return null;
        }

        try {
            const parsed = JSON.parse(storedUser) as Partial<AuthUser>;

            if (
                typeof parsed.id !== 'string' ||
                typeof parsed.nombreCompleto !== 'string' ||
                typeof parsed.correo !== 'string' ||
                !this.isRole(parsed.rol)
            ) {
                return null;
            }

            return parsed as AuthUser;
        } catch {
            return null;
        }
    }

    private isRole(value: unknown): value is Role {
        return (
            value === 'ADMINISTRATOR' ||
            value === 'TECHNICIAN' ||
            value === 'REQUESTER'
        );
    }
}