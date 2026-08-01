import { HttpErrorResponse } from "@angular/common/http";

import type { ApiErrorResponse } from '../models/api.models';

export function getApiErrorMessage(error: unknown, fallback = 'No fue posible completar la operación'): string {
    if(!(error instanceof  HttpErrorResponse)){
        return fallback;
    }

    const body = error.error as Partial<ApiErrorResponse> | undefined;

    if (body?.error?.message){
        return body.error.message;
    }

    if(error.status === 0){
        return 'No fue posible comunicarse con el backend';
    }

    return fallback;
}