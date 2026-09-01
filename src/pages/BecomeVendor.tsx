import React, { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, onSnapshot, getDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '../components/BackButton';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Store, CheckCircle, ArrowRight, Loader2, Upload, FileText, Building2, Image as ImageIcon, AlertCircle, Shield, Clock, XCircle, RefreshCw } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { uploadImage } from '../lib/storage';
import { VendorStore } from '../types';

export const BecomeVendor = () => {
  const { profile, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorData, setVendorData] = useState<VendorStore | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    if (!user || authLoading) {
      if (!authLoading && !user) setIsLoadingStatus(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'vendors', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as VendorStore;
        setVendorData(data);
        
        // If rejected, we might want to pre-fill the form with previous data
        if (data.status === 'rejected') {
          setFormData(prev => ({
            ...prev,
            storeName: data.storeName || '',
            legalName: data.legalName || '',
            description: data.description || '',
            shopLocation: data.shopLocation || '',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone || '',
            logoUrl: data.logoUrl || 'https://picsum.photos/seed/logo/200/200',
            panNumber: data.panNumber || '',
            panCardUrl: data.kycDetails?.panCardUrl || '',
            businessRegistrationNumber: data.kycDetails?.businessRegistrationNumber || '',
            businessRegistrationUrl: data.kycDetails?.businessRegistrationUrl || ''
          }));
        }
      } else {
        setVendorData(null);
      }
      setIsLoadingStatus(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `vendors/${user.uid}`);
      setIsLoadingStatus(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (authLoading || isLoadingStatus) return;
    
    if (profile?.role === 'vendor' && !profile?.hasPendingVendorApplication) {
      navigate('/vendor-dashboard', { replace: true });
    } else if (vendorData?.status === 'approved') {
      navigate('/vendor-dashboard', { replace: true });
    }
  }, [profile, vendorData, authLoading, isLoadingStatus, navigate]);

  const [formData, setFormData] = useState({
    storeName: '',
    legalName: '',
    description: '',
    shopLocation: '',
    contactEmail: '',
    contactPhone: '',
    logoUrl: 'https://picsum.photos/seed/logo/200/200',
    panNumber: '',
    panCardUrl: '',
    businessRegistrationNumber: '',
    businessRegistrationUrl: ''
  });

  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'panCardUrl' | 'businessRegistrationUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      setError("Please log in to upload documents.");
      return;
    }

    console.log(`Starting upload for ${field}:`, file.name, file.type, file.size);

    // Show local preview immediately
    if (file.type.startsWith('image/')) {
      const localUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [field]: localUrl }));
    } else if (file.type === 'application/pdf') {
      setPreviews(prev => ({ ...prev, [field]: 'pdf' }));
    }

    setUploadingField(field);
    try {
      let fileToUpload = file;
      
      // Compress if it's an image
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          initialQuality: 0.7
        };
        try {
          fileToUpload = await imageCompression(file, options);
        } catch (compressErr) {
          console.error("Compression failed, uploading original:", compressErr);
        }
      }

      const downloadURL = await uploadImage(fileToUpload, 'vendor_documents');
      console.log(`Upload successful for ${field}:`, downloadURL);
      setFormData(prev => ({ ...prev, [field]: downloadURL }));
    } catch (err: any) {
      console.error(`Upload failed for ${field}:`, err);
      setError(err.message || "Failed to upload document. Please try again.");
      // Clear preview on error
      setPreviews(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!formData.panCardUrl) {
      setError("Please upload your PAN card document.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Uniqueness check for PAN
      const panDocRef = doc(db, 'pan_registry', formData.panNumber);
      const panDoc = await getDoc(panDocRef);
      if (panDoc.exists()) {
        const existingData = panDoc.data();
        if (existingData.uid !== user.uid) {
          throw new Error("This PAN/VAT number is already registered with another business.");
        }
      }

      const batch = writeBatch(db);
      
      // 2. Create/Update public vendor document
      const vendorRef = doc(db, 'vendors', user.uid);
      const publicData = {
        uid: user.uid,
        storeName: formData.storeName,
        legalName: formData.legalName,
        storeSlug: formData.storeName.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        shopLocation: formData.shopLocation,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        logoUrl: formData.logoUrl,
        status: 'pending',
        commissionRate: 12,
        balance: vendorData?.balance || 0,
        createdAt: vendorData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      batch.set(vendorRef, publicData, { merge: true });

      // 3. Create/Update private KYC document
      const kycRef = doc(db, 'vendors', user.uid, 'private', 'kyc');
      const kycData = {
        panNumber: formData.panNumber,
        panCardUrl: formData.panCardUrl,
        businessRegistrationNumber: formData.businessRegistrationNumber,
        businessRegistrationUrl: formData.businessRegistrationUrl,
        updatedAt: new Date().toISOString()
      };
      batch.set(kycRef, kycData);

      // 4. Registry update
      batch.set(panDocRef, { uid: user.uid });

      // 5. Update user profile
      batch.set(doc(db, 'users', user.uid), {
        hasPendingVendorApplication: true
      }, { merge: true });

      await batch.commit();

      setStep(3); // Success step
    } catch (err: any) {
      console.error("Error registering vendor:", err);
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (vendorData?.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">Application Pending</h1>
        <p className="text-gray-500 mb-8">We've received your application! Our team is currently reviewing it. This usually takes 24-48 hours.</p>
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8 max-w-md mx-auto text-left">
          <h3 className="text-xs font-black text-gray-400   mb-4">Application Details</h3>
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-900">{vendorData.storeName}</p>
            <p className="text-xs text-gray-500">{vendorData.description}</p>
            <div className="pt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md  ">
                Status: {vendorData.status}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (vendorData?.status === 'rejected') {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">Application Rejected</h1>
        <p className="text-gray-500 mb-8">Unfortunately, your application was not approved at this time.</p>
        
        {vendorData.adminNotes && (
          <div className="bg-red-50 p-6 rounded-3xl border border-red-100 mb-8 max-w-md mx-auto text-left">
            <h3 className="text-xs font-black text-red-400   mb-2">Feedback from Admin</h3>
            <p className="text-sm text-red-700 leading-relaxed italic">"{vendorData.adminNotes}"</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => {
              // Reset status to allow re-applying
              setVendorData(null);
              setStep(2);
            }}
            className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Re-apply with Changes
          </button>
          <button 
            onClick={() => navigate('/')}
            className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <BackButton />
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between mb-2">
          {['Introduction', 'Store Details', 'Verification', 'Review'].map((s, i) => (
            <span key={i} className={`text-xs font-bold   ${step > i ? 'text-primary' : 'text-gray-400'}`}>
              {s}
            </span>
          ))}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-secondary"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto">
                <Store className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-gray-900  text-center">Sell on Bazaar</h1>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto text-center">
                Join thousands of local artisans and businesses reaching customers across the region. 
                <span className="block mt-2 font-bold text-secondary">Policy Update: Any business with a registered PAN or VAT can now register as a vendor.</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: '12% Commission', desc: 'Flat rate for all vendors.', icon: CheckCircle },
                { title: 'Local Support', desc: '24/7 dedicated support team.', icon: Building2 },
                { title: 'Fast Payouts', desc: 'Get paid within 48 hours.', icon: Clock }
              ].map((feat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <feat.icon className="w-8 h-8 text-secondary mb-4" />
                  <h3 className="font-bold text-gray-900 mb-1">{feat.title}</h3>
                  <p className="text-xs text-gray-500">{feat.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#111] rounded-[2.5rem] p-10 text-white text-center">
              <button 
                onClick={() => setStep(2)}
                className="bg-secondary text-white px-10 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 mx-auto shadow-xl shadow-red-900/20"
              >
                Start Application <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 p-6 sm:p-10 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Store Details */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary" /> Store Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400  ml-1">Store Name</label>
                      <input 
                        required
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleInputChange}
                        placeholder="e.g. Himalayan Crafts"
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400  ml-1">Legal Name (as per PAN/VAT)</label>
                      <input 
                        required
                        name="legalName"
                        value={formData.legalName}
                        onChange={handleInputChange}
                        placeholder="Full Registered Name"
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400  ml-1">Description</label>
                      <textarea 
                        required
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Tell us about your store..."
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400  ml-1">Physical Shop Location</label>
                      <input 
                        required
                        name="shopLocation"
                        value={formData.shopLocation}
                        onChange={handleInputChange}
                        placeholder="Full Address or Google Maps Link"
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" /> Contact Information
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400  ml-1">Contact Email</label>
                        <input 
                          required
                          type="email"
                          name="contactEmail"
                          value={formData.contactEmail}
                          onChange={handleInputChange}
                          placeholder="vendor@example.com"
                          className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400  ml-1">Contact Phone</label>
                        <input 
                          required
                          type="tel"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          placeholder="+977 98XXXXXXXX"
                          className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold flex items-center gap-2 pt-4">
                    <FileText className="w-5 h-5 text-primary" /> Verification
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">
                    Any business with a registered PAN or VAT is eligible to sell on BazaarNepal. Please provide your details below.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400  ml-1">PAN / VAT Number</label>
                      <input 
                        required
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleInputChange}
                        placeholder="Enter PAN or VAT Number"
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400   ml-1">PAN/VAT Card Image</label>
                        <div className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl text-center transition-all overflow-hidden min-h-[120px] ${formData.panCardUrl || previews.panCardUrl ? 'border-secondary bg-primary/5' : 'border-gray-100 hover:border-secondary/20'}`}>
                          <input 
                            id="panCardUrl"
                            type="file" 
                            accept="image/*,application/pdf" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                            onChange={(e) => handleFileUpload(e, 'panCardUrl')}
                            disabled={!!uploadingField}
                          />
                          {uploadingField === 'panCardUrl' && !previews.panCardUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-primary animate-spin" />
                              <span className="text-[10px] font-bold text-primary ">Uploading...</span>
                            </div>
                          ) : (formData.panCardUrl || previews.panCardUrl) ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              {previews.panCardUrl === 'pdf' || (formData.panCardUrl && formData.panCardUrl.toLowerCase().endsWith('.pdf')) ? (
                                <div className="flex flex-col items-center gap-2">
                                  <FileText className="w-12 h-12 text-primary" />
                                  <span className="text-[10px] font-bold text-primary ">PDF Document</span>
                                </div>
                              ) : (
                                <img src={previews.panCardUrl || formData.panCardUrl} className="w-full h-24 object-cover rounded-lg" alt="PAN Preview" />
                              )}
                              {uploadingField === 'panCardUrl' ? (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-lg">
                                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                  <span className="text-[8px] font-bold text-primary  mt-1">Uploading...</span>
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                  <Upload className="w-6 h-6 text-white" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-300 mb-2" />
                              <span className="text-[10px] font-bold text-gray-400 ">Click to Upload</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400   ml-1">Business Reg. (Optional)</label>
                        <div className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl text-center transition-all overflow-hidden min-h-[120px] ${formData.businessRegistrationUrl || previews.businessRegistrationUrl ? 'border-secondary bg-primary/5' : 'border-gray-100 hover:border-secondary/20'}`}>
                          <input 
                            id="businessRegistrationUrl"
                            type="file" 
                            accept="image/*,application/pdf" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                            onChange={(e) => handleFileUpload(e, 'businessRegistrationUrl')}
                            disabled={!!uploadingField}
                          />
                          {uploadingField === 'businessRegistrationUrl' && !previews.businessRegistrationUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-primary animate-spin" />
                              <span className="text-[10px] font-bold text-primary ">Uploading...</span>
                            </div>
                          ) : (formData.businessRegistrationUrl || previews.businessRegistrationUrl) ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              {previews.businessRegistrationUrl === 'pdf' || (formData.businessRegistrationUrl && formData.businessRegistrationUrl.toLowerCase().endsWith('.pdf')) ? (
                                <div className="flex flex-col items-center gap-2">
                                  <FileText className="w-12 h-12 text-primary" />
                                  <span className="text-[10px] font-bold text-primary ">PDF Document</span>
                                </div>
                              ) : (
                                <img src={previews.businessRegistrationUrl || formData.businessRegistrationUrl} className="w-full h-24 object-cover rounded-lg" alt="Reg Preview" />
                              )}
                              {uploadingField === 'businessRegistrationUrl' ? (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-lg">
                                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                  <span className="text-[8px] font-bold text-primary  mt-1">Uploading...</span>
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                  <Upload className="w-6 h-6 text-white" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-300 mb-2" />
                              <span className="text-[10px] font-bold text-gray-400 ">Click to Upload</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-400  ml-1">Business Reg. Number (Optional)</label>
                      <input 
                        name="businessRegistrationNumber"
                        value={formData.businessRegistrationNumber}
                        onChange={handleInputChange}
                        placeholder="Enter Registration Number"
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-8 py-4 rounded-2xl font-bold text-gray-500 transition-all order-2 sm:order-1"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-secondary text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-12"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-gray-900">Application Submitted!</h1>
              <p className="text-gray-500 text-lg max-w-md mx-auto">
                Our team is reviewing your details. This usually takes 24-48 hours. We'll notify you via email once your store is approved.
              </p>
            </div>
            <button 
              onClick={() => navigate('/vendor-dashboard', { state: { justRegistered: true } })}
              className="bg-secondary text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-secondary/10"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



