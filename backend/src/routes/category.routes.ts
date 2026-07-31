import { Router } from 'express';

import { createCategoryController, deactivateCategoryController, getCategoryController, listCategoriesController, updateCategoryController, } from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

export const categoryRouter = Router();

categoryRouter.use(authenticate);

categoryRouter.route('/').get(listCategoriesController).post(
        authorizeRoles('ADMINISTRATOR'),
        createCategoryController,
    );

categoryRouter.route('/:id').get(getCategoryController).patch(
        authorizeRoles('ADMINISTRATOR'),
        updateCategoryController,
    ).delete(
        authorizeRoles('ADMINISTRATOR'),
        deactivateCategoryController,
    );