import { Router } from 'express';

import { getMetricsController } from '../controllers/metrics.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

export const metricsRouter = Router();

metricsRouter.get(
    '/',
    authenticate,
    authorizeRoles('ADMINISTRATOR'),
    getMetricsController,
);
