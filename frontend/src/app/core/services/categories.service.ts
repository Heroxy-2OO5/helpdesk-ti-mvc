import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import type {Category, CategoryListFilters, CategoryListResponse, CreateCategoryInput,UpdateCategoryInput, } from '../models/api.models';
import { buildHttpParams } from '../utils/http-params';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);

  list(
    filters: CategoryListFilters = {},
  ): Observable<CategoryListResponse> {
    const params = buildHttpParams({
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      search: filters.search,
      activo: filters.activo,
    });

    return this.http.get<CategoryListResponse>(
      `${API_URL}/categories`,
      { params },
    );
  }

  getById(id: string): Observable<{ categoria: Category }> {
    return this.http.get<{ categoria: Category }>(
      `${API_URL}/categories/${encodeURIComponent(id)}`,
    );
  }

  create(
    input: CreateCategoryInput,
  ): Observable<{ message: string; categoria: Category }> {
    return this.http.post<{
      message: string;
      categoria: Category;
    }>(`${API_URL}/categories`, input);
  }

  update(
    id: string,
    input: UpdateCategoryInput,
  ): Observable<{ message: string; categoria: Category }> {
    return this.http.patch<{
      message: string;
      categoria: Category;
    }>(
      `${API_URL}/categories/${encodeURIComponent(id)}`,
      input,
    );
  }

  deactivate(
    id: string,
  ): Observable<{ message: string; categoria: Category }> {
    return this.http.delete<{
      message: string;
      categoria: Category;
    }>(
      `${API_URL}/categories/${encodeURIComponent(id)}`,
    );
  }
}