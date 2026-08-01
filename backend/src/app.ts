import express from 'express';

import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { userRouter } from './routes/user.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { catalogRouter } from './routes/catalog.routes.js';
import { ticketRouter } from './routes/ticket.routes.js';
import { metricsRouter } from './routes/metrics.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/catalogs', catalogRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/metrics', metricsRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
