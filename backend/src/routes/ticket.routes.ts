import { Router } from 'express';

import {
    createTicketController,
    getTicketController,
    listTicketsController,
} from '../controllers/ticket.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

export const ticketRouter = Router();

ticketRouter.use(authenticate);

ticketRouter.route('/')
    .get(listTicketsController)
    .post(
        authorizeRoles('ADMINISTRATOR', 'REQUESTER'),
        createTicketController,
    );

ticketRouter.get('/:id', getTicketController);
