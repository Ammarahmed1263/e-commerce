import express, { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = Router();

// This route must be parsed as raw body
router.post('/', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

export default router;
