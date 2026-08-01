import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import type { AssignTicketInput, ChangeTicketStatusInput, CreateTicketInput, DeleteTicketInput, TicketDetail, TicketListFilters, TicketListResponse, UpdateTicketInput, } from '../models/api.models';
import { buildHttpParams } from '../utils/http-params';

@Injectable({
  providedIn: 'root',
})
export class TicketsService {
  private readonly http = inject(HttpClient);

  list(
    filters: TicketListFilters = {},
  ): Observable<TicketListResponse> {
    const params = buildHttpParams({
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      search: filters.search,
      estado: filters.estado,
      prioridad: filters.prioridad,
      categoriaId: filters.categoriaId,
      tecnicoId: filters.tecnicoId,
      activo: filters.activo,
    });

    return this.http.get<TicketListResponse>(
      `${API_URL}/tickets`,
      { params },
    );
  }

  getById(id: string): Observable<{ ticket: TicketDetail }> {
    return this.http.get<{ ticket: TicketDetail }>(
      `${API_URL}/tickets/${encodeURIComponent(id)}`,
    );
  }

  create(
    input: CreateTicketInput,
  ): Observable<{ message: string; ticket: TicketDetail }> {
    return this.http.post<{
      message: string;
      ticket: TicketDetail;
    }>(`${API_URL}/tickets`, input);
  }

  update(
    id: string,
    input: UpdateTicketInput,
  ): Observable<{ message: string; ticket: TicketDetail }> {
    return this.http.patch<{
      message: string;
      ticket: TicketDetail;
    }>(
      `${API_URL}/tickets/${encodeURIComponent(id)}`,
      input,
    );
  }

  deactivate(
    id: string,
    input: DeleteTicketInput,
  ): Observable<{ message: string; ticket: TicketDetail }> {
    return this.http.delete<{
      message: string;
      ticket: TicketDetail;
    }>(
      `${API_URL}/tickets/${encodeURIComponent(id)}`,
      {
        body: input,
      },
    );
  }

  assign(
    id: string,
    input: AssignTicketInput,
  ): Observable<{ message: string; ticket: TicketDetail }> {
    return this.http.patch<{
      message: string;
      ticket: TicketDetail;
    }>(
      `${API_URL}/tickets/${encodeURIComponent(id)}/assignment`,
      input,
    );
  }

  changeStatus(
    id: string,
    input: ChangeTicketStatusInput,
  ): Observable<{ message: string; ticket: TicketDetail }> {
    return this.http.patch<{
      message: string;
      ticket: TicketDetail;
    }>(
      `${API_URL}/tickets/${encodeURIComponent(id)}/status`,
      input,
    );
  }
}