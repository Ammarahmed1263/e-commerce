import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { uploadReview } from '../middlewares/uploadMiddleware.js';
import { createReviewValidation, updateReviewValidation } from '../validators/reviewValidation.js';

// Note: { mergeParams: true } is required because this route is mounted on productRoutes.js (/:productId/reviews)
const router = Router({ mergeParams: true });

router.get('/', reviewController.getProductReviews);

router.use(authMiddleware);

router.post('/', uploadReview.array('images', 5), validate(createReviewValidation), reviewController.createReview);

// General review routes (not nested under product)
router.patch('/:reviewId', validate(updateReviewValidation), reviewController.updateReview);
router.delete('/:reviewId', reviewController.deleteReview);

export default router;
