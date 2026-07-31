import { Router } from 'express';

import {createUserController, deactivateUserController, getUserController, listUsersController, updateUserController,} from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.use(authorizeRoles('ADMINISTRATOR'));

userRouter.route('/').get(listUsersController).post(createUserController);

userRouter.route('/:id').get(getUserController).patch(updateUserController).delete(deactivateUserController);