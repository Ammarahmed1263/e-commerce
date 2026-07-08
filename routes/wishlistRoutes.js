import { Router } from 'express';
import * as wishlistController from '../controllers/wishlistController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

// All wishlist routes require authentication
router.use(authMiddleware);

// GET  /wishlist             — fetch current user's wishlist
router.get('/', wishlistController.getWishlist);

// POST /wishlist/items       — add a product to the wishlist
router.post('/items', wishlistController.addItem);

// DELETE /wishlist/items/:productId  — remove a product from the wishlist
router.delete('/items/:productId', wishlistController.removeItem);

// POST /wishlist/items/:productId/move-to-cart — move item to cart
router.post('/items/:productId/move-to-cart', wishlistController.moveToCart);

export default router;
