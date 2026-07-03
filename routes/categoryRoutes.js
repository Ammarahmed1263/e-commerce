import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';
import { createCategoryValidation, updateCategoryValidation } from '../validators/categoryValidation.js';

const router = Router();

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategory);

// Admin routes
router.use(authMiddleware, allowTo(userRoles.ADMIN));

router.post('/', validate(createCategoryValidation), categoryController.createCategory);
router.patch('/:slug', validate(updateCategoryValidation), categoryController.updateCategory);
router.delete('/:slug', categoryController.deleteCategory);

export default router;
