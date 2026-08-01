import { inject } from "@angular/core";
import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { Router } from "@angular/router";
import { catchError, retry, throwError } from "rxjs";

import { API_URL } from "../config/api.config";
import { AuthService } from "../services/auth.service";
import { unknown } from 'zod';

export const authInterceptor: HttpInterceptorFn = ( request, next ) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.token();

    const isApiRequest = request.url.startsWith(API_URL);

    const authenticatedRequest = token && isApiRequest ? request.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
        },
    }): request;

    return next(authenticatedRequest).pipe(catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && !request.url.endsWith('/auth/login')) {
            authService.clearSession();
            void router.navigateByUrl('/login');
        }

        return throwError(() => error);
    }),
    );
};