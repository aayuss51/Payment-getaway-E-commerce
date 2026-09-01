export type UserRole = 'buyer' | 'vendor' | 'admin' | 'customer_support' | 'sales_manager';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
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

export interface VendorStore {
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
  createdAt?: string;
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
  approvedAt?: string;
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

export interface Payout {
  id: string;
  vendorId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: string;
  accountDetails: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  priceDifference: number;
  stock: number;
}

export interface Product {
  id: string;
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
  variants?: ProductVariant[];
  colors?: string[];
  sizes?: string[];
  embedding?: number[];
  modelUrl?: string;
  videoUrl?: string;
  weight?: number; // in kg
  hsCode?: string; // Harmonized System code for customs
  rating?: number;
  reviewsCount?: number;
  seo?: {
    title: string;
    description: string;
  };
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariantId?: string;
}

export interface Order {
  id: string;
  buyerId: string;
  items: CartItem[];
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
  createdAt: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  isReviewed?: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  vendorId: string;
  buyerId: string;
  buyerName: string;
  buyerPhoto?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  vendorId: string;
  orderId?: string;
  payoutId?: string;
  amount: number;
  type: 'sale' | 'payout' | 'adjustment' | 'refund';
  status: 'pending' | 'cleared' | 'failed';
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatThread {
  id: string;
  participants: string[];
  userId: string;
  vendorId: string;
  userName: string;
  vendorName: string;
  lastMessage: string;
  lastMessageAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  participants: string[];
  text: string;
  sender: string;
  senderType: 'user' | 'vendor' | 'bot';
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  metadata?: any;
}
