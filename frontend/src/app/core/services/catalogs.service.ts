import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import type { PriorityCatalogItem, RoleCatalogItem, TicketStatusCatalogItem, } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogsService {
  private readonly http = inject(HttpClient);

  listRoles(): Observable<RoleCatalogItem[]> {
    return this.http
      .get<{ roles: RoleCatalogItem[] }>(
        `${API_URL}/catalogs/roles`,
      )
      .pipe(
        map((response) => response.roles),
      );
  }

  listPriorities(): Observable<PriorityCatalogItem[]> {
    return this.http
      .get<{ prioridades: PriorityCatalogItem[] }>(
        `${API_URL}/catalogs/priorities`,
      )
      .pipe(
        map((response) => response.prioridades),
      );
  }

  listStates(): Observable<TicketStatusCatalogItem[]> {
    return this.http
      .get<{ estados: TicketStatusCatalogItem[] }>(
        `${API_URL}/catalogs/states`,
      )
      .pipe(
        map((response) => response.estados),
      );
  }
}