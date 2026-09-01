import { Response } from 'express';
import Vendor from '../models/Vendor';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

export const applyVendor = async (req: AuthRequest, res: Response) => {
  const { storeName, legalName, panNumber, description } = req.body;

  try {
    const existingVendor = await Vendor.findOne({ uid: req.user?.id });
    if (existingVendor) {
      return res.status(400).json({ error: "Vendor application already exists" });
    }

    const vendor = await Vendor.create({
      uid: req.user?.id,
      storeName,
      legalName,
      panNumber,
      description,
      storeSlug: storeName.toLowerCase().replace(/ /g, '-'),
      status: 'pending'
    });

    // Update user's pending status
    await User.findByIdAndUpdate(req.user?.id, { hasPendingVendorApplication: true });

    res.status(201).json(vendor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getVendorDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await Vendor.findOne({ uid: req.user?.id });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    // Mock dashboard stats for now
    res.json({
      vendor,
      stats: {
        totalOrders: 0,
        activeProducts: 0,
        monthlyEarnings: 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
