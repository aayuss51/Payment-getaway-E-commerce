import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.post('/checkout', protect, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.patch('/:id/status', protect, authorize('vendor', 'admin', 'customer_support'), orderController.updateOrderStatus);

export default router;
