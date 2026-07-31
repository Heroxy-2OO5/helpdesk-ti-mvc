import express from 'express';

import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { userRouter } from './routes/user.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter)

app.use(notFoundMiddleware);
app.use(errorMiddleware);
