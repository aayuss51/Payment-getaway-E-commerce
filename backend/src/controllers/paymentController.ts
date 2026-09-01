import { Request, Response } from 'express';

export const initiatePayment = (req: Request, res: Response) => {
  const { amount, orderId, method } = req.body;
  res.json({
    success: true,
    paymentUrl: `https://mock-payment.com/${method}?orderId=${orderId}&amount=${amount}`,
    transactionId: `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  });
};
