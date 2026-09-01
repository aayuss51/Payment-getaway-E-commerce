import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  orderBy, 
  runTransaction 
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { uploadImage } from '../lib/storage';
import { BackButton } from '../components/BackButton';
import { Product, Order, ProductVariant, Payout, VendorStore, Notification } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { VendorLayout } from '../components/vendor/VendorLayout';
import { EarningsDashboard } from '../components/vendor/EarningsDashboard';
import { ProductUpload } from '../components/vendor/ProductUpload';
import { DeliverySettings } from '../components/vendor/DeliverySettings';
import { ShareKit } from '../components/vendor/ShareKit';
import { PaymentGatewaySettings } from '../components/vendor/PaymentGatewaySettings';
import { OrderHistory } from '../components/vendor/OrderHistory';
import { VendorSupport } from '../components/vendor/VendorSupport';
import { VendorReviews } from '../components/vendor/VendorReviews';
import { ChatList } from '../components/chat/ChatList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { chatService } from '../services/chatService';
import { ChatThread } from '../types';
import { 
  Plus, 
  Package, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  X, 
  Save,
  Shield,
  ShieldCheck,
  ShieldX,
  Zap,
  AlertCircle,
  Bell,
  Loader2,
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Settings,
  Store,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  Sparkles,
  Star,
  Truck,
  XCircle,
  Eye,
  Image as ImageIcon,
  Layers,
  Wallet,
  Building2,
  LogOut,
  Camera,
  Scissors,
  ZoomIn,
  ZoomOut,
  Wand2
} from 'lucide-react';
import { ImageUploadManager } from '../components/ImageUploadManager';
import { GoogleGenAI } from "@google/genai";

const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const configs = {
    pending: { icon: Clock, color: 'bg-indigo-50 text-indigo-700', label: 'Pending' },
    paid: { icon: CheckCircle, color: 'bg-red-100 text-red-700', label: 'Paid' },
    processing: { icon: Loader2, color: 'bg-indigo-100 text-indigo-700', label: 'Processing' },
    shipped: { icon: Truck, color: 'bg-purple-100 text-purple-700', label: 'Shipped' },
    delivered: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700', label: 'Delivered' },
    cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelled' },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black   ${config.color}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
};

