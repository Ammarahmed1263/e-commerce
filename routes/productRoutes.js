import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';
import { createProductValidation, updateProductValidation } from '../validators/productValidation.js';
import reviewRoutes from './reviewRoutes.js';

const router = Router();

// Nested route for reviews on a product
router.use('/:productId/reviews', reviewRoutes);

// Public routes
router.get('/featured', productController.getFeaturedProducts);
router.get('/', productController.getProducts);
router.get('/:slug', productController.getProduct);

// Vendor routes
router.use(authMiddleware, allowTo(userRoles.SELLER, userRoles.ADMIN));

router.post('/', validate(createProductValidation), productController.createProduct);
router.patch('/:slug', validate(updateProductValidation), productController.updateProduct);
router.delete('/:slug', productController.deleteProduct);

export default router;
