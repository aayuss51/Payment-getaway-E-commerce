import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, deleteDoc, orderBy, addDoc, onSnapshot, serverTimestamp, setDoc, runTransaction } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { uploadImage } from '../lib/storage';
import { BackButton } from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  ExternalLink, 
  Shield,
  ShieldCheck,
  ShieldX,
  Loader2,
  AlertCircle,
  Store,
  MapPin,
  Info,
  AlertTriangle,
  Zap,
  Mail,
  ShoppingBag,
  Filter,
  ChevronRight,
  ArrowRight,
  Package,
  Truck,
  Check,
  Building2,
  DollarSign,
  User,
  Camera,
  Save,
  Plus,
  Edit2,
  Upload,
  Search,
  Star,
  X,
  Trash2,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Scissors,
  ShoppingCart,
  Wand2,
  LayoutDashboard,
  TrendingUp,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import { Order, VendorStore, UserProfile, Product, Payout, UserRole, Brand } from '../types';
import { GoogleGenAI } from "@google/genai";

interface VendorApplication {
  uid: string;
  storeName: string;
  legalName?: string;
  description: string;
  shopLocation?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'pending' | 'approved' | 'rejected';
  kycDetails: {
    panNumber: string;
    panCardUrl: string;
    businessRegistrationNumber?: string;
    businessRegistrationUrl?: string;
  };
  createdAt: string;
  applicantName?: string;
  applicantEmail?: string;
  adminNotes?: string;
}