export const VendorDashboard = () => {
  const { t } = useTranslation();
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const [vendorProfile, setVendorProfile] = useState<VendorStore | null>(null);
  
  // Animation/Onboarding State
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);

  useEffect(() => {
    if (location.state?.justRegistered) {
      setShowFirstTimeModal(true);
    } else {
      setShowWelcome(true);
      const timer = setTimeout(() => {
        setIsAnimationFinished(true);
        setShowWelcome(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [vendorDocId, setVendorDocId] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageEditingProduct, setImageEditingProduct] = useState<Product | null>(null);
  const [imageFormData, setImageFormData] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [vendorChats, setVendorChats] = useState<ChatThread[]>([]);
  const [activeVendorChat, setActiveVendorChat] = useState<ChatThread | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Cropping State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropType, setCropType] = useState<'logo' | 'banner'>('logo');

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<File> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No 2d context'));
          return;
        }
        
        // Use different sizes for logo vs banner
        const MAX_SIZE = cropType === 'logo' ? 800 : 1920;
        let targetWidth = pixelCrop.width;
        let targetHeight = pixelCrop.height;
        
        if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / targetWidth, MAX_SIZE / targetHeight);
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          targetWidth,
          targetHeight
        );
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
          resolve(file);
        }, 'image/jpeg', 0.8);
      };
      image.onerror = () => reject(new Error('Failed to load image'));
    });
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setIsCropping(false);
    setIsUploading(true);
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const downloadURL = await uploadImage(croppedImage, `vendors/${user?.uid}`);
      
      let updatedData = {};
      if (cropType === 'logo') {
        updatedData = { logoUrl: downloadURL };
        setSettingsFormData(prev => ({ ...prev, logoUrl: downloadURL }));
      } else {
        updatedData = { bannerUrl: downloadURL };
        setSettingsFormData(prev => ({ ...prev, bannerUrl: downloadURL }));
      }
      
      // Automatically update the document for seamless experience
      if (vendorDocId) {
        await updateDoc(doc(db, 'vendors', vendorDocId), updatedData);
        setVendorProfile(prev => prev ? { ...prev, ...updatedData } : null);
      }
    } catch (err: any) {
      console.error('Crop/Upload error:', err);
      setError(err.message || "Failed to process image.");
    } finally {
      setIsUploading(false);
      setImageToCrop(null);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropType('logo');
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropType('banner');
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  // Payout Form State
  const [payoutFormData, setPayoutFormData] = useState({
    amount: 0,
    method: 'bank_transfer' as 'bank_transfer' | 'esewa' | 'khalti',
    details: '',
    frequency: 'monthly' as 'monthly' | 'weekly'
  });

  // Filtering state
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'draft' | 'low_stock'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All Categories');

  // Sorting state for payouts
  const [payoutSort, setPayoutSort] = useState<{ field: 'createdAt' | 'amount'; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc'
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Fashion',
    stock: 0,
    images: [] as string[],
    status: 'active' as 'active' | 'draft',
    variants: [] as ProductVariant[],
    seo: {
      title: '',
      description: ''
    }
  });

  const [settingsFormData, setSettingsFormData] = useState({
    storeName: '',
    description: '',
    category: 'Fashion',
    logoUrl: '',
    bannerUrl: '',
    contactEmail: '',
    contactPhone: '',
    whatsappNumber: '',
    shopLocation: '',
    commissionRate: 0,
    isOnline: false,
    getawayMessages: [] as { id: string; keyword: string; message: string }[],
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    sliderImages: [] as { url: string; link?: string; title?: string; description?: string }[]
  });

  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(productSearchQuery.toLowerCase());
      
      let matchesStatus = true;
      if (productStatusFilter === 'low_stock') {
        matchesStatus = p.stock <= 5 && p.status === 'active';
      } else if (productStatusFilter !== 'all') {
        matchesStatus = p.status === productStatusFilter;
      }

      const matchesCategory = productCategoryFilter === 'All Categories' || p.category === productCategoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, productSearchQuery, productStatusFilter, productCategoryFilter]);

  const lowStockProducts = React.useMemo(() => {
    return products.filter(p => p.stock <= 5 && p.status === 'active');
  }, [products]);

  useEffect(() => {
    if (user) {
      fetchVendorData();
      
      // Subscribe to vendor chats
      const unsubscribe = chatService.subscribeToVendorChats(user.uid, (fetchedChats) => {
        setVendorChats(fetchedChats);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const overallRating = React.useMemo(() => {
    if (vendorProfile?.rating) return vendorProfile.rating;
    const ratedProducts = products.filter(p => p.rating && p.rating > 0);
    if (ratedProducts.length === 0) return 0;
    const sum = ratedProducts.reduce((acc, p) => acc + (p.rating || 0), 0);
    return (sum / ratedProducts.length).toFixed(1);
  }, [vendorProfile, products]);

  const fetchVendorData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch vendor profile
      const pathVendors = 'vendors';
      try {
        const vendorRef = doc(db, pathVendors, user.uid);
        const vendorSnap = await getDoc(vendorRef);
        
        if (vendorSnap.exists()) {
          const data = vendorSnap.data() as VendorStore;
          setVendorProfile(data);
          setVendorDocId(user.uid);
          setSettingsFormData({
            storeName: data.storeName,
            description: data.description || '',
            category: data.category || 'Fashion',
            logoUrl: data.logoUrl || '',
            bannerUrl: data.bannerUrl || '',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone || '',
            whatsappNumber: data.whatsappNumber || '',
            shopLocation: data.shopLocation || '',
            commissionRate: data.commissionRate || 0,
            isOnline: data.isOnline || false,
            getawayMessages: data.getawayMessages || [],
            shippingAddress: data.shippingAddress || {
              street: '',
              city: '',
              state: '',
              zip: ''
            },
            sliderImages: data.sliderImages || []
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `${pathVendors}/${user.uid}`);
      }

      // 2. Fetch products
      const pathProducts = 'products';
      try {
        const q = query(collection(db, pathProducts), where('vendorId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(fetched);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, pathProducts);
      }

      // 3. Fetch payouts
      const pathPayouts = 'payouts';
      try {
        const payoutsQuery = query(collection(db, pathPayouts), where('vendorId', '==', user.uid), orderBy('createdAt', 'desc'));
        const payoutsSnapshot = await getDocs(payoutsQuery);
        const fetchedPayouts = payoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
        setPayouts(fetchedPayouts);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, pathPayouts);
      }

      // 4. Fetch orders
      const pathOrders = 'orders';
      try {
        const ordersQuery = query(
          collection(db, pathOrders), 
          where('vendorIds', 'array-contains', user.uid),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const fetchedOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(fetchedOrders);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, pathOrders);
      }

      // 5. Fetch notifications
      const pathNotifications = 'notifications';
      try {
        const notificationsQuery = query(
          collection(db, pathNotifications),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const fetchedNotifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(fetchedNotifications);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, pathNotifications);
      }
    } catch (err) {
      console.error("Critical error in fetchVendorData:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || (showWelcome && !isAnimationFinished)) {
    return (
      <AnimatePresence>
        {showWelcome && !isAnimationFinished ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-center space-y-4"
            >
              <motion.div 
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 bg-secondary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6"
              >
                <Store className="w-12 h-12 text-secondary" />
              </motion.div>
              <h1 className="text-5xl font-serif italic text-primary ">Welcome to Bazaar</h1>
              <p className="text-[10px] font-black text-secondary  ">Your Premium Store Dashboard</p>
            </motion.div>
          </motion.div>
        ) : (
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-secondary animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading your dashboard...</p>
          </div>
        )}
      </AnimatePresence>
    );
  }

  if (!vendorProfile && !profile?.hasPendingVendorApplication) {
    return <Navigate to="/become-vendor" replace />;
  }

  if (!vendorProfile || vendorProfile.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-24 h-24 bg-orange-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <Clock className="w-12 h-12 text-orange-500" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">Application Under Review</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
          Your vendor application for <span className="font-bold text-gray-900">"{vendorProfile?.storeName || 'your store'}"</span> is currently being reviewed by our team. 
          This process usually takes 24-48 hours.
        </p>
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 inline-block text-left">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" /> What happens next?
          </h3>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>• We verify your PAN card and business registration.</li>
            <li>• Once approved, you'll get full access to list products.</li>
            <li>• You'll receive an email notification of the decision.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (vendorProfile.status === 'rejected') {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <X className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">Application Rejected</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
          Unfortunately, your vendor application was not approved at this time. 
          Please check your email for more details and instructions on how to re-apply.
        </p>
        <button 
          onClick={() => window.location.href = '/become-vendor'}
          className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold hover:bg-secondary/80 transition-all shadow-xl shadow-secondary/20"
        >
          Re-apply Now
        </button>
      </div>
    );
  }

  const fetchVendorProducts = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'products'), where('vendorId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(fetched);
    } catch (err) {
      console.error("Error fetching vendor products:", err);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        images: product.images,
        status: product.status as 'active' | 'draft',
        variants: product.variants || [],
        seo: product.seo || { title: '', description: '' }
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: 'Fashion',
        stock: 0,
        images: [],
        status: 'active',
        variants: [],
        seo: { title: '', description: '' }
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenImageModal = (product: Product) => {
    setImageEditingProduct(product);
    setImageFormData(product.images);
    setIsImageModalOpen(true);
  };

  const handleSaveImages = async () => {
    if (!imageEditingProduct) return;
    setIsSaving(true);
    try {
      const productRef = doc(db, 'products', imageEditingProduct.id);
      await updateDoc(productRef, {
        images: imageFormData
      });
      setProducts(products.map(p => p.id === imageEditingProduct.id ? { ...p, images: imageFormData } : p));
      setIsImageModalOpen(false);
    } catch (err) {
      console.error("Error updating images:", err);
      setError("Failed to update images. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorDocId) return;
    setIsSaving(true);
    setError(null);
    try {
      const vendorRef = doc(db, 'vendors', vendorDocId);
      await updateDoc(vendorRef, settingsFormData);
      setVendorProfile({ ...vendorProfile!, ...settingsFormData });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("Failed to update settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setError(null);

    try {
      const productData = {
        ...formData,
        vendorId: user.uid,
        vendorName: user.displayName || 'Vendor',
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          approvalStatus: 'pending',
          createdAt: new Date().toISOString()
        });
      }

      await fetchVendorProducts();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeatured = async (productId: string, currentStatus: boolean) => {
    setProcessingId(productId);
    const path = `products/${productId}`;
    try {
      await updateDoc(doc(db, 'products', productId), { isFeatured: !currentStatus });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, isFeatured: !currentStatus } : p));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproval = async (productId: string, status: 'approved' | 'rejected') => {
    if (!isAdmin) return;
    setProcessingId(productId);
    const path = `products/${productId}`;
    try {
      await updateDoc(doc(db, 'products', productId), { approvalStatus: status });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, approvalStatus: status } : p));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setProcessingId(null);
    }
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      priceDifference: 0,
      stock: 0
    };
    setFormData({ ...formData, variants: [...formData.variants, newVariant] });
  };

  const removeVariant = (id: string) => {
    setFormData({ ...formData, variants: formData.variants.filter(v => v.id !== id) });
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
    });
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !vendorProfile || !vendorDocId) return;
    
    if (payoutFormData.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (payoutFormData.amount > vendorProfile.balance) {
      setError("Insufficient balance");
      return;
    }

    setIsRequestingPayout(true);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const vendorRef = doc(db, 'vendors', vendorDocId);
        const vendorSnap = await transaction.get(vendorRef);
        
        if (!vendorSnap.exists()) {
          throw new Error("Vendor profile not found");
        }

        const currentBalance = vendorSnap.data().balance || 0;
        if (payoutFormData.amount > currentBalance) {
          throw new Error("Insufficient balance");
        }

        // 1. Create payout record
        const payoutRef = doc(collection(db, 'payouts'));
        const payoutData = {
          vendorId: user.uid,
          amount: payoutFormData.amount,
          method: payoutFormData.method,
          accountDetails: payoutFormData.details,
          frequency: payoutFormData.frequency,
          commissionRate: 12, // Fixed 12% commission as requested
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        transaction.set(payoutRef, payoutData);

        // 2. Update vendor balance
        const newBalance = currentBalance - payoutFormData.amount;
        transaction.update(vendorRef, {
          balance: newBalance
        });

        // 3. Create a transaction record for the ledger
        const transactionRef = doc(collection(db, 'transactions'));
        transaction.set(transactionRef, {
          vendorId: user.uid,
          amount: payoutFormData.amount,
          type: 'payout',
          status: 'pending',
          payoutId: payoutRef.id,
          description: `Payout Request - ${payoutFormData.method.replace(/_/g, ' ')}`,
          createdAt: new Date().toISOString()
        });

        // Update local state after transaction succeeds
        setVendorProfile({ ...vendorProfile, balance: newBalance });
      });

      // 4. Refresh payouts
      const payoutsQuery = query(collection(db, 'payouts'), where('vendorId', '==', user.uid), orderBy('createdAt', 'desc'));
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const fetchedPayouts = payoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
      setPayouts(fetchedPayouts);

      setIsPayoutModalOpen(false);
      setPayoutFormData({ amount: 0, method: 'bank_transfer', details: '', frequency: 'monthly' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error requesting payout:", err);
      setError(err.message || "Failed to request payout");
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const handleUpdateDelivery = async (method: 'platform' | 'self') => {
    if (!vendorDocId) return;
    try {
      await updateDoc(doc(db, 'vendors', vendorDocId), { deliveryMethod: method });
      setVendorProfile(prev => prev ? { ...prev, deliveryMethod: method } : null);
    } catch (err) {
      console.error("Error updating delivery method:", err);
    }
  };

  const handleUpdateGateways = (data: Partial<VendorStore>) => {
    setVendorProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      await fetchVendorProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const generateAIDescription = async () => {
    if (!formData.name || !formData.category) {
      setError("Please provide a product name and category first.");
      return;
    }

    setIsGeneratingDescription(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey || '' });
      const promptText = `Generate a detailed, engaging, and professional product description for a product named "${formData.name}" in the category "${formData.category}". The description should highlight key features, benefits, and appeal to potential customers. Keep it concise but informative (around 100-150 words).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptText,
      });

      if (response.text) {
        setFormData(prev => ({ ...prev, description: response.text }));
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setError("Failed to generate description. Please try again or write it manually.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  return (
    <VendorLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      commissionRate={vendorProfile?.commissionRate || 12}
      notifications={notifications}
      lowStockProducts={lowStockProducts}
      onMarkRead={markAsRead}
    >
      <div className="space-y-12">
        {activeTab === 'notifications' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
              <h2 className="text-4xl font-serif italic text-primary ">Notifications</h2>
              <p className="text-[10px] font-bold text-secondary   mt-2 px-1">Stay updated with system alerts and messages</p>
            </header>

            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="bg-paper p-12 rounded-[2.5rem] lux-border lux-shadow text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-serif italic text-primary">All caught up!</h3>
                  <p className="text-gray-400 mt-2">You don't have any new notifications at the moment.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div 
                    key={notification.id}
                    layoutId={notification.id}
                    className={`relative p-6 rounded-[2rem] lux-border lux-shadow flex gap-6 transition-all duration-500 overflow-hidden ${
                      notification.read ? 'bg-gray-50/50 grayscale-[0.2]' : 'bg-white'
                    }`}
                  >
                    {!notification.read && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-secondary" />
                    )}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      notification.type === 'info' ? 'bg-red-50 text-red-600' :
                      notification.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                      notification.type === 'error' ? 'bg-red-50 text-red-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      <Bell className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-black  ${notification.read ? 'text-gray-500' : 'text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400   shrink-0">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${notification.read ? 'text-gray-400' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="mt-4 text-[10px] font-black   text-secondary hover:text-secondary/80 underline underline-offset-4"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">{t('financial_overview')}</h1>
                <p className="text-[10px] font-bold text-secondary   mt-2">{t('track_earnings')}</p>
              </header>
              <BackButton />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:scale-[1.02] transition-all duration-700"
              >
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-secondary transition-all">
                  <TrendingUp className="w-6 h-6 text-secondary group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400   mb-1">{t('total_earnings')}</p>
                  <h3 className="text-xl font-black text-gray-900 ">NPR {(vendorProfile?.totalEarnings || 0).toLocaleString()}</h3>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:scale-[1.02] transition-all duration-700"
              >
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-red-600 transition-all">
                  <DollarSign className="w-6 h-6 text-red-600 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400   mb-1">{t('current_balance')}</p>
                  <h3 className="text-xl font-black text-gray-900 ">NPR {(vendorProfile?.balance || 0).toLocaleString()}</h3>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setActiveTab('orders')}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-secondary/30 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all">
                  <ShoppingBag className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400   mb-1">Total Orders</p>
                  <h3 className="text-xl font-black text-gray-900 ">{orders.length}</h3>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setActiveTab('reviews')}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-secondary/30 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400   mb-1">Overall Rating</p>
                  <h3 className="text-xl font-black text-gray-900  flex items-center gap-2">
                    {vendorProfile?.rating || overallRating}
                    <span className="text-secondary text-sm">★</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">{vendorProfile?.reviewsCount || 0} reviews</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-secondary/30 transition-all"
              >
      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-secondary transition-all">
        <Clock className="w-6 h-6 text-emerald-600 group-hover:text-white" />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400   mb-1">Avg Response</p>
        <h3 className="text-xl font-black text-gray-900 ">{vendorProfile?.avgResponseTime || '2h'}</h3>
      </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-secondary/30 transition-all"
              >
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400   mb-1">Active Products</p>
                  <h3 className="text-xl font-black text-gray-900 ">{products.filter(p => p.status === 'active').length}</h3>
                </div>
              </motion.div>
            </div>

            {/* Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-gray-900  flex items-center gap-3">
                    Stock Alerts
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-md  ">
                      {lowStockProducts.length}
                    </span>
                  </h2>
                  <button 
                    onClick={() => setActiveTab('products')}
                    className="text-sm font-black text-secondary hover:text-secondary/80 transition-colors flex items-center gap-2 group"
                  >
                    Manage Inventory <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-6 rounded-[2rem] border border-red-100 shadow-sm flex items-center gap-4 group hover:border-red-200 transition-all cursor-pointer"
                      onClick={() => handleOpenModal(product)}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                        <img 
                          src={product.images[0] || 'https://picsum.photos/seed/placeholder/200/200'} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          alt={product.name}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          <span className="text-xs font-black text-red-600  ">
                            {product.stock === 0 ? 'Out of Stock' : `${product.stock} Left in Stock`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <button 
                      onClick={() => setActiveTab('products')}
                      className="bg-gray-50 p-6 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-all group"
                    >
                      <span className="text-sm font-black text-gray-400   group-hover:text-gray-600">
                        +{lowStockProducts.length - 3} More Alerts
                      </span>
                      <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Recent Payouts Summary */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900 ">Recent Payouts</h2>
                <button 
                  onClick={() => setActiveTab('earnings')}
                  className="text-sm font-black text-secondary hover:text-secondary/80 transition-colors flex items-center gap-2 group"
                >
                  View All Payouts <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-50">
                  {payouts.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <DollarSign className="w-8 h-8" />
                      </div>
                      <p className="text-gray-400 font-bold">No payouts recorded yet.</p>
                    </div>
                  ) : (
                    payouts.slice(0, 3).map((payout) => (
                      <div key={payout.id} className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            payout.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                            payout.status === 'pending' ? 'bg-red-50 text-secondary' : 'bg-red-50 text-red-600'
                          }`}>
                            <DollarSign className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-lg font-black text-gray-900 ">NPR {payout.amount.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 font-bold   mt-0.5">
                              {new Date(payout.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black   ${
                          payout.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                          payout.status === 'pending' ? 'bg-red-50 text-secondary' : 'bg-red-50 text-red-600'
                        }`}>
                          {payout.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 w-full">
                <div>
                  <h1 className="text-4xl font-black text-gray-900 ">My Products</h1>
                  <p className="text-gray-500 font-medium mt-1">
                    {filteredProducts.length !== products.length ? (
                      `Showing ${filteredProducts.length} of ${products.length} products`
                    ) : (
                      `You have ${products.length} products listed.`
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <BackButton />
                  <button 
                    onClick={() => handleOpenModal()}
                    className="bg-secondary text-white px-8 py-4 rounded-2xl font-black text-[10px]   transition-all flex items-center gap-2 shadow-xl shadow-secondary/10"
                  >
                    <Plus className="w-5 h-5" /> Add Product
                  </button>
                </div>
              </header>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                />
              </div>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
                {(['all', 'active', 'draft', 'low_stock'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setProductStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold   transition-all ${
                      productStatusFilter === status
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <select 
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-white border border-gray-100 rounded-2xl px-6 py-3 font-bold text-gray-600 focus:ring-2 focus:ring-secondary transition-all"
              >
                <option>All Categories</option>
                <option>Fashion</option>
                <option>Electronics</option>
                <option>Home Decor</option>
                <option>Food & Beverage</option>
                <option>Beauty</option>
              </select>

              {(productSearchQuery || productStatusFilter !== 'all' || productCategoryFilter !== 'All Categories') && (
                <button 
                  onClick={() => {
                    setProductSearchQuery('');
                    setProductStatusFilter('all');
                    setProductCategoryFilter('All Categories');
                  }}
                  className="px-4 py-2 text-sm font-bold text-secondary hover:text-secondary/80 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Product</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Category</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Price</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Stock</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Featured</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400   text-right px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <Loader2 className="w-10 h-10 text-secondary animate-spin mx-auto" />
                        <p className="text-gray-400 mt-4 font-medium">Loading your products...</p>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <Package className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">No products found</h3>
                        <p className="text-gray-400 mt-1">Try adjusting your filters or add a new product!</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200">
                              <img 
                                src={product.images[0] || 'https://picsum.photos/seed/placeholder/200/200'} 
                                className="w-full h-full object-cover"
                                alt={product.name}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{product.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono  er">ID: {product.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold  ">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-gray-900">NPR {product.price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-secondary' : 'bg-orange-500'}`} />
                            <span className="font-bold text-gray-700">{product.stock}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleFeatured(product.id, !!product.isFeatured)}
                              disabled={processingId === product.id}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                product.isFeatured ? 'bg-secondary' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  product.isFeatured ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            {product.isFeatured && <Zap className="w-3 h-3 text-secondary fill-current" />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black   ${
                              product.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              product.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-red-100 text-secondary'
                            }`}>
                              {product.approvalStatus === 'approved' ? <ShieldCheck className="w-3 h-3" /> :
                               product.approvalStatus === 'rejected' ? <ShieldX className="w-3 h-3" /> :
                               <Clock className="w-3 h-3" />}
                              {product.approvalStatus || 'pending'}
                            </span>
                            
                            {isAdmin && product.approvalStatus === 'pending' && (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleApproval(product.id, 'approved')}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                  title="Approve"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleApproval(product.id, 'rejected')}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Reject"
                                >
                                  <ShieldX className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 transition-opacity">
                            <button 
                              onClick={() => handleOpenModal(product)}
                              className="p-2 text-gray-400 rounded-lg transition-all"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenImageModal(product)}
                              className="p-2 text-gray-400 rounded-lg transition-all"
                              title="Edit Images"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-gray-400 rounded-lg transition-all"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Orders Management</h1>
                <p className="text-gray-500 font-medium mt-1">Manage and fulfill your customer orders.</p>
              </header>
              <BackButton />
            </div>
            
            <OrderHistory 
              orders={orders} 
              vendorId={user?.uid || ''} 
              onViewDetails={setSelectedOrder} 
            />
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Earnings & Payouts</h1>
                <p className="text-gray-500 font-medium mt-1">Manage your withdrawals and view transaction history.</p>
              </header>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="bg-secondary text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-xl"
                  >
                  <DollarSign className="w-6 h-6" /> Request Payout
                </button>
                <BackButton />
              </div>
            </div>
            <EarningsDashboard 
              vendorProfile={vendorProfile} 
              payouts={payouts} 
              orders={orders} 
              onRequestPayout={() => setIsPayoutModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Logistics & Delivery</h1>
                <p className="text-gray-500 font-medium mt-1">Configure how you deliver products to your customers.</p>
              </header>
              <BackButton />
            </div>
            <DeliverySettings 
              currentMethod={vendorProfile?.deliveryMethod || 'platform'} 
              onUpdate={handleUpdateDelivery} 
            />
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Marketing Kit</h1>
                <p className="text-gray-500 font-medium mt-1">Tools to help you grow your business and reach more customers.</p>
              </header>
              <BackButton />
            </div>
            <ShareKit vendorProfile={vendorProfile} />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Customer Reviews</h1>
                <p className="text-gray-500 font-medium mt-1">See what your customers are saying about your store.</p>
              </header>
              <div className="flex items-center gap-4">
                <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                  <Star className="w-5 h-5 text-secondary fill-current" />
                  <span className="text-xl font-black text-gray-900">{vendorProfile?.rating || '0.0'}</span>
                  <span className="text-gray-400 text-sm font-medium">({vendorProfile?.reviewsCount || 0} reviews)</span>
                </div>
                <BackButton />
              </div>
            </div>
            <VendorReviews vendorId={user?.uid || ''} />
          </div>
        )}

        {activeTab === 'store-profile' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Store Profile</h1>
                <p className="text-gray-500 font-medium mt-1">Customise how your store looks to your customers.</p>
              </header>
              <BackButton />
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
               {/* Banner Section */}
               <div className="relative h-64 sm:h-80 bg-gray-100 group">
                  {settingsFormData.bannerUrl ? (
                    <img 
                      src={settingsFormData.bannerUrl} 
                      alt="Store Banner" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => bannerInputRef.current?.click()}
                      className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-gray-900 shadow-xl flex items-center gap-3 transition-all"
                    >
                      <Camera className="w-5 h-5" /> Edit Header Photo
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={bannerInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleBannerUpload} 
                  />
               </div>

               {/* Profile Info Overlay */}
               <div className="px-12 -mt-16 sm:-mt-20 pb-12 relative flex flex-col md:flex-row items-end justify-between gap-8">
                  <div className="flex flex-col md:flex-row items-end gap-6 text-center md:text-left">
                    <div className="relative group/logo">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl border border-gray-100 overflow-hidden">
                        {settingsFormData.logoUrl ? (
                          <img src={settingsFormData.logoUrl} className="w-full h-full object-cover rounded-[1.8rem]" alt="Logo" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-gray-50 rounded-[1.8rem] flex items-center justify-center">
                             <Store className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => logoInputRef.current?.click()}
                        className="absolute bottom-2 right-2 p-3 bg-white text-gray-900 rounded-full shadow-lg border border-gray-100 transition-all"
                      >
                         <Camera className="w-5 h-5" />
                      </button>
                      <input 
                        type="file" 
                        ref={logoInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                      />
                    </div>

                    <div className="mb-4">
                      <h2 className="text-3xl font-black text-white">{settingsFormData.storeName}</h2>
                      <p className="text-white/70 font-medium">{settingsFormData.category}</p>
                    </div>
                  </div>

                  <div className="mb-4 flex gap-4">
                    <button 
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="bg-secondary text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
               </div>
            </div>
            
            {/* Store Description / Additional Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-sm font-black text-gray-400  ">About the Store</h3>
                  <textarea 
                    value={settingsFormData.description}
                    onChange={(e) => setSettingsFormData({...settingsFormData, description: e.target.value})}
                    rows={6}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-secondary transition-all resize-none"
                    placeholder="Tell your customers about your heritage, your mission, and what makes your store special..."
                  />
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-gray-400  ">Hero Slider Images</h3>
                      <p className="text-gray-500 text-xs font-medium mt-1">Manage banners for your storefront hero section.</p>
                    </div>
                    <div className="bg-secondary/10 px-4 py-2 rounded-xl">
                      <span className="text-[10px] font-black text-secondary  ">Max 5 Images</span>
                    </div>
                  </div>
                  
                  <ImageUploadManager 
                    images={settingsFormData.sliderImages.map(img => img.url)}
                    onChange={(urls) => {
                      const newSliderImages = urls.map(url => {
                        const existing = settingsFormData.sliderImages.find(img => img.url === url);
                        return existing || { url, link: '', title: '', description: '' };
                      });
                      setSettingsFormData({ ...settingsFormData, sliderImages: newSliderImages });
                    }}
                    maxImages={5}
                    path={`vendors/${user?.uid}/sliders`}
                  />

                  {settingsFormData.sliderImages.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 pt-4">
                      {settingsFormData.sliderImages.map((img, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 items-start sm:items-center group/slider">
                          <div className="w-32 h-20 rounded-[1.5rem] overflow-hidden border border-gray-100 shrink-0">
                            <img src={img.url} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400  ">Title</label>
                              <input 
                                type="text"
                                placeholder="Summer Sale"
                                value={img.title || ''}
                                onChange={(e) => {
                                  const newSliders = [...settingsFormData.sliderImages];
                                  newSliders[idx] = { ...newSliders[idx], title: e.target.value };
                                  setSettingsFormData({ ...settingsFormData, sliderImages: newSliders });
                                }}
                                className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400  ">Link</label>
                              <input 
                                type="text"
                                placeholder="/shop"
                                value={img.link || ''}
                                onChange={(e) => {
                                  const newSliders = [...settingsFormData.sliderImages];
                                  newSliders[idx] = { ...newSliders[idx], link: e.target.value };
                                  setSettingsFormData({ ...settingsFormData, sliderImages: newSliders });
                                }}
                                className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none font-bold"
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <label className="text-[10px] font-black text-gray-400  ">Description</label>
                              <textarea 
                                placeholder="Exclusive offer for this week only..."
                                rows={2}
                                value={img.description || ''}
                                onChange={(e) => {
                                  const newSliders = [...settingsFormData.sliderImages];
                                  newSliders[idx] = { ...newSliders[idx], description: e.target.value };
                                  setSettingsFormData({ ...settingsFormData, sliderImages: newSliders });
                                }}
                                className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none font-medium resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-8">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-sm font-black text-gray-400  ">Verification Status</h3>
                    <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-3xl border border-emerald-100 text-emerald-700">
                       <ShieldCheck className="w-8 h-8 shrink-0" />
                       <div>
                          <p className="font-black text-xs  ">Verified Vendor</p>
                          <p className="text-[10px] font-medium opacity-80 mt-0.5">Your business documents have been verified.</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Existing tabs... */}
        {activeTab === 'chats' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Customer Chats</h1>
                <p className="text-gray-500 font-medium mt-1">Chat with your customers in real-time.</p>
              </header>
              <BackButton />
            </div>
            
            <div className="h-[calc(100vh-25rem)] flex gap-6">
              <div className={`w-full md:w-80 lg:w-96 h-full ${activeVendorChat ? 'hidden md:block' : 'block'}`}>
                <ChatList 
                  chats={vendorChats}
                  activeChatId={activeVendorChat?.id}
                  onChatSelect={setActiveVendorChat}
                  currentUserType="vendor"
                />
              </div>
              <div className={`flex-1 h-full ${!activeVendorChat ? 'hidden md:flex' : 'flex'} flex-col`}>
                {activeVendorChat ? (
                  <ChatWindow 
                    chatId={activeVendorChat.id}
                    currentUserId={user?.uid || ''}
                    currentUserType="vendor"
                    chatTitle={activeVendorChat.userName}
                    participants={activeVendorChat.participants}
                    onBack={() => setActiveVendorChat(null)}
                  />
                ) : (
                  <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center p-12">
                    <div className="w-20 h-20 bg-secondary/10 rounded-[2rem] flex items-center justify-center mb-6">
                      <MessageSquare className="w-10 h-10 text-secondary" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Customer Messages</h3>
                    <p className="text-gray-500 max-w-xs text-sm">Select a conversation to reply to your customers.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gateways' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Payment Gateways</h1>
                <p className="text-gray-500 font-medium mt-1">Configure your eSewa and Khalti IDs for payouts.</p>
              </header>
              <BackButton />
            </div>
            {vendorProfile && vendorDocId && (
              <PaymentGatewaySettings 
                vendorProfile={vendorProfile}
                vendorDocId={vendorDocId}
                onUpdate={handleUpdateGateways}
              />
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Store Settings</h1>
                <p className="text-gray-500 font-medium mt-1">Manage your store profile and preferences.</p>
              </header>
              <BackButton />
            </div>
            <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400  ">Store Name</label>
                  <input 
                    type="text" 
                    value={vendorProfile?.storeName || ''} 
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-secondary transition-all"
                    readOnly
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400  ">Email Address</label>
                  <input 
                    type="email" 
                    value={vendorProfile?.contactEmail || ''} 
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-secondary transition-all"
                    readOnly
                  />
                </div>
              </div>
              <div className="pt-8 border-t border-gray-50">
                <button 
                  onClick={() => auth.signOut()}
                  className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all flex items-center gap-3"
                >
                  <LogOut className="w-6 h-6" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-12 h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <header>
                <h1 className="text-4xl font-black text-gray-900 ">Direct Support</h1>
                <p className="text-gray-500 font-medium mt-1">Message Bazaar Support for assistance with account, orders, or products.</p>
              </header>
              <BackButton />
            </div>
            <div className="flex-1 min-h-0 bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
               <VendorSupport />
            </div>
          </div>
        )}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-500">#{selectedOrder.id.toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-gray-400   mb-1">Current Status</p>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="flex gap-2">
                    {['processing', 'shipped', 'out_for_delivery', 'delivered'].map((status) => (
                      <button
                        key={status}
                        onClick={async () => {
                          try {
                            if (status === 'delivered' && selectedOrder.status !== 'delivered') {
                              // Perform transaction to clear funds
                              await runTransaction(db, async (transaction) => {
                                const orderRef = doc(db, 'orders', selectedOrder.id);
                                const vendorRef = doc(db, 'vendors', vendorProfile!.uid);
                                
                                // 1. Find the pending transactions entry for this order and vendor
                                const transactionsRef = collection(db, 'transactions');
                                const q = query(transactionsRef, where('orderId', '==', selectedOrder.id), where('vendorId', '==', vendorProfile!.uid), where('status', '==', 'pending'));
                                const transactionsSnap = await getDocs(q);
                                
                                let totalToClear = 0;
                                transactionsSnap.forEach(l => {
                                  totalToClear += l.data().amount;
                                  transaction.update(doc(db, 'transactions', l.id), { status: 'cleared', updatedAt: new Date().toISOString() });
                                });

                                // 2. Update vendor balance and total earnings
                                const vendorSnap = await transaction.get(vendorRef);
                                if (vendorSnap.exists()) {
                                  const currentBalance = vendorSnap.data().balance || 0;
                                  const totalEarnings = vendorSnap.data().totalEarnings || 0;
                                  transaction.update(vendorRef, {
                                    balance: currentBalance + totalToClear,
                                    totalEarnings: totalEarnings + totalToClear,
                                    updatedAt: new Date().toISOString()
                                  });
                                }

                                // 3. Update order status
                                transaction.update(orderRef, { status, updatedAt: new Date().toISOString() });
                              });
                            } else {
                              await updateDoc(doc(db, 'orders', selectedOrder.id), { status, updatedAt: new Date().toISOString() });
                            }
                            
                            setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: status as any } : o));
                            setSelectedOrder({ ...selectedOrder, status: status as any });
                          } catch (err) {
                            console.error("Error updating order status:", err);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold   transition-all ${
                          selectedOrder.status === status 
                            ? 'bg-secondary text-white' 
                            : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                  <div className="p-6 bg-secondary/10 rounded-3xl border border-secondary/20 space-y-4">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-secondary" />
                      <h3 className="text-sm font-black text-gray-900  ">Tracking Information</h3>
                    </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400  ">Carrier</label>
                      <input 
                        type="text" 
                        placeholder="e.g. DHL, Aramex, Nepal Post"
                        value={selectedOrder.carrier || ''}
                        onChange={(e) => setSelectedOrder({ ...selectedOrder, carrier: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-secondary/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-secondary outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400  ">Tracking Number</label>
                      <input 
                        type="text" 
                        placeholder="Enter tracking ID"
                        value={selectedOrder.trackingNumber || ''}
                        onChange={(e) => setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-secondary/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-secondary outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400  ">Tracking URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://tracking-link.com/..."
                        value={selectedOrder.trackingUrl || ''}
                        onChange={(e) => setSelectedOrder({ ...selectedOrder, trackingUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-secondary/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-secondary outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'orders', selectedOrder.id), {
                          carrier: selectedOrder.carrier || '',
                          trackingNumber: selectedOrder.trackingNumber || '',
                          trackingUrl: selectedOrder.trackingUrl || '',
                          updatedAt: new Date().toISOString()
                        });
                        setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, ...selectedOrder } : o));
                        // Show success feedback if needed
                      } catch (err) {
                        console.error("Error updating tracking:", err);
                      }
                    }}
                    className="w-full py-3 bg-secondary text-white rounded-xl font-bold text-sm hover:bg-secondary/80 shadow-lg shadow-secondary/20 transition-all"
                  >
                    Update Tracking Info
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-400  ">Items from your store</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.filter(item => item.vendorId === user?.uid).map((item, i) => (
                      <div key={i} className="flex gap-4 items-center p-4 bg-white border border-gray-100 rounded-2xl">
                        <img src={item.images[0]} className="w-16 h-16 object-cover rounded-xl" alt="" />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{item.name}</h4>
                          <p className="text-xs text-gray-500">Qty: {item.quantity} × NPR {item.price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-900">NPR {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-400  ">Shipping Information</h3>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-sm space-y-1">
                    <p className="font-bold text-gray-900">{selectedOrder.shippingAddress?.street}</p>
                    <p className="text-gray-600">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                    <p className="text-gray-600">{selectedOrder.shippingAddress?.zip}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payout Request Modal */}
      <AnimatePresence>
        {isPayoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Request Payout</h2>
                  <p className="text-sm text-gray-500">Withdraw funds to your preferred account.</p>
                </div>
                <button 
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </header>

              <form onSubmit={handleRequestPayout} className="p-8 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="bg-secondary/10 p-6 rounded-3xl border border-secondary/20">
                  <p className="text-xs font-black text-secondary   mb-1">Available Balance</p>
                  <h3 className="text-2xl font-black text-gray-900">NPR {(vendorProfile?.balance || 0).toLocaleString()}</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Withdrawal Amount (NPR)</label>
                  <input 
                    required
                    type="number" 
                    max={vendorProfile?.balance}
                    min={100}
                    value={payoutFormData.amount}
                    onChange={(e) => setPayoutFormData({...payoutFormData, amount: Number(e.target.value)})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all font-bold text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700">Withdrawal Frequency</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'monthly', label: 'Monthly' },
                      { id: 'weekly', label: 'Weekly' }
                    ].map((freq) => (
                      <button
                        key={freq.id}
                        type="button"
                        onClick={() => setPayoutFormData({...payoutFormData, frequency: freq.id as any})}
                        className={`p-4 rounded-2xl text-xs font-bold transition-all border-2 ${
                          payoutFormData.frequency === freq.id
                            ? 'bg-secondary/10 border-secondary text-secondary shadow-md'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-secondary/20 hover:bg-gray-50'
                        }`}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic">
                    * A fixed 12% commission applies to all withdrawals regardless of frequency.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700">Payout Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
                      { id: 'esewa', label: 'eSewa', icon: Wallet },
                      { id: 'khalti', label: 'Khalti', icon: Wallet }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPayoutFormData({...payoutFormData, method: method.id as any})}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl text-xs font-bold transition-all border-2 ${
                          payoutFormData.method === method.id
                            ? 'bg-secondary/10 border-secondary text-secondary shadow-md'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-secondary/20 hover:bg-gray-50'
                        }`}
                      >
                        <method.icon className={`w-5 h-5 ${payoutFormData.method === method.id ? 'text-secondary' : 'text-gray-400'}`} />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Account Details</label>
                  <textarea 
                    required
                    rows={3}
                    value={payoutFormData.details}
                    onChange={(e) => setPayoutFormData({...payoutFormData, details: e.target.value})}
                    placeholder={
                      payoutFormData.method === 'bank_transfer' 
                        ? "Bank Name, Account Number, Account Holder Name" 
                        : "Phone number associated with your wallet"
                    }
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all resize-none text-sm"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isRequestingPayout || payoutFormData.amount <= 0 || payoutFormData.amount > (vendorProfile?.balance || 0)}
                    className="w-full bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-secondary transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isRequestingPayout ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                    {isRequestingPayout ? 'Processing...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <p className="text-sm text-gray-500">Fill in the details to list your product.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </header>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-12">
                {error && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Basic Info */}
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400  ">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Product Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Handwoven Pashmina Shawl"
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all"
                      >
                        <option>Fashion</option>
                        <option>Electronics</option>
                        <option>Home Decor</option>
                        <option>Food & Beverage</option>
                        <option>Beauty</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Description</label>
                      <button
                        type="button"
                        onClick={generateAIDescription}
                        disabled={isGeneratingDescription || !formData.name}
                        className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-[10px] font-black   hover:bg-secondary/20 transition-all border border-secondary/20 disabled:opacity-50"
                      >
                        {isGeneratingDescription ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3" />
                        )}
                        {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                      </button>
                    </div>
                    <textarea 
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe your product in detail..."
                      className="w-full h-32 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all resize-none"
                    />
                  </div>
                </section>

                {/* Pricing & Inventory */}
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400  ">Pricing & Inventory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Price (NPR)</label>
                      <input 
                        required
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Stock Quantity</label>
                      <input 
                        required
                        type="number" 
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'draft'})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* SEO Settings */}
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400  ">SEO Settings (Optional)</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">SEO Title</label>
                      <input 
                        type="text" 
                        value={formData.seo.title}
                        onChange={(e) => setFormData({...formData, seo: { ...formData.seo, title: e.target.value }})}
                        placeholder="Search engine friendly title"
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">SEO Description</label>
                      <textarea 
                        value={formData.seo.description}
                        onChange={(e) => setFormData({...formData, seo: { ...formData.seo, description: e.target.value }})}
                        placeholder="Brief description for search results"
                        className="w-full h-24 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all resize-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Product Variants */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-gray-400  ">Product Variants</h3>
                      <p className="text-[10px] text-gray-500 font-medium italic">Add different versions (e.g. Red / XL)</p>
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-xl text-xs font-bold hover:bg-secondary/20 transition-all border border-secondary/20"
                    >
                      <Plus className="w-4 h-4" />
                      Add Variant
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                      <div key={variant.id} className="flex flex-col md:flex-row gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/50">
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black text-gray-400  ">Variant Name</label>
                          <input 
                            type="text"
                            value={variant.name}
                            onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                            placeholder="e.g. Red, Large, 500ml"
                            className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all text-sm font-bold"
                          />
                        </div>
                        <div className="w-full md:w-40 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-400  ">Price Diff (NPR)</label>
                            <button 
                              type="button"
                              onClick={() => updateVariant(variant.id, 'priceDifference', 0)}
                              className="text-[9px] font-bold text-secondary hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <input 
                            type="number"
                            value={variant.priceDifference}
                            onChange={(e) => updateVariant(variant.id, 'priceDifference', Number(e.target.value))}
                            placeholder="+/- amount"
                            className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all text-sm font-bold"
                          />
                          <p className="text-[9px] text-gray-400 font-medium">
                            Final: NPR {(formData.price + (variant.priceDifference || 0)).toLocaleString()}
                          </p>
                        </div>
                        <div className="w-full md:w-32 space-y-2">
                          <label className="text-[10px] font-black text-gray-400  ">Stock</label>
                          <input 
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(variant.id, 'stock', Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all text-sm font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="absolute -top-2 -right-2 p-2 bg-white text-red-500 rounded-full shadow-lg border border-red-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.variants.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <Layers className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-1">No variants added</p>
                        <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Add variants if your product comes in different options like sizes or colors.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Images Section */}
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400  ">Product Media</h3>
                  <ImageUploadManager 
                    images={formData.images}
                    onChange={(images) => setFormData({...formData, images})}
                    maxImages={10}
                  />
                </section>
              </form>

              <footer className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4 sticky bottom-0 z-10">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || formData.images.length === 0}
                  className="bg-secondary text-white px-12 py-4 rounded-2xl font-bold hover:bg-secondary/80 transition-all shadow-xl shadow-secondary/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Saving...' : 'Save Product'}
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Images Modal */}
      <AnimatePresence>
        {isImageModalOpen && imageEditingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImageModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Edit Product Images</h2>
                  <p className="text-sm text-gray-500 mt-1">{imageEditingProduct.name}</p>
                </div>
                <button 
                  onClick={() => setIsImageModalOpen(false)}
                  className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8">
                <ImageUploadManager 
                  images={imageFormData}
                  onChange={setImageFormData}
                  maxImages={10}
                />
              </div>

              <footer className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4 sticky bottom-0 z-10">
                <button 
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveImages}
                  disabled={isSaving || imageFormData.length === 0}
                  className="bg-red-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Saving...' : 'Update Images'}
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCropping && imageToCrop && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-xl">
                    <Scissors className="w-5 h-5 text-secondary" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">Adjust Photo</h2>
                </div>
                <button 
                  onClick={() => {
                    setIsCropping(false);
                    setImageToCrop(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="relative h-[400px] bg-secondary">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={cropType === 'logo' ? 1 : 16 / 9}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape={cropType === 'logo' ? 'round' : 'rect'}
                  showGrid={false}
                />
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <ZoomOut className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                  <ZoomIn className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsCropping(false);
                      setImageToCrop(null);
                    }}
                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropSave}
                    className="flex-1 px-6 py-4 bg-secondary text-white rounded-2xl font-black hover:bg-secondary/80 transition-all shadow-xl shadow-secondary/10"
                  >
                    Apply & Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        {/* First Time Registration Success Modal */}
        <AnimatePresence>
          {showFirstTimeModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFirstTimeModal(false)}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-serif italic text-primary">Success!</h2>
                  <p className="text-gray-500 mt-2">
                    Your registration for <span className="font-bold text-gray-900">"{vendorProfile?.storeName}"</span> is complete. 
                    Welcome to the Bazaar vendor community!
                  </p>
                </div>
                <button 
                  onClick={() => setShowFirstTimeModal(false)}
                  className="w-full bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-secondary/80 transition-all shadow-xl"
                >
                  Continue to Dashboard
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </VendorLayout>
  );
};



