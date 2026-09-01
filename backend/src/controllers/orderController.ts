import { Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createOrder = async (req: AuthRequest, res: Response) => {
  const { items, totalAmount, paymentMethod, shippingAddress } = req.body;

  try {
    // Basic stock check could go here
    const order = await Order.create({
      buyerId: req.user?.id,
      items,
      totalAmount,
      paymentMethod,
      shippingAddress,
      status: 'pending'
    });

    // Update stock for each item
    for (const item of items) {
      await Product.findByIdAndUpdate(item.id, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ buyerId: req.user?.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
