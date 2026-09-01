import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  uid: string;
  vendorId?: string;
  storeName: string;
  legalName: string;
  panNumber: string;
  storeSlug: string;
  description: string;
  shopLocation?: string;
  logoUrl?: string;
  bannerUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  adminNotes?: string;
  kycDetails?: any;
  commissionRate: number;
  balance: number;
  totalEarnings: number;
  createdAt: Date;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  category?: string;
  isTopRated?: boolean;
  topRatedImageUrl?: string;
  approvedAt?: Date;
  isOnline?: boolean;
  whatsappNumber?: string;
  rating?: number;
  reviewsCount?: number;
  avgResponseTime?: string;
  deliveryMethod?: 'platform' | 'self';
  verificationStatus?: 'pending' | 'verified' | 'flagged';
  esewaId?: string;
  khaltiId?: string;
  panDetails?: {
    extractedPan?: string;
    extractedBusinessName?: string;
    verificationDate?: string;
    flags?: string[];
  };
  sliderImages?: {
    url: string;
    link?: string;
    title?: string;
    description?: string;
  }[];
  getawayMessages?: {
    id: string;
    keyword: string;
    message: string;
  }[];
}

const VendorSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true },
  vendorId: { type: String },
  storeName: { type: String, required: true },
  legalName: { type: String, required: true },
  panNumber: { type: String, required: true },
  storeSlug: { type: String, required: true, unique: true },
  description: { type: String },
  shopLocation: { type: String },
  logoUrl: { type: String },
  bannerUrl: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  adminNotes: { type: String },
  kycDetails: { type: Schema.Types.Mixed },
  commissionRate: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  contactEmail: { type: String },
  contactPhone: { type: String },
  category: { type: String },
  isTopRated: { type: Boolean, default: false },
  topRatedImageUrl: { type: String },
  approvedAt: { type: Date },
  isOnline: { type: Boolean, default: false },
  whatsappNumber: { type: String },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  avgResponseTime: { type: String },
  deliveryMethod: { type: String, enum: ['platform', 'self'], default: 'platform' },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'flagged'], default: 'pending' },
  esewaId: { type: String },
  khaltiId: { type: String },
  panDetails: {
    extractedPan: String,
    extractedBusinessName: String,
    verificationDate: Date,
    flags: [String]
  },
  sliderImages: [{
    url: String,
    link: String,
    title: String,
    description: String
  }],
  getawayMessages: [{
    id: String,
    keyword: String,
    message: String
  }]
}, { timestamps: true });

export default mongoose.model<IVendor>('Vendor', VendorSchema);