export const AdminDashboard = () => {
  const { isAdmin, profile: adminProfile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'orders' | 'vendors' | 'users' | 'products' | 'payouts' | 'brands' | 'profile' | 'settings'>('overview');
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    activeVendors: 0,
    newUsers: 0,
    totalOrders: 0,
    recentOrders: [] as Order[]
  });
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [approvedVendors, setApprovedVendors] = useState<VendorStore[]>([]);
  const [totalVendorsCount, setTotalVendorsCount] = useState(0);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('approved');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [vendorPayouts, setVendorPayouts] = useState<Payout[]>([]);
  const [selectedVendorForPayouts, setSelectedVendorForPayouts] = useState<VendorStore | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Product Deletion State
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletionRemark, setDeletionRemark] = useState('');

  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});
  const [payoutSearchQuery, setPayoutSearchQuery] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | 'low_stock'>('all');
  const [productViewMode, setProductViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [vendorIdInput, setVendorIdInput] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [brandFormData, setBrandFormData] = useState({
    name: '',
    logoUrl: ''
  });
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Fashion',
    stock: 0,
    images: [] as string[],
    status: 'active' as 'active' | 'draft',
    seo: {
      title: '',
      description: ''
    },
    vendorId: 'admin'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    photoURL: '',
    role: 'admin' as UserRole,
    phoneNumber: '',
    bio: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Cropping State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropType, setCropType] = useState<'profile' | 'brand' | 'vendor-top-rated' | 'vendor-logo' | 'vendor-banner'>('profile');
  const [vendorSortMode, setVendorSortMode] = useState<'name' | 'rating' | 'newest'>('newest');
  const [activeVendorUid, setActiveVendorUid] = useState<string | null>(null);
  const activeVendorUidRef = useRef<string | null>(null);
  const vendorTopRatedInputRef = useRef<HTMLInputElement>(null);
  const vendorLogoInputRef = useRef<HTMLInputElement>(null);
  const vendorBannerInputRef = useRef<HTMLInputElement>(null);

  const updateActiveVendorUid = (uid: string | null) => {
    setActiveVendorUid(uid);
    activeVendorUidRef.current = uid;
  };

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
        const MAX_SIZE = 800;
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
      const storagePath = 
        cropType === 'profile' ? 'profiles' : 
        cropType === 'brand' ? 'brands' : 
        cropType === 'vendor-logo' ? 'vendor_logos' :
        cropType === 'vendor-banner' ? 'vendor_banners' :
        'vendor_top_rated';
      const downloadURL = await uploadImage(croppedImage, storagePath);
      
      if (cropType === 'profile') {
        setProfileForm(prev => ({ ...prev, photoURL: downloadURL }));
      } else if (cropType === 'brand') {
        setBrandFormData(prev => ({ ...prev, logoUrl: downloadURL }));
      } else if (cropType === 'vendor-top-rated' && activeVendorUidRef.current) {
        const uid = activeVendorUidRef.current;
        // Update the vendor in the state immediately
        setApprovedVendors(prev => prev.map(v => v.uid === uid ? { ...v, isTopRated: true, topRatedImageUrl: downloadURL } : v));
        
        // Auto-save to Firestore for seamless experience
        try {
          const vendorRef = doc(db, 'vendors', uid);
          await updateDoc(vendorRef, {
            isTopRated: true,
            topRatedImageUrl: downloadURL,
            updatedAt: new Date().toISOString()
          });
          setSuccessMessage("Top Rated image updated and saved!");
        } catch (err) {
          console.error("Error auto-saving top rated image:", err);
          setError("Image uploaded but failed to save status to database.");
        }
      } else if ((cropType === 'vendor-logo' || cropType === 'vendor-banner') && activeVendorUidRef.current) {
        const uid = activeVendorUidRef.current;
        const fieldName = cropType === 'vendor-logo' ? 'logoUrl' : 'bannerUrl';
        
        setApprovedVendors(prev => prev.map(v => v.uid === uid ? { ...v, [fieldName]: downloadURL } : v));
        
        try {
          await updateDoc(doc(db, 'vendors', uid), {
            [fieldName]: downloadURL,
            updatedAt: new Date().toISOString()
          });
          setSuccessMessage(`Vendor ${cropType === 'vendor-logo' ? 'Logo' : 'Banner'} updated!`);
        } catch (err) {
          console.error(`Error saving vendor ${fieldName}:`, err);
          setError("Image uploaded but failed to save to database.");
        }
      }
    } catch (err: any) {
      console.error('Crop/Upload error:', err);
      setError(err.message || "Failed to process image.");
    } finally {
      setIsUploading(false);
      setImageToCrop(null);
    }
  };

  // Image Upload Logic moved to src/lib/storage.ts

  const [testEmail, setTestEmail] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setIsTestingEmail(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, purpose: "test the email system" }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.simulated) {
          setError(`Simulation Mode: The email could not be sent (Error: ${data.error || 'Unknown'}). The OTP has been logged to the server console instead.`);
        } else {
          setSuccessMessage(`Test email sent successfully to ${testEmail}. Check your inbox (or spam).`);
        }
      } else {
        setError(data.error || "Failed to send test email.");
      }
    } catch (err: any) {
      setError("Failed to connect to the server.");
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropType('brand');
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  const handleVendorTopRatedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const uid = activeVendorUidRef.current;
    if (!file || !uid) {
      console.warn("Manual download failed: No file or active vendor UID", { hasFile: !!file, uid });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropType('vendor-top-rated');
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleVendorOfficialImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    const uid = activeVendorUidRef.current;
    if (!file || !uid) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropType(type === 'logo' ? 'vendor-logo' : 'vendor-banner');
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file, 'products'));
      const urls = await Promise.all(uploadPromises);
      setProductFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
      setError(null);
    } catch (err: any) {
      console.error("Error uploading product images:", err);
      setError(err.message || "Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropType('profile');
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (adminProfile) {
      setProfileForm({
        displayName: adminProfile.displayName || '',
        photoURL: adminProfile.photoURL || '',
        role: adminProfile.role || 'admin',
        phoneNumber: adminProfile.phoneNumber || '',
        bio: adminProfile.bio || '',
        address: {
          street: adminProfile.address?.street || '',
          city: adminProfile.address?.city || '',
          state: adminProfile.address?.state || '',
          zip: adminProfile.address?.zip || ''
        }
      });
    }
  }, [adminProfile]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (selectedApp) {
      setAdminNote(selectedApp.adminNotes || '');
      setVendorIdInput('');
    }
  }, [selectedApp]);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'overview') {
        fetchMetrics();
      } else if (activeTab === 'applications') {
        fetchApplications();
        fetchApprovedVendors();
      } else if (activeTab === 'orders') {
        fetchOrders();
      } else if (activeTab === 'vendors') {
        fetchApprovedVendors();
      } else if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'payouts') {
        fetchPayouts();
        fetchApprovedVendors();
      } else if (activeTab === 'brands') {
        fetchBrands();
      }
    }
  }, [isAdmin, activeTab, vendorStatusFilter]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Order));
      
      const totalSales = ordersData
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      const vendorsSnapshot = await getDocs(query(collection(db, 'vendors'), where('status', '==', 'approved')));
      const activeVendorsCount = vendorsSnapshot.size;

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsersCount = usersSnapshot.size;

      const recentOrdersData = [...ordersData]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);

      setMetrics({
        totalSales,
        activeVendors: activeVendorsCount,
        newUsers: totalUsersCount,
        totalOrders: ordersData.length,
        recentOrders: recentOrdersData
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'multiple');
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    setLoading(true);
    const path = 'brands';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      const fetchedBrands = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Brand));
      setBrands(fetchedBrands);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async (brandId: string) => {
    if (!window.confirm("Are you sure you want to remove this brand?")) return;
    setProcessingId(brandId);
    const path = `brands/${brandId}`;
    try {
      await deleteDoc(doc(db, 'brands', brandId));
      setBrands(prev => prev.filter(b => b.id !== brandId));
      setSuccessMessage("Brand removed successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId('brand-save');
    const path = 'brands';
    try {
      const newBrand = {
        ...brandFormData,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, path), newBrand);
      setBrands(prev => [...prev, { id: docRef.id, ...newBrand } as Brand]);
      setSuccessMessage("Brand added successfully!");
      setIsBrandModalOpen(false);
      setBrandFormData({ name: '', logoUrl: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setProcessingId(null);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    const path = 'vendors';
    try {
      const q = query(collection(db, path), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      const apps = await Promise.all(querySnapshot.docs.map(async (vendorDoc) => {
        const vendorData = vendorDoc.data() as VendorApplication;
        const userPath = `users/${vendorData.uid}`;
        const kycPath = `vendors/${vendorData.uid}/private/kyc`;
        try {
          const [userDoc, kycDoc] = await Promise.all([
            getDoc(doc(db, 'users', vendorData.uid)),
            getDoc(doc(db, 'vendors', vendorData.uid, 'private', 'kyc'))
          ]);
          
          const userData = userDoc.data();
          const kycData = kycDoc.data();
          
          return { 
            ...vendorData,
            kycDetails: kycData || {},
            applicantName: userData?.displayName || 'Unknown User',
            applicantEmail: userData?.email || 'No Email'
          } as VendorApplication;
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, kycPath);
          throw err;
        }
      }));
      
      setApplications(apps);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    const path = 'orders';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      const fetchedOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Order));
      setOrders(fetchedOrders);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedVendors = async () => {
    setLoading(true);
    const path = 'vendors';
    try {
      // Fetch vendors with status filter
      let q;
      if (vendorStatusFilter === 'all') {
        q = collection(db, path);
      } else {
        q = query(collection(db, path), where('status', '==', vendorStatusFilter));
      }
      const querySnapshot = await getDocs(q);
      const vendors = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() as any } as VendorStore));
      setApprovedVendors(vendors);

      // Fetch total vendors count (all statuses)
      const allVendorsSnapshot = await getDocs(collection(db, path));
      setTotalVendorsCount(allVendorsSnapshot.size);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const path = 'users';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      const fetchedUsers = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(fetchedUsers);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const path = 'products';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Product));
      setProducts(fetchedProducts);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    setLoading(true);
    const path = 'payouts';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedPayouts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Payout));
      
      // Fetch vendor names for each payout
      const names: Record<string, string> = { ...vendorNames };
      await Promise.all(fetchedPayouts.map(async (payout) => {
        if (!names[payout.vendorId]) {
          const vendorDoc = await getDocs(query(collection(db, 'vendors'), where('uid', '==', payout.vendorId)));
          if (!vendorDoc.empty) {
            names[payout.vendorId] = vendorDoc.docs[0].data().storeName;
          } else {
            names[payout.vendorId] = 'Unknown Vendor';
          }
        }
      }));
      
      setVendorNames(names);
      setPayouts(fetchedPayouts);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorPayouts = async (vendor: VendorStore) => {
    setSelectedVendorForPayouts(vendor);
    setIsPayoutModalOpen(true);
    setLoading(true);
    const path = 'payouts';
    try {
      const q = query(
        collection(db, path), 
        where('vendorId', '==', vendor.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedPayouts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Payout));
      setVendorPayouts(fetchedPayouts);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutStatus = async (payoutId: string, newStatus: 'completed' | 'failed', vendorId: string, amount: number) => {
    if (!window.confirm(`Are you sure you want to mark this payout as ${newStatus}?`)) return;
    setProcessingId(payoutId);
    const payoutPath = `payouts/${payoutId}`;
    try {
      await runTransaction(db, async (transaction) => {
        const payoutRef = doc(db, 'payouts', payoutId);
        const vendorRef = doc(db, 'vendors', vendorId);
        
        const payoutSnap = await transaction.get(payoutRef);
        if (!payoutSnap.exists()) {
          throw new Error("Payout record not found");
        }

        // 1. Update payout status
        transaction.update(payoutRef, { status: newStatus });
        
        // 2. Update the transaction entry in the ledger
        const transactionsQ = query(collection(db, 'transactions'), where('payoutId', '==', payoutId));
        const transactionsSnap = await getDocs(transactionsQ);
        
        transactionsSnap.forEach(tDoc => {
          transaction.update(doc(db, 'transactions', tDoc.id), { 
            status: newStatus === 'completed' ? 'cleared' : 'failed',
            updatedAt: new Date().toISOString()
          });
        });

        // If no transaction was found (rare), create one for completed payouts
        if (transactionsSnap.empty && newStatus === 'completed') {
          const newTransactionRef = doc(collection(db, 'transactions'));
          transaction.set(newTransactionRef, {
            vendorId,
            amount: amount,
            type: 'payout',
            status: 'cleared',
            description: `Payout Withdrawal - ${payoutSnap.data().method.replace(/_/g, ' ')}`,
            createdAt: new Date().toISOString()
          });
        }
        
        // 3. If failed, refund the vendor's balance
        if (newStatus === 'failed') {
          const vendorSnap = await transaction.get(vendorRef);
          if (vendorSnap.exists()) {
            const currentBalance = vendorSnap.data().balance || 0;
            transaction.update(vendorRef, {
              balance: currentBalance + amount
            });
          }
        }
      });

      setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: newStatus } : p));
      setSuccessMessage(`Payout marked as ${newStatus}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, payoutPath);
    } finally {
      setProcessingId(null);
    }
  };

  const updateVendorStatus = async (uid: string, newStatus: 'approved' | 'rejected' | 'suspended' | 'pending') => {
    if (!window.confirm(`Are you sure you want to change vendor status to ${newStatus}?`)) return;
    setProcessingId(uid);
    const path = `vendors/${uid}`;
    try {
      await updateDoc(doc(db, 'vendors', uid), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // Update role if becoming vendor
      if (newStatus === 'approved') {
        await updateDoc(doc(db, 'users', uid), { role: 'vendor' });
      }

      setApprovedVendors(prev => prev.map(v => v.uid === uid ? { ...v, status: newStatus } : v));
      
      // In case we want to remove from current view if it doesn't match filter
      if (vendorStatusFilter !== 'all' && vendorStatusFilter !== newStatus) {
         setApprovedVendors(prev => prev.filter(v => v.uid !== uid));
      }

      setSuccessMessage(`Vendor status updated to ${newStatus}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setProcessingId(null);
    }
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    setProcessingId(uid);
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      setSuccessMessage(`User role updated to ${newRole}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleFeatured = async (productId: string, currentStatus: boolean) => {
    setProcessingId(productId);
    const path = `products/${productId}`;
    try {
      await updateDoc(doc(db, 'products', productId), { isFeatured: !currentStatus });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, isFeatured: !currentStatus } : p));
      setSuccessMessage(`Product ${!currentStatus ? 'set as featured' : 'removed from featured'}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproval = async (productId: string, status: 'approved' | 'rejected') => {
    setProcessingId(productId);
    const path = `products/${productId}`;
    try {
      await updateDoc(doc(db, 'products', productId), { approvalStatus: status });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, approvalStatus: status } : p));
      setSuccessMessage(`Product ${status} successfully!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setProcessingId(null);
    }
  };

  const deleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setProductToDelete(product);
    setDeletionRemark('');
    setIsDeletionModalOpen(true);
  };

  const confirmDeletion = async () => {
    if (!productToDelete) return;
    
    setProcessingId(productToDelete.id);
    const path = `products/${productToDelete.id}`;
    try {
      // 1. Delete the product
      await deleteDoc(doc(db, 'products', productToDelete.id));
      
      // 2. If it's a vendor product, send a notification
      if (productToDelete.vendorId && productToDelete.vendorId !== 'admin') {
        const notificationData = {
          userId: productToDelete.vendorId,
          title: 'Product Removed',
          message: `Your product "${productToDelete.name}" has been removed by administrative team. Remark: ${deletionRemark || 'No specific remark provided.'}`,
          type: 'warning',
          read: false,
          createdAt: new Date().toISOString(),
          metadata: {
            productId: productToDelete.id,
            productName: productToDelete.name,
            reason: deletionRemark
          }
        };
        await addDoc(collection(db, 'notifications'), notificationData);
      }
      
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setSuccessMessage("Product deleted and vendor notified successfully!");
      setIsDeletionModalOpen(false);
      setProductToDelete(null);
      setDeletionRemark('');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        images: product.images,
        status: product.status as 'active' | 'draft',
        seo: product.seo || { title: '', description: '' },
        vendorId: product.vendorId || 'admin'
      });
    } else {
      setEditingProduct(null);
      setProductFormData({
        name: '',
        description: '',
        price: 0,
        category: 'Fashion',
        stock: 0,
        images: [],
        status: 'active',
        seo: { title: '', description: '' },
        vendorId: 'admin'
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId('product-save');
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...productFormData,
          updatedAt: new Date().toISOString()
        });
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productFormData } : p));
        setSuccessMessage("Product updated successfully!");
      } else {
        const selectedVendor = approvedVendors.find(v => v.uid === productFormData.vendorId);
        const newProduct = {
          ...productFormData,
          vendorName: selectedVendor ? selectedVendor.storeName : 'Admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          approvalStatus: 'approved' // Admin added products are auto-approved
        };
        const docRef = await addDoc(collection(db, 'products'), newProduct);
        setProducts(prev => [...prev, { id: docRef.id, ...newProduct } as Product]);
        setSuccessMessage("Product added successfully!");
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const generateAIDescription = async () => {
    if (!productFormData.name || !productFormData.category) {
      setError("Please provide a product name and category first.");
      return;
    }

    setIsGeneratingDescription(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey || '' });
      const promptText = `Generate a detailed, engaging, and professional product description for a product named "${productFormData.name}" in the category "${productFormData.category}". The description should highlight key features, benefits, and appeal to potential customers. Keep it concise but informative (around 100-150 words).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptText,
      });

      if (response.text) {
        setProductFormData(prev => ({ ...prev, description: response.text }));
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setError("Failed to generate description. Please try again or write it manually.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setProcessingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
      setSuccessMessage("Order status updated!");
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const updateVendorTopRated = async (uid: string, isTopRated: boolean, topRatedImageUrl: string) => {
    setProcessingId(uid);
    try {
      await updateDoc(doc(db, 'vendors', uid), {
        isTopRated,
        topRatedImageUrl
      });
      setApprovedVendors(prev => prev.map(v => v.uid === uid ? { ...v, isTopRated, topRatedImageUrl } : v));
      setSuccessMessage("Vendor top rated status updated!");
    } catch (err) {
      console.error("Error updating vendor top rated status:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const updateVendorCommission = async (uid: string, commissionRate: number) => {
    setProcessingId(uid);
    try {
      await updateDoc(doc(db, 'vendors', uid), { commissionRate });
      setApprovedVendors(prev => prev.map(v => v.uid === uid ? { ...v, commissionRate } : v));
      setSuccessMessage("Commission rate updated!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vendors/${uid}`);
      console.error("Error updating commission rate:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const addVendorAdjustment = async (uid: string, amount: number, description: string) => {
    if (!amount || !description) return;
    setProcessingId(uid);
    try {
      await runTransaction(db, async (transaction) => {
        const vendorRef = doc(db, 'vendors', uid);
        const vendorSnap = await transaction.get(vendorRef);
        if (!vendorSnap.exists()) throw new Error("Vendor not found");

        const currentBalance = vendorSnap.data().balance || 0;
        const totalEarnings = vendorSnap.data().totalEarnings || 0;

        // 1. Update balance
        transaction.update(vendorRef, {
          balance: currentBalance + amount,
          totalEarnings: amount > 0 ? totalEarnings + amount : totalEarnings,
          updatedAt: new Date().toISOString()
        });

        // 2. Create transaction record
        const transactionRef = doc(collection(db, 'transactions'));
        transaction.set(transactionRef, {
          vendorId: uid,
          amount: Math.abs(amount),
          type: 'adjustment',
          status: 'cleared',
          description: `Adjustment: ${description}`,
          createdAt: new Date().toISOString()
        });
      });

      setApprovedVendors(prev => prev.map(v => v.uid === uid ? { ...v, balance: (v.balance || 0) + amount } : v));
      setSuccessMessage("Adjustment applied successfully!");
    } catch (err) {
      console.error("Adjustment failed:", err);
      setError("Failed to apply adjustment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    setProcessingId('profile-update');
    try {
      await updateDoc(doc(db, 'users', adminProfile.uid), {
        displayName: profileForm.displayName,
        photoURL: profileForm.photoURL,
        role: profileForm.role,
        phoneNumber: profileForm.phoneNumber,
        bio: profileForm.bio,
        address: profileForm.address
      });
      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${adminProfile.uid}`);
      console.error("Failed to update profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAction = async (uid: string, action: 'approved' | 'rejected', providedVendorId?: string) => {
    const finalVendorId = (providedVendorId || vendorIdInput).trim();
    if (action === 'approved' && !finalVendorId) {
      setError("Please assign a Vendor ID before approving.");
      return;
    }
    setProcessingId(uid);
    try {
      // 1. Update vendor status
      const commissionRate = 12;
      
      const updateData: any = {
        status: action,
        commissionRate,
        adminNotes: adminNote,
        updatedAt: new Date().toISOString()
      };

      if (action === 'approved') {
        updateData.vendorId = finalVendorId;
      }
      
      await updateDoc(doc(db, 'vendors', uid), updateData);

      // 2. Send Notification to Vendor
      const notificationData = {
        userId: uid,
        title: action === 'approved' ? 'Application Approved' : 'Application Rejected',
        message: action === 'approved' 
          ? `Congratulations! Your vendor application has been approved. Your Vendor ID is ${finalVendorId}. ${adminNote ? 'Remarks: ' + adminNote : ''}`
          : `We regret to inform you that your vendor application has been rejected. ${adminNote ? 'Remarks: ' + adminNote : ''}`,
        type: action === 'approved' ? 'success' : 'error',
        read: false,
        createdAt: new Date().toISOString(),
        metadata: {
          action,
          vendorId: finalVendorId,
          remarks: adminNote
        }
      };
      await addDoc(collection(db, 'notifications'), notificationData);

      // 3. If approved, update user role
      if (action === 'approved') {
        await updateDoc(doc(db, 'users', uid), {
          role: 'vendor',
          hasPendingVendorApplication: false
        });
      } else {
        await updateDoc(doc(db, 'users', uid), {
          hasPendingVendorApplication: false
        });
      }

      setApplications(prev => prev.filter(app => app.uid !== uid));
      setSelectedApp(null);
      setSuccessMessage(`Application ${action} successfully!`);
    } catch (err) {
      console.error(`Error ${action} application:`, err);
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-secondary animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading Admin Panel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-500">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-50">
          <Link to="/" className="text-2xl font-black er flex items-center gap-2 group">
            <ShoppingCart className="w-8 h-8 text-secondary" />
            <span className="text-gray-900">Bazaar Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'applications', label: 'Applications', icon: FileText },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'vendors', label: 'Vendors', icon: Store },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'payouts', label: 'Payouts', icon: DollarSign },
            { id: 'brands', label: 'Brands', icon: Building2 },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'settings', label: 'Settings', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-secondary text-white shadow-lg shadow-gray-900/20' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="bg-red-50 p-4 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-xs font-black text-red-900  ">Admin Access</span>
            </div>
            <p className="text-[10px] text-red-700 font-medium">You have full control over the marketplace operations.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <BackButton />
                <h1 className="text-4xl font-black text-gray-900  capitalize">{activeTab}</h1>
              </div>
              <p className="text-gray-500">Manage your marketplace {activeTab} and operations.</p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <AnimatePresence>
                {successMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-secondary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="bg-red-50 px-4 py-2 rounded-xl flex items-center gap-2">
                {activeTab === 'overview' ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-red-700">Marketplace Growth</span>
                  </>
                ) : activeTab === 'applications' ? (
                  <>
                    <Users className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-red-700">{applications.length} Pending Requests</span>
                  </>
                ) : activeTab === 'orders' ? (
                  <>
                    <ShoppingBag className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-red-700">{orders.length} Total Orders</span>
                  </>
                ) : activeTab === 'vendors' ? (
                  <>
                    <Store className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-red-700">{totalVendorsCount} Total Vendors ({approvedVendors.length} {vendorStatusFilter.charAt(0).toUpperCase() + vendorStatusFilter.slice(1)})</span>
                  </>
                ) : activeTab === 'users' ? (
                  <>
                    <Users className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-red-700">{users.length} Total Users</span>
                  </>
                ) : activeTab === 'payouts' ? (
                  <>
                    <DollarSign className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-red-700">{payouts.length} Payout Requests</span>
                  </>
                ) : activeTab === 'brands' ? (
                  <>
                    <Building2 className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-red-700">{brands.length} Trusted Brands</span>
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-red-700">{products.length} Total Products</span>
                  </>
                )}
              </div>
            </div>
          </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400  ">Total Sales</p>
                  <h3 className="text-2xl font-black text-gray-900 leading-none mt-1">
                    Rs. {metrics.totalSales.toLocaleString()}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50/50 w-fit px-2 py-1 rounded-lg">
                <TrendingUp className="w-3 h-3" />
                <span>+12.5% this month</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400  ">Total Orders</p>
                  <h3 className="text-2xl font-black text-gray-900 leading-none mt-1">
                    {metrics.totalOrders}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium">From all time history</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-50 text-secondary rounded-2xl">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400  ">Active Vendors</p>
                  <h3 className="text-2xl font-black text-gray-900 leading-none mt-1">
                    {metrics.activeVendors}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                      <img src={`https://picsum.photos/seed/${i+40}/50/50`} alt="" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 font-bold ">Growing Fast</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400  ">Total Users</p>
                  <h3 className="text-2xl font-black text-gray-900 leading-none mt-1">
                    {metrics.newUsers}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium">New registrations</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">Recent Orders</h3>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-black text-secondary   transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400  ">Order ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400  ">Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400  ">Items</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400  ">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400  ">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {metrics.recentOrders.map((order) => (
                        <tr key={order.id} className="transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-gray-400">#{order.id.slice(-6).toUpperCase()}</td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex -space-x-2">
                              {order.items.slice(0, 3).map((item, i) => (
                                <div key={i} className="w-8 h-8 rounded-lg border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                                  <img src={item.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="w-8 h-8 rounded-lg border-2 border-white bg-red-100 flex items-center justify-center text-[10px] font-black text-secondary shadow-sm">
                                  +{order.items.length - 3}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-gray-900 text-sm">Rs. {order.totalAmount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black   ${
                              order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-red-100 text-secondary'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-black text-gray-900">Platform Quick Stats</h3>
              <div className="bg-secondary rounded-[2rem] p-8 text-white space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400  ">Storage Usage</span>
                    <span className="text-xs font-black">64%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[64%]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400   mb-1">Response Time</p>
                    <p className="text-xl font-black">1.4s</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400   mb-1">Server Health</p>
                    <p className="text-xl font-black text-emerald-500">99.9%</p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('settings')}
                  className="w-full py-4 bg-white/10 rounded-2xl text-xs font-black   transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" /> System Health
                </button>
              </div>

              <div className="bg-gradient-to-br from-secondary to-red-600 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                <ShoppingCart className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12 transition-transform" />
                <h4 className="text-xl font-black mb-2 relative z-10">Bazaar Pro</h4>
                <p className="text-xs text-white/80 leading-relaxed mb-6 relative z-10">
                  Upgrade your administrative powers with advanced analytics, multi-region support, and automated marketing tools.
                </p>
                <button className="bg-white text-secondary px-6 py-3 rounded-xl text-xs font-black   transition-all relative z-10">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'applications' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Applications List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black text-gray-400  ">Pending Applications</h2>
              {applications.length > 0 && (
                <button 
                  onClick={async () => {
                    if (!window.confirm(`Are you sure you want to approve all ${applications.length} applications?`)) return;
                    setLoading(true);
                    try {
                      for (const app of applications) {
                        const vendorId = `V-${Math.floor(1000 + Math.random() * 9000)}`;
                        await handleAction(app.uid, 'approved', vendorId);
                      }
                    } catch (err) {
                      console.error("Bulk approval error:", err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-[10px] font-black text-secondary   px-3 py-1 rounded-lg transition-colors border border-red-200"
                >
                  Approve All
                </button>
              )}
            </div>
            {applications.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-red-100 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
                <p className="text-gray-400">No pending vendor applications at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <motion.div 
                    key={app.uid}
                    layoutId={app.uid}
                    onClick={() => setSelectedApp(app)}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer group ${
                      selectedApp?.uid === app.uid 
                        ? 'bg-red-50 border-red-200 shadow-lg shadow-secondary/5' 
                        : 'bg-white border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0 transition-colors">
                          <Store className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="bg-secondary px-3 py-1 rounded-lg inline-block">
                            <h3 className="font-bold text-white text-lg">{app.storeName}</h3>
                          </div>
                          <p className="text-sm text-secondary font-medium">{app.applicantName} • {app.applicantEmail}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(app.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className={`w-5 h-5 transition-all ${selectedApp?.uid === app.uid ? 'text-secondary translate-x-1' : 'text-gray-300'}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedApp ? (
                <motion.div 
                  key={selectedApp.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl sticky top-24"
                >
                  <div className="space-y-8">
                    <div className="pb-6 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="bg-secondary px-4 py-2 rounded-xl inline-block mb-2">
                          <h2 className="text-2xl font-black text-white">{selectedApp.storeName}</h2>
                        </div>
                      </div>
                      <div className="flex flex-col mb-4">
                        <span className="text-sm font-bold text-secondary">{selectedApp.legalName || selectedApp.applicantName}</span>
                        <span className="text-xs text-gray-400">Legal Name</span>
                      </div>
                      <div className="flex flex-col mb-4">
                        <span className="text-sm font-bold text-gray-900">{selectedApp.contactEmail || selectedApp.applicantEmail}</span>
                        <span className="text-xs text-gray-400">Contact Email</span>
                      </div>
                      <div className="flex flex-col mb-4">
                        <span className="text-sm font-bold text-gray-900">{selectedApp.contactPhone || 'Not provided'}</span>
                        <span className="text-xs text-gray-400">Contact Phone</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{selectedApp.description}</p>
                                             {selectedApp.shopLocation && (
                        <div className="mt-4 flex items-center gap-2 text-secondary text-xs font-bold bg-red-50 p-3 rounded-xl">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{selectedApp.shopLocation}</span>
                          <a href={selectedApp.shopLocation} target="_blank" rel="noreferrer" className="ml-auto hover:scale-110 transition-transform">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-gray-400  ">Admin Controls</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400  mb-1 block">Admin Notes</label>
                          <textarea 
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Add notes about this application..."
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs outline-none focus:ring-2 focus:ring-secondary transition-all resize-none"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400  mb-1 block">Assign Vendor ID (Required for Approval)</label>
                          <input 
                            type="text"
                            value={vendorIdInput}
                            onChange={(e) => setVendorIdInput(e.target.value.toUpperCase())}
                            placeholder="e.g. V-1001"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs outline-none focus:ring-2 focus:ring-secondary transition-all"
                          />
                        </div>
                      </div>

                      <h3 className="text-xs font-black text-gray-400   pt-4">KYC Documents</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <a 
                          href={selectedApp.kycDetails.panCardUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl transition-all group"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                            <FileText className="w-5 h-5 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">PAN / VAT Card</p>
                            <p className="text-[10px] text-gray-400  font-black">View Document</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                        </a>

                        {selectedApp.kycDetails.businessRegistrationUrl && (
                          <a 
                            href={selectedApp.kycDetails.businessRegistrationUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group"
                          >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                              <Building2 className="w-5 h-5 text-secondary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">Business Registration</p>
                              <p className="text-[10px] text-gray-400  font-black">View Document</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-300 transition-colors" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <button 
                        onClick={() => handleAction(selectedApp.uid, 'rejected')}
                        disabled={!!processingId}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        {processingId === selectedApp.uid ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                        Reject
                      </button>
                      <button 
                        onClick={() => handleAction(selectedApp.uid, 'approved')}
                        disabled={!!processingId}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-white bg-secondary hover:bg-red-700 shadow-lg shadow-secondary/20 transition-all disabled:opacity-50"
                      >
                        {processingId === selectedApp.uid ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        Approve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-900">No Selection</h3>
                  <p className="text-sm text-gray-400">Select an application from the list to view details and take action.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-xs font-black text-gray-400  ">Order Management</h2>
              
              {/* Status Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-wrap gap-2 flex-1">
                  {['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                        orderFilter === status 
                          ? 'bg-secondary text-white shadow-lg shadow-secondary/20' 
                          : 'bg-white border border-gray-100 text-gray-500 hover:border-red-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search Order ID or Vendor ID..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none"
                  />
                </div>
              </div>
            </div>

            {orders.filter(o => {
              const statusMatch = orderFilter === 'all' || o.status === orderFilter;
              const query = orderSearchQuery.toLowerCase();
              const orderId = o.id.toLowerCase();
              const vendorIds = o.items.map(item => item.vendorId.toLowerCase());
              const customVendorIds = o.items.map(item => 
                approvedVendors.find(v => v.uid === item.vendorId)?.vendorId?.toLowerCase() || ''
              );
              
              return statusMatch && (
                orderId.includes(query) || 
                vendorIds.some(vid => vid.includes(query)) || 
                customVendorIds.some(cvid => cvid.includes(query))
              );
            }).length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">No orders yet</h3>
                <p className="text-gray-400">Orders will appear here once customers start purchasing.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter(o => {
                    const statusMatch = orderFilter === 'all' || o.status === orderFilter;
                    const query = orderSearchQuery.toLowerCase();
                    const orderId = o.id.toLowerCase();
                    const vendorIds = o.items.map(item => item.vendorId.toLowerCase());
                    const customVendorIds = o.items.map(item => 
                      approvedVendors.find(v => v.uid === item.vendorId)?.vendorId?.toLowerCase() || ''
                    );
                    const searchMatch = orderId.includes(query) || 
                                       vendorIds.some(vid => vid.includes(query)) || 
                                       customVendorIds.some(cvid => cvid.includes(query));
                    return statusMatch && searchMatch;
                  })
                  .map((order) => (
                    <motion.div 
                      key={order.id}
                      layoutId={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-6 rounded-3xl border transition-all cursor-pointer group ${
                        selectedOrder?.id === order.id 
                          ? 'bg-red-50 border-red-200 shadow-lg shadow-secondary/5' 
                          : 'bg-white border-gray-100 hover:border-red-200 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                            <Package className="w-6 h-6 text-gray-400 group-hover:text-secondary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold   ${
                                order.status === 'delivered' ? 'bg-red-100 text-secondary' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-red-100 text-secondary'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {order.items.length} items • NPR {order.totalAmount.toLocaleString()} • {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-all ${selectedOrder?.id === order.id ? 'text-secondary translate-x-1' : 'text-gray-300'}`} />
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>

          {/* Order Details Panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedOrder ? (
                <motion.div 
                  key={selectedOrder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl sticky top-24"
                >
                  <div className="space-y-8">
                    <div className="pb-6 border-b border-gray-100">
                      <h2 className="text-2xl font-black text-gray-900 mb-2">Order Details</h2>
                      <p className="text-xs text-gray-400  font-black ">#{selectedOrder.id}</p>
                    </div>

                    <div className="space-y-6">
                      {/* Items */}
                      <div>
                        <h3 className="text-xs font-black text-gray-400   mb-4">Items</h3>
                        <div className="space-y-3">
                          {selectedOrder.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 font-medium">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                              <span className="font-bold text-gray-900">NPR {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                            <span className="font-black text-gray-900">Total</span>
                            <span className="text-xl font-black text-secondary">NPR {selectedOrder.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Shipping */}
                      <div>
                        <h3 className="text-xs font-black text-gray-400   mb-2">Shipping Address</h3>
                        <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-600 leading-relaxed">
                          {selectedOrder.shippingAddress.street}<br/>
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400  ">Update Status</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { status: 'processing', icon: Clock },
                            { status: 'shipped', icon: Truck },
                            { status: 'delivered', icon: Check },
                            { status: 'cancelled', icon: XCircle },
                          ].map((step) => (
                            <button
                              key={step.status}
                              disabled={processingId === selectedOrder.id}
                              onClick={() => updateOrderStatus(selectedOrder.id, step.status)}
                              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black   transition-all ${
                                selectedOrder.status === step.status
                                  ? 'bg-secondary text-white shadow-lg'
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                              }`}
                            >
                              {processingId === selectedOrder.id && selectedOrder.status !== step.status ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <step.icon className="w-3 h-3" />
                              )}
                              {step.status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-900">No Selection</h3>
                  <p className="text-sm text-gray-400">Select an order from the list to view details and manage status.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : activeTab === 'vendors' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-6 gap-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 ">Manage Vendors</h2>
                <p className="text-sm text-gray-500 font-medium">Monitor ratings and manage Top Rated status</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full border border-red-100">
                  <Star className="w-3 h-3 text-secondary fill-secondary" />
                  <span className="text-[10px] font-black text-secondary  ">
                    {approvedVendors.filter(v => v.isTopRated).length} / 5 TOP SLOTS
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 w-full">
              <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto max-w-full">
                {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setVendorStatusFilter(status)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-black   transition-all whitespace-nowrap ${
                      vendorStatusFilter === status ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl ml-auto">
                {(['newest', 'rating', 'name'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setVendorSortMode(mode)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black   transition-all ${
                      vendorSortMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 md:min-w-[250px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search store or ID..."
                  value={vendorSearchQuery}
                  onChange={(e) => setVendorSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none transition-all"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {approvedVendors.filter(v => {
              const query = vendorSearchQuery.toLowerCase();
              return (
                v.storeName.toLowerCase().includes(query) ||
                v.vendorId?.toLowerCase().includes(query) ||
                v.uid.toLowerCase().includes(query)
              );
            })
            .sort((a, b) => {
              if (vendorSortMode === 'rating') return (b.rating || 0) - (a.rating || 0);
              if (vendorSortMode === 'name') return a.storeName.localeCompare(b.storeName);
              return (b.approvedAt || b.createdAt || '').localeCompare(a.approvedAt || a.createdAt || '');
            })
            .map(vendor => (
              <div key={vendor.uid} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-secondary font-bold text-xl overflow-hidden shadow-sm relative">
                    {vendor.logoUrl ? (
                      <img src={vendor.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      vendor.storeName.charAt(0)
                    )}
                    {vendor.status !== 'approved' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-[8px] text-white font-black  er rotate-[-15deg]">
                          {vendor.status}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="bg-secondary px-3 py-1 rounded-lg inline-block">
                        <h3 className="font-bold text-white line-clamp-1">{vendor.storeName}</h3>
                      </div>
                      <span className={`px-2 py-0.5 text-[8px] font-black rounded-md   ${
                        vendor.status === 'approved' ? 'bg-green-100 text-green-700' :
                        vendor.status === 'pending' ? 'bg-red-100 text-secondary' :
                        vendor.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {vendor.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {vendor.vendorId && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-md  ">
                          {vendor.vendorId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-secondary">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-black">{(vendor.rating || 0).toFixed(1)}</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <span className="text-[10px] font-bold text-gray-400">{(vendor.reviewsCount || 0)} Reviews</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-transparent hover:border-red-100 transition-colors">
                    <p className="text-[10px] font-bold text-gray-400   mb-1">Balance</p>
                    <p className="text-sm font-black text-secondary">Rs. {(vendor.balance || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl border border-transparent hover:border-gray-200 transition-colors">
                    <p className="text-[10px] font-bold text-gray-400   mb-1">Total Earnings</p>
                    <p className="text-sm font-black text-gray-900">Rs. {(vendor.totalEarnings || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={vendor.isTopRated || false}
                        onChange={(e) => updateVendorTopRated(vendor.uid, e.target.checked, vendor.topRatedImageUrl || '')}
                        className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-secondary"
                      />
                      <span className="text-sm font-bold text-gray-700">Display in Top Rated</span>
                    </label>
                    <span className={`text-[9px] font-black   px-2 py-0.5 rounded-md ${vendor.isTopRated ? 'bg-red-100 text-secondary' : 'bg-gray-100 text-gray-400'}`}>
                      {vendor.isTopRated ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {vendor.isTopRated && (
                    <div className="space-y-4 p-4 bg-red-50/30 rounded-[2rem] border border-red-100/50">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-red-800  ">Featured Visual</p>
                        {vendor.topRatedImageUrl && (
                          <button 
                            onClick={() => updateVendorTopRated(vendor.uid, true, '')}
                            className="text-[9px] font-bold text-red-500  hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            updateActiveVendorUid(vendor.uid);
                            vendorTopRatedInputRef.current?.click();
                          }}
                          className="flex flex-col items-center gap-2 p-3 bg-white border border-red-100 rounded-2xl hover:bg-red-100 transition-all group"
                        >
                          <Camera className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-red-900">Upload Media</span>
                        </button>
                        <div className="relative group/url">
                          <input 
                            type="text" 
                            value={vendor.topRatedImageUrl || ''}
                            onChange={(e) => {
                              const newVendors = [...approvedVendors];
                              const v = newVendors.find(v => v.uid === vendor.uid);
                              if (v) v.topRatedImageUrl = e.target.value;
                              setApprovedVendors(newVendors);
                            }}
                            placeholder="URL..."
                            className="w-full h-full p-3 bg-white border border-red-100 rounded-2xl text-[10px] outline-none focus:ring-2 focus:ring-secondary transition-all font-medium"
                          />
                          <button 
                             onClick={() => updateVendorTopRated(vendor.uid, true, vendor.topRatedImageUrl || '')}
                             className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-secondary text-white rounded-lg transition-opacity"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {vendor.topRatedImageUrl && (
                        <div className="relative rounded-2xl overflow-hidden aspect-[2/1] border border-red-100 shadow-inner bg-gray-200">
                          <img 
                            src={vendor.topRatedImageUrl} 
                            className="w-full h-full object-cover"
                            alt="Preview"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2">
                            <p className="text-[8px] text-white font-black   truncate">{vendor.topRatedImageUrl}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <p className="text-[10px] font-black text-gray-400  ">Official Brand Identity</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {
                          updateActiveVendorUid(vendor.uid);
                          vendorLogoInputRef.current?.click();
                        }}
                        className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-2xl transition-all group"
                      >
                        <Camera className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] font-bold">Update Logo</span>
                      </button>
                      <button 
                        onClick={() => {
                          updateActiveVendorUid(vendor.uid);
                          vendorBannerInputRef.current?.click();
                        }}
                        className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-2xl transition-all group"
                      >
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] font-bold">Update Banner</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-500   mb-2">
                        Commission (%)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          value={vendor.commissionRate || 0}
                          onChange={(e) => {
                            const newVendors = [...approvedVendors];
                            const v = newVendors.find(v => v.uid === vendor.uid);
                            if (v) v.commissionRate = Number(e.target.value);
                            setApprovedVendors(newVendors);
                          }}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-secondary outline-none"
                        />
                        <button 
                          onClick={() => updateVendorCommission(vendor.uid, vendor.commissionRate || 0)}
                          disabled={processingId === vendor.uid}
                          className="p-2 bg-secondary text-white rounded-xl transition-colors disabled:opacity-50"
                        >
                          {processingId === vendor.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <button
                      onClick={() => fetchVendorPayouts(vendor)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold transition-all"
                    >
                      <DollarSign className="w-4 h-4" />
                      View Payout History
                    </button>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-black text-gray-400   mb-2">Account Status & Adjustments</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {vendor.status !== 'approved' && (
                          <button
                            onClick={() => updateVendorStatus(vendor.uid, 'approved')}
                            className="flex-1 py-2 px-3 bg-green-50 text-green-700 rounded-xl text-[10px] font-black   hover:bg-green-100"
                          >
                            Approve
                          </button>
                        )}
                        {vendor.status === 'approved' && (
                          <button
                            onClick={() => updateVendorStatus(vendor.uid, 'suspended')}
                            className="flex-1 py-2 px-3 bg-red-50 text-secondary rounded-xl text-[10px] font-black  "
                          >
                            Suspend
                          </button>
                        )}
                        {vendor.status !== 'rejected' && (
                          <button
                            onClick={() => updateVendorStatus(vendor.uid, 'rejected')}
                            className="flex-1 py-2 px-3 bg-red-50 text-red-700 rounded-xl text-[10px] font-black   hover:bg-red-100"
                          >
                            Reject
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const amount = Number(window.prompt("Enter Adjustment Amount (Negative for deduction):", "0"));
                            const reason = window.prompt("Enter Reason for Adjustment:", "System Adjustment");
                            if (amount && reason) addVendorAdjustment(vendor.uid, amount, reason);
                          }}
                          className="flex-1 py-2 px-3 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl text-[10px] font-black   hover:bg-purple-100"
                        >
                          Add Adjustment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900">Manage Users</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-black text-gray-400  ">User</th>
                    <th className="p-4 text-xs font-black text-gray-400  ">Email</th>
                    <th className="p-4 text-xs font-black text-gray-400  ">Role</th>
                    <th className="p-4 text-xs font-black text-gray-400   text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-secondary font-bold">
                            {user.displayName?.charAt(0) || 'U'}
                          </div>
                          <span className="font-bold text-gray-900">{user.displayName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-500">{user.email}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          user.role === 'vendor' ? 'bg-red-100 text-secondary' :
                          user.role === 'customer_support' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'sales_manager' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {user.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                          disabled={processingId === user.uid}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-secondary outline-none"
                        >
                          <option value="buyer">Buyer</option>
                          <option value="vendor">Vendor</option>
                          <option value="customer_support">Customer Support</option>
                          <option value="sales_manager">Sales Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'products' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Manage Products</h2>
              <p className="text-sm text-gray-500">Monitor and manage all products across the platform.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 group hidden sm:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-secondary transition-colors" />
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:bg-white transition-all outline-none"
                />
              </div>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setProductFilter('all')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold   transition-all ${
                    productFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setProductFilter('low_stock')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold   transition-all flex items-center gap-2 ${
                    productFilter === 'low_stock' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Low Stock
                  {products.filter(p => p.stock <= 5).length > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setProductViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    productViewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <Filter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setProductViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    productViewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Table View"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleOpenProductModal()}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-secondary/20"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            </div>
          </div>

          {productViewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products
                .filter(p => {
                  const matchesFilter = productFilter === 'all' || p.stock <= 5;
                  const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
                                      p.id.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                                      (p.vendorName || '').toLowerCase().includes(productSearchQuery.toLowerCase());
                  return matchesFilter && matchesSearch;
                })
                .map((product) => (
                <div key={product.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all ${
                  product.stock <= 5 ? 'border-red-100 ring-1 ring-red-50' : 'border-gray-100'
                }`}>
                  <div className="aspect-square relative">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => toggleFeatured(product.id, !!product.isFeatured)}
                          disabled={processingId === product.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shadow-sm ${
                            product.isFeatured ? 'bg-secondary' : 'bg-white/90 backdrop-blur-sm'
                          }`}
                          title={product.isFeatured ? "Remove from Featured" : "Set as Featured"}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                              product.isFeatured ? 'translate-x-6 bg-white' : 'translate-x-1 bg-gray-400'
                            }`}
                          />
                        </button>
                        <span className="text-[8px] font-black  er text-white drop-shadow-md">
                          {product.isFeatured ? 'Featured' : 'Feature'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenProductModal(product)}
                        className="p-2 bg-white/90 backdrop-blur-sm text-secondary rounded-xl transition-colors shadow-sm"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        disabled={processingId === product.id}
                        className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-xl transition-colors shadow-sm"
                        title="Delete Product"
                      >
                        {processingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      </button>
                    </div>
                    {product.stock <= 5 && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-red-600 text-white text-[10px] font-black   rounded-lg shadow-lg flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-black text-secondary">Rs. {product.price.toLocaleString()}</span>
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-gray-400'}`}>
                          Stock: {product.stock}
                        </span>
                        {product.vendorName && (
                          <span className="text-[8px] text-gray-400   mt-0.5">
                            by {product.vendorName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Product</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Category</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Price</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Stock</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Featured</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400  ">Approval</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400   text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products
                    .filter(p => {
                      const matchesFilter = productFilter === 'all' || p.stock <= 5;
                      const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
                                          p.id.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                                          (p.vendorName || '').toLowerCase().includes(productSearchQuery.toLowerCase());
                      return matchesFilter && matchesSearch;
                    })
                    .map((product) => (
                    <tr key={product.id} className="transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200">
                            <img 
                              src={product.images[0]} 
                              className="w-full h-full object-cover"
                              alt={product.name}
                              referrerPolicy="no-referrer"
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
                      <td className="px-6 py-4 font-black text-gray-900">Rs. {product.price.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className={`font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-gray-700'}`}>{product.stock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleFeatured(product.id, !!product.isFeatured)}
                            disabled={processingId === product.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              product.isFeatured ? 'bg-secondary' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                product.isFeatured ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-black   ${product.isFeatured ? 'text-secondary' : 'text-gray-400'}`}>
                            {product.isFeatured ? 'Featured' : 'Standard'}
                          </span>
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
                          
                          {product.approvalStatus === 'pending' && (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleApproval(product.id, 'approved')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                title="Approve"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleApproval(product.id, 'approved')}
                                className="p-1 text-emerald-600 rounded transition-colors"
                                title="Approve"
                              >
                                <ShieldX className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenProductModal(product)}
                            className="p-2 text-gray-400 rounded-lg transition-all"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteProduct(product.id)}
                            disabled={processingId === product.id}
                            className="p-2 text-gray-400 rounded-lg transition-all"
                            title="Delete Product"
                          >
                            {processingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {products.filter(p => productFilter === 'all' || p.stock <= 5).length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No products found</h3>
              <p className="text-gray-500">Try changing your filters.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'profile' ? (
        <div className="max-w-2xl mx-auto py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden"
          >
            <header className="p-8 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Admin Profile</h2>
                  <p className="text-sm text-gray-500">Update your personal information and role.</p>
                </div>
              </div>
            </header>

            <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              <div className="flex flex-col items-center gap-6">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-32 h-32 bg-gray-100 rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                    {profileForm.photoURL ? (
                      <img src={profileForm.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-xs font-bold text-gray-400">Click image to upload from device</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400   ml-1">Display Name</label>
                  <input 
                    type="text" 
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    required
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                    placeholder="Your Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400   ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                    placeholder="+977 98XXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400   ml-1">Bio</label>
                  <textarea 
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full h-24 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400   ml-1">Address</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Street"
                      value={profileForm.address.street}
                      onChange={(e) => setProfileForm({ ...profileForm, address: { ...profileForm.address, street: e.target.value } })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="City"
                      value={profileForm.address.city}
                      onChange={(e) => setProfileForm({ ...profileForm, address: { ...profileForm.address, city: e.target.value } })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="State"
                      value={profileForm.address.state}
                      onChange={(e) => setProfileForm({ ...profileForm, address: { ...profileForm.address, state: e.target.value } })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Zip Code"
                      value={profileForm.address.zip}
                      onChange={(e) => setProfileForm({ ...profileForm, address: { ...profileForm.address, zip: e.target.value } })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400   ml-1">Role</label>
                  <select 
                    value={profileForm.role}
                    onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value as any })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none font-bold"
                  >
                    <option value="admin">Administrator</option>
                    <option value="customer_support">Customer Support</option>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="vendor">Vendor</option>
                    <option value="buyer">Buyer</option>
                  </select>
                  <p className="text-[10px] text-red-500 font-bold ml-1">Warning: Changing your role may restrict your access to this dashboard.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button 
                  type="submit"
                  disabled={processingId === 'profile-update'}
                  className="w-full bg-secondary text-white py-4 rounded-2xl font-black hover:bg-secondary transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === 'profile-update' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-red-50 text-secondary rounded-2xl">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Email System Settings</h2>
                <p className="text-sm text-gray-500">Test and verify your Gmail SMTP configuration</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Configuration Required
                </h3>
                <p className="text-xs text-red-700 leading-relaxed">
                  To send real emails, you must set <strong>GMAIL_APP_PASSWORD</strong> in the AI Studio Settings. 
                  Google requires a 16-character App Password, not your regular Gmail password.
                </p>
              </div>

              {error && (error.includes('SMTP') || error.includes('Invalid login') || error.includes('535')) && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-800  ">Authentication Failed</p>
                    <p className="text-xs text-red-700 leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400  ml-1">Send Test Email To</label>
                <div className="flex gap-3">
                  <input 
                    type="email"
                    placeholder="your-email@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                  />
                  <button 
                    onClick={handleTestEmail}
                    disabled={isTestingEmail || !testEmail}
                    className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isTestingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    Test
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Troubleshooting Steps</h3>
                <ul className="space-y-3">
                  {[
                    "Enable 2-Step Verification in your Google Account.",
                    "Go to Security > App Passwords.",
                    "Generate a new password for 'Bazaar App'.",
                    "Copy the 16-character code and paste it into AI Studio Settings.",
                    "Ensure GMAIL_USER is supportbazaar@gmail.com.",
                    "If it still fails, visit https://accounts.google.com/DisplayUnlockCaptcha and click 'Continue'."
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-gray-600">
                      <span className="flex-shrink-0 w-5 h-5 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'payouts' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-gray-900">Transaction History (Withdrawals)</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search vendor..."
                value={payoutSearchQuery}
                onChange={(e) => setPayoutSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none"
              />
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-black text-gray-400  ">Date</th>
                    <th className="p-4 text-xs font-black text-gray-400  ">Vendor</th>
                    <th className="p-4 text-xs font-black text-gray-400  ">Amount</th>
                    <th className="p-4 text-xs font-black text-gray-400  ">Frequency</th>
                    <th className="p-4 text-xs font-black text-gray-400  ">Method</th>
                    <th className="p-4 text-xs font-black text-gray-400  ">Account Details</th>
                    <th className="p-4 text-xs font-black text-gray-400  ">Status</th>
                    <th className="p-4 text-xs font-black text-gray-400   text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.filter(p => {
                    const vendorName = vendorNames[p.vendorId]?.toLowerCase() || '';
                    const vendorId = p.vendorId.toLowerCase();
                    const customVendorId = approvedVendors.find(v => v.uid === p.vendorId)?.vendorId?.toLowerCase() || '';
                    const query = payoutSearchQuery.toLowerCase();
                    return vendorName.includes(query) || vendorId.includes(query) || customVendorId.includes(query);
                  }).map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-900">
                        <div className="flex flex-col">
                          <span>{vendorNames[payout.vendorId] || payout.vendorId.substring(0, 8) + '...'}</span>
                          {payout.vendorId && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {approvedVendors.find(v => v.uid === payout.vendorId)?.vendorId || payout.vendorId.substring(0, 8)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-black text-secondary">
                        Rs. {payout.amount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black   ${
                          (payout as any).frequency === 'weekly' ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {(payout as any).frequency || 'Monthly'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 capitalize">
                        {payout.method.replace(/_/g, ' ')}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {payout.accountDetails}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                          payout.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-red-100 text-secondary'
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {payout.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => updatePayoutStatus(payout.id, 'completed', payout.vendorId, payout.amount)}
                              disabled={processingId === payout.id}
                              className="p-2 text-green-600 rounded-lg transition-colors"
                              title="Approve Payout"
                            >
                              {processingId === payout.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => updatePayoutStatus(payout.id, 'failed', payout.vendorId, payout.amount)}
                              disabled={processingId === payout.id}
                              className="p-2 text-red-600 rounded-lg transition-colors"
                              title="Reject Payout"
                            >
                              {processingId === payout.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No payout requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'brands' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Manage Trusted Brands</h2>
              <p className="text-gray-500">Showcase your partners and trusted brands on the landing page.</p>
            </div>
            <button 
              onClick={() => setIsBrandModalOpen(true)}
              className="flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-secondary/20"
            >
              <Plus className="w-5 h-5" /> Add Brand
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <div key={brand.id} className="group relative bg-white rounded-3xl border border-gray-100 p-8 shadow-sm transition-all duration-500">
                <button 
                  onClick={() => deleteBrand(brand.id)}
                  className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-xl opacity-100 transition-all"
                  title="Remove Brand"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-32 h-20 flex items-center justify-center">
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name}
                      className="max-w-full max-h-full object-contain transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900">{brand.name}</h4>
                    <p className="text-[10px] text-gray-400   mt-1">
                      Added {new Date(brand.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {brands.length === 0 && (
              <div className="col-span-full bg-white rounded-3xl border border-gray-100 p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">No brands added yet</h3>
                <p className="text-gray-400">Add your first trusted brand to showcase it on the landing page.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Product Add/Edit Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
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
                  <h2 className="text-2xl font-black text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <p className="text-sm text-gray-500">Manage product details and SEO information.</p>
                </div>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-3 rounded-2xl transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </header>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-8 space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400  ">Ownership</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Vendor</label>
                    <select 
                      value={productFormData.vendorId}
                      onChange={(e) => setProductFormData({...productFormData, vendorId: e.target.value})}
                      disabled={!!editingProduct}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none disabled:opacity-50"
                    >
                      <option value="admin">Admin (System Product)</option>
                      {approvedVendors.map(vendor => (
                        <option key={vendor.uid} value={vendor.uid}>
                          {vendor.storeName} ({vendor.vendorId || vendor.uid.substring(0, 8)})
                        </option>
                      ))}
                    </select>
                    {editingProduct && (
                      <p className="text-[10px] text-gray-400 italic">Ownership cannot be changed after creation.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400  ">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Product Name</label>
                      <input 
                        required
                        type="text" 
                        value={productFormData.name}
                        onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Category</label>
                      <input 
                        required
                        type="text" 
                        value={productFormData.category}
                        onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Description</label>
                      <button
                        type="button"
                        onClick={generateAIDescription}
                        disabled={isGeneratingDescription || !productFormData.name}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-secondary rounded-lg text-[10px] font-black   transition-all border border-red-100 disabled:opacity-50"
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
                      value={productFormData.description}
                      onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                      className="w-full h-32 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400  ">Pricing & Inventory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Price (NPR)</label>
                      <input 
                        required
                        type="number" 
                        value={productFormData.price}
                        onChange={(e) => setProductFormData({...productFormData, price: Number(e.target.value)})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Stock</label>
                      <input 
                        required
                        type="number" 
                        value={productFormData.stock}
                        onChange={(e) => setProductFormData({...productFormData, stock: Number(e.target.value)})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Status</label>
                      <select 
                        value={productFormData.status}
                        onChange={(e) => setProductFormData({...productFormData, status: e.target.value as any})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400  ">SEO Information (Optional)</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">SEO Title</label>
                      <input 
                        type="text" 
                        value={productFormData.seo.title}
                        onChange={(e) => setProductFormData({...productFormData, seo: { ...productFormData.seo, title: e.target.value }})}
                        placeholder="Search engine title"
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">SEO Description</label>
                      <textarea 
                        value={productFormData.seo.description}
                        onChange={(e) => setProductFormData({...productFormData, seo: { ...productFormData.seo, description: e.target.value }})}
                        placeholder="Search engine description"
                        className="w-full h-24 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700">Product Images</label>
                    <label className="cursor-pointer bg-red-50 text-secondary px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Upload Images
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleProductImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  
                  {isUploading && (
                    <div className="flex items-center justify-center p-4 bg-red-50 rounded-xl border border-red-100 gap-3 text-secondary">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-bold">Uploading images...</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {productFormData.images.map((url, index) => (
                      <div key={index} className="group relative aspect-square bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                        <img 
                          src={url} 
                          alt={`Product ${index + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          type="button"
                          onClick={() => setProductFormData({
                            ...productFormData,
                            images: productFormData.images.filter((_, i) => i !== index)
                          })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400  ml-1">Or Add Image URLs (Comma separated)</label>
                    <textarea 
                      value={productFormData.images.join(', ')}
                      onChange={(e) => setProductFormData({...productFormData, images: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      className="w-full h-24 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none resize-none text-sm"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={processingId === 'product-save'}
                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-white bg-secondary shadow-lg shadow-secondary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingId === 'product-save' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deletion Remark Modal */}
      <AnimatePresence>
        {isDeletionModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeletionModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl p-8"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Delete Product?</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Are you sure you want to delete <span className="font-bold text-gray-900">"{productToDelete?.name}"</span>?
                    This action cannot be undone.
                  </p>
                </div>

                <div className="w-full space-y-2 text-left">
                  <label className="text-xs font-black text-gray-400   ml-1">
                    Remark to Vendor (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                    <textarea 
                      value={deletionRemark}
                      onChange={(e) => setDeletionRemark(e.target.value)}
                      placeholder="Enter reason for deletion (e.g., prohibited item, incorrect pricing)..."
                      className="w-full h-32 pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 transition-all outline-none resize-none text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic px-1">
                    This remark will be sent as a notification to the vendor.
                  </p>
                </div>

                <div className="flex w-full gap-4 pt-4">
                  <button 
                    onClick={() => setIsDeletionModalOpen(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDeletion}
                    disabled={processingId === productToDelete?.id}
                    className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingId === productToDelete?.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                    Delete Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vendor Payout History Modal */}
      <AnimatePresence>
        {isPayoutModalOpen && selectedVendorForPayouts && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-gray-900 ">Payout History</h3>
                    {selectedVendorForPayouts.vendorId && (
                      <span className="px-2 py-0.5 bg-red-100 text-secondary text-[10px] font-black rounded-md  ">
                        {selectedVendorForPayouts.vendorId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{selectedVendorForPayouts.storeName}</p>
                </div>
                <button 
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="p-2 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-secondary animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Fetching payout records...</p>
                  </div>
                ) : vendorPayouts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No payout history found for this vendor.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-4 text-xs font-black text-gray-400  ">Date</th>
                          <th className="pb-4 text-xs font-black text-gray-400  ">Amount</th>
                          <th className="pb-4 text-xs font-black text-gray-400  ">Method</th>
                          <th className="pb-4 text-xs font-black text-gray-400  ">Account Details</th>
                          <th className="pb-4 text-xs font-black text-gray-400   text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {vendorPayouts.map((payout) => (
                          <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 text-sm text-gray-500">
                              {new Date(payout.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-sm font-black text-secondary">
                              Rs. {payout.amount.toLocaleString()}
                            </td>
                            <td className="py-4 text-sm text-gray-600 capitalize">
                              {payout.method.replace(/_/g, ' ')}
                            </td>
                            <td className="py-4 text-sm text-gray-600 max-w-[200px] truncate">
                              {payout.accountDetails}
                            </td>
                            <td className="py-4 text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black   ${
                                payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                                payout.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-red-100 text-secondary'
                              }`}>
                                {payout.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-8 py-3 bg-secondary text-white rounded-xl font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Brand Add Modal */}
      <AnimatePresence>
        {isBrandModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBrandModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Add Trusted Brand</h2>
                  <p className="text-sm text-gray-500">Showcase a new partner logo.</p>
                </div>
                <button 
                  onClick={() => setIsBrandModalOpen(false)}
                  className="p-3 rounded-2xl transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </header>

              <form onSubmit={handleSaveBrand} className="p-8 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Brand Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Samsung, Nike, Local Artisan"
                      value={brandFormData.name}
                      onChange={(e) => setBrandFormData({...brandFormData, name: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Brand Logo</label>
                      <label className="cursor-pointer bg-red-50 text-secondary px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Logo
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleBrandLogoUpload}
                          disabled={isUploading}
                        />
                      </label>
                    </div>

                    {isUploading && (
                      <div className="flex items-center justify-center p-4 bg-red-50 rounded-xl border border-red-100 gap-3 text-secondary">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-bold">Uploading logo...</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400  ml-1">Or Logo URL</label>
                      <input 
                        required
                        type="url" 
                        placeholder="https://example.com/logo.png"
                        value={brandFormData.logoUrl}
                        onChange={(e) => setBrandFormData({...brandFormData, logoUrl: e.target.value})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all outline-none"
                      />
                    </div>
                  </div>
                  {brandFormData.logoUrl && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
                      <img 
                        src={brandFormData.logoUrl} 
                        alt="Preview" 
                        className="max-h-20 object-contain"
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+URL')}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={processingId === 'brand-save'}
                    className="w-full bg-secondary text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingId === 'brand-save' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Brand
                  </button>
                </div>
              </form>
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
                  <div className="p-2 bg-red-100 rounded-xl">
                    <Scissors className="w-5 h-5 text-secondary" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">Adjust Photo</h2>
                </div>
                <button 
                  onClick={() => {
                    setIsCropping(false);
                    setImageToCrop(null);
                  }}
                  className="p-2 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

                  <div className="relative h-[400px] bg-secondary">
                    <Cropper
                      image={imageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={cropType === 'vendor-top-rated' ? 16/9 : 1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      cropShape={cropType === 'profile' ? 'round' : 'rect'}
                      showGrid={cropType === 'vendor-top-rated'}
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
                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropSave}
                    className="flex-1 px-6 py-4 bg-secondary text-white rounded-2xl font-black transition-all shadow-xl shadow-secondary/10"
                  >
                    Apply & Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
        
        {/* Hidden File Inputs for Global Use */}
        <input 
          type="file"
          ref={vendorTopRatedInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleVendorTopRatedImageUpload}
        />
        <input 
          type="file"
          ref={vendorLogoInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleVendorOfficialImageUpload(e, 'logo')}
        />
        <input 
          type="file"
          ref={vendorBannerInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleVendorOfficialImageUpload(e, 'banner')}
        />

        {/* Product Deletion Modal */}
        <AnimatePresence>
          {isDeletionModalOpen && productToDelete && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDeletionModalOpen(false)}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-2xl p-8 space-y-6"
              >
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-serif italic text-primary">Confirm Deletion</h2>
                  <p className="text-gray-500 text-sm">
                    Are you sure you want to delete <span className="font-bold text-gray-900">"{productToDelete.name}"</span>? 
                    This action cannot be undone.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400   ml-1">Admin Remark to Vendor</label>
                    <textarea 
                      rows={3}
                      value={deletionRemark}
                      onChange={(e) => setDeletionRemark(e.target.value)}
                      placeholder="Explain why this product is being removed (e.g. policy violation, low quality images...)"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 transition-all resize-none font-medium text-sm"
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setIsDeletionModalOpen(false)}
                      className="flex-1 px-8 py-4 rounded-xl font-bold text-gray-500 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmDeletion}
                      disabled={processingId === productToDelete.id}
                      className="flex-1 bg-red-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2"
                    >
                      {processingId === productToDelete.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete & Notify
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};




