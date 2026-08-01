import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import type { Role } from '../models/api.models';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.user();

    if (!user) {
        return router.createUrlTree(['/login']);
    }

    const allowedRoles = route.data['roles'] as Role[] | undefined;

    if (!allowedRoles || allowedRoles.includes(user.rol)) {
        return true;
    }

    return router.createUrlTree(['/inicio']);
};