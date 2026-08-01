import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import { API_URL } from "../config/api.config";
import type { HealthResponse } from "../models/api.models";

@Injectable({
    providedIn: 'root'
})
export class HealthService {
    private readonly http = inject(HttpClient);

    check(): Observable<HealthResponse> {
        return this.http.get<HealthResponse>(`${API_URL}/health`);
    }
}