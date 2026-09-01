import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';

const router = Router();

router.post('/initiate', paymentController.initiatePayment);

export default router;
