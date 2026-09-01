import { Router } from 'express';
import * as productController from '../controllers/productController';

const router = Router();

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.get('/:id', productController.getProductById);

export default router;
