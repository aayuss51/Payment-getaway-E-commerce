import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  vendorId: string;
  vendorName?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  status: 'active' | 'draft' | 'out_of_stock';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isFeatured?: boolean;
  brand?: string;
  variants?: {
    id: string;
    name: string;
    priceDifference: number;
    stock: number;
  }[];
  colors?: string[];
  sizes?: string[];
  embedding?: number[];
  modelUrl?: string;
  videoUrl?: string;
  weight?: number;
  hsCode?: string;
  rating?: number;
  reviewsCount?: number;
  seo?: {
    title: string;
    description: string;
  };
}

const ProductSchema: Schema = new Schema({
  vendorId: { type: String, required: true },
  vendorName: { type: String },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['active', 'draft', 'out_of_stock'],
    default: 'draft'
  },
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isFeatured: { type: Boolean, default: false },
  brand: { type: String },
  variants: [{
    id: String,
    name: String,
    priceDifference: Number,
    stock: Number
  }],
  colors: [String],
  sizes: [String],
  embedding: [Number],
  modelUrl: { type: String },
  videoUrl: { type: String },
  weight: { type: Number },
  hsCode: { type: String },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  seo: {
    title: String,
    description: String
  }
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
