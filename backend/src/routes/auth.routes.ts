import { Router } from 'express';

import { loginController, logoutController, meController, adminCheckController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

export const authRouter = Router();

authRouter.post('/login', loginController);
authRouter.get('/me', authenticate, meController);
authRouter.post('/logout', authenticate, logoutController);
authRouter.get('/admin-check', authenticate, authorizeRoles('ADMINISTRATOR'), adminCheckController);