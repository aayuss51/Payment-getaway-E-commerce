import { Router } from 'express';
import * as authController from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/register', authController.register);
router.get('/me', protect, authController.getMe);

export default router;
