import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  buyerId: string;
  items: {
    id: string;
    vendorId: string;
    name: string;
    price: number;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
    selectedVariantId?: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingAddress: any;
  landedCostDetails?: {
    shippingFee: number;
    exportDuty: number;
    importTax: number;
    totalLandedCost: number;
    currency: string;
  };
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  isReviewed?: boolean;
}

const OrderSchema: Schema = new Schema({
  buyerId: { type: String, required: true },
  items: [{
    id: String,
    vendorId: String,
    name: String,
    price: Number,
    quantity: Number,
    selectedColor: String,
    selectedSize: String,
    selectedVariantId: String
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: { type: String, required: true },
  shippingAddress: { type: Schema.Types.Mixed, required: true },
  landedCostDetails: {
    shippingFee: Number,
    exportDuty: Number,
    importTax: Number,
    totalLandedCost: Number,
    currency: String
  },
  trackingNumber: { type: String },
  carrier: { type: String },
  trackingUrl: { type: String },
  isReviewed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);
