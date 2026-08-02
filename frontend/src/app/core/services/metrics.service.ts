import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { MetricsResponse,} from '../models/metrics.models';

@Injectable({
  providedIn: 'root',
})
export class MetricsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/metrics';

  getDashboard(): Observable<MetricsResponse> {
    return this.http.get<MetricsResponse>(this.apiUrl);
  }
}