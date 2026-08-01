import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import type {CreateUserInput, UpdateUserInput, User, UserListFilters, UserListResponse, } from '../models/api.models';
import { buildHttpParams } from '../utils/http-params';

@Injectable({providedIn: 'root',})
export class UsersService {
    private readonly http = inject(HttpClient);

    list(filters: UserListFilters = {},): Observable<UserListResponse> {
        const params = buildHttpParams({
            page: filters.page ?? 1,
            limit: filters.limit ?? 10,
            search: filters.search,
            rol: filters.rol,
            activo: filters.activo,
        });

        return this.http.get<UserListResponse>(`${API_URL}/users`,{ params },);
    }

    getById(id: string): Observable<{ usuario: User }> {
        return this.http.get<{ usuario: User }>(`${API_URL}/users/${encodeURIComponent(id)}`,);
    }

    create(input: CreateUserInput,): Observable<{ message: string; usuario: User }> {
        return this.http.post<{
            message: string;
            usuario: User;
        }>(`${API_URL}/users`, input);
    }

    update(id: string,input: UpdateUserInput,): Observable<{ message: string; usuario: User }> {
        return this.http.patch<{
            message: string;
            usuario: User;
        }>(`${API_URL}/users/${encodeURIComponent(id)}`,input,);
    }

    deactivate(id: string,): Observable<{ message: string; usuario: User }> {
        return this.http.delete<{
            message: string;
            usuario: User;
        }>(`${API_URL}/users/${encodeURIComponent(id)}`);
    }
}