import { Router } from 'express';

import {
    createTicketController,
    deactivateTicketController,
    getTicketController,
    listTicketsController,
    updateTicketController,
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

ticketRouter.route('/:id')
    .get(getTicketController)
    .patch(
        authorizeRoles('ADMINISTRATOR', 'REQUESTER'),
        updateTicketController,
    )
    .delete(
        authorizeRoles('ADMINISTRATOR'),
        deactivateTicketController,
    );
