import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'buyer' | 'vendor' | 'admin' | 'customer_support' | 'sales_manager';
  createdAt: Date;
  phoneNumber?: string;
  bio?: string;
  hasPendingVendorApplication?: boolean;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

const UserSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  photoURL: { type: String },
  role: { 
    type: String, 
    enum: ['buyer', 'vendor', 'admin', 'customer_support', 'sales_manager'],
    default: 'buyer'
  },
  phoneNumber: { type: String },
  bio: { type: String },
  hasPendingVendorApplication: { type: Boolean, default: false },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
