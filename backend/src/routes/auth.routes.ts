import { Router } from 'express';

import { loginController, logoutController, meController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/login', loginController);
authRouter.get('/me', authenticate, meController);
authRouter.post('/logout', authenticate, logoutController);