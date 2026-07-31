import { Router } from 'express';

import { listPrioritiesController, listRolesController, listTicketStatusesController, } from '../controllers/catalog.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const catalogRouter = Router();

catalogRouter.use(authenticate);

catalogRouter.get('/roles', listRolesController);
catalogRouter.get('/priorities', listPrioritiesController);
catalogRouter.get('/states', listTicketStatusesController);