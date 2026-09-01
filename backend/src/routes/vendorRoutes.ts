import { Router } from 'express';
import * as vendorController from '../controllers/vendorController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.post('/apply', protect, vendorController.applyVendor);
router.get('/dashboard', protect, authorize('vendor', 'admin'), vendorController.getVendorDashboard);

export default router;
