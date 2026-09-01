import React, { useState, useEffect } from 'react';
import { 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  collection, 
  query, 
  where, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { uploadImage } from '../../lib/storage';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  ShieldCheck, 
  FileText,
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { VendorStore } from '../../types';

const PAN_REGEX = /^[0-9]{9}$/;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const VendorRegistrationForm: React.FC = () => {
  const { user } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // PAN Validation
  const isPanValid = PAN_REGEX.test(panNumber);

  // Listen for vendor document updates (OCR results)
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'vendors', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as VendorStore;
        
        // If the document was already in 'pending' and now it's 'verified' or 'flagged'
        if (data.verificationStatus === 'verified') {
          setIsVerifying(false);
          setSuccess(true);
        } else if (data.verificationStatus === 'flagged') {
          setIsVerifying(false);
          setError("Document details do not match your profile. Please upload a clear image of your original PAN/VAT card.");
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `vendors/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        setError("Only .pdf, .jpg, or .png files are allowed.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isPanValid || !file) return;

    setIsSubmitting(true);
    setError(null);

      try {
        // 1. Duplicate Prevention: Check if PAN already exists in the secure registry
        const panDocRef = doc(db, 'pan_registry', panNumber);
        const panDoc = await getDoc(panDocRef);
        
        if (panDoc.exists()) {
          const existingData = panDoc.data();
          if (existingData.uid !== user.uid) {
            throw new Error("This PAN/VAT number is already registered with another business.");
          }
        }

        // 2. Upload Document to Storage
        const downloadUrl = await uploadImage(file, `vendors/${user.uid}/documents`);

        // 3. Create/Update Vendor Documents in a batch for atomicity
        const batch = writeBatch(db);
        
        // A. Public Vendor Document
        const vendorRef = doc(db, 'vendors', user.uid);
        const publicVendorData = {
          uid: user.uid,
          storeName,
          legalName,
          storeSlug: storeName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: '',
          status: 'pending',
          verificationStatus: 'pending',
          balance: 0,
          totalEarnings: 0,
          commissionRate: 12,
          createdAt: new Date().toISOString()
        };
        batch.set(vendorRef, publicVendorData, { merge: true });

        // B. Private KYC Document (Securely isolated)
        const kycRef = doc(db, 'vendors', user.uid, 'private', 'kyc');
        const kycData = {
          panNumber,
          panCardUrl: downloadUrl,
          updatedAt: new Date().toISOString()
        };
        batch.set(kycRef, kycData);

        // C. PAN Registry (Uniqueness enforcement)
        batch.set(panDocRef, { uid: user.uid });

        // D. Update user profile
        batch.set(doc(db, 'users', user.uid), { 
          hasPendingVendorApplication: true 
        }, { merge: true });

        await batch.commit();
        
        setIsSubmitting(false);
        setIsVerifying(true);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, 'vendors');
      }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-12 bg-white rounded-[3rem] shadow-2xl text-center space-y-8 border border-emerald-100">
        <div className="flex justify-center">
          <div className="p-6 bg-emerald-50 rounded-full">
            <CheckCircle2 className="w-20 h-20 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 ">Verified!</h2>
          <p className="text-gray-500 font-medium">Your business has been successfully verified by our AI system. Welcome to Bazaar.</p>
        </div>
        <button 
          onClick={() => window.location.href = '/vendor/dashboard'}
          className="w-full py-5 bg-secondary text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-secondary/10"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-10 bg-white rounded-[3rem] shadow-2xl border border-gray-100 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-secondary/10 rounded-3xl">
            <Store className="w-10 h-10 text-secondary" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 ">Vendor Registration</h1>
            <p className="text-gray-500 font-medium">Complete your business profile to start selling</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400   ml-1">Store Name</label>
              <input 
                required
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Kathmandu Crafts"
                className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary transition-all font-bold text-gray-900"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400   ml-1">Legal Business Name</label>
              <input 
                required
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="As per PAN/VAT card"
                className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary transition-all font-bold text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400   ml-1 flex items-center gap-2">
              PAN/VAT Number
              {panNumber && (
                isPanValid ? 
                <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </label>
            <input 
              required
              type="text"
              maxLength={9}
              value={panNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPanNumber(val);
              }}
              placeholder="9-digit number"
              className={`w-full px-6 py-5 bg-gray-50 border rounded-2xl focus:ring-2 transition-all font-mono  text-xl font-black ${
                panNumber && !isPanValid ? 'border-red-300 focus:ring-red-500 text-red-600' : 'border-gray-100 focus:ring-secondary text-gray-900'
              }`}
            />
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] text-gray-400 font-bold  ">
                Must be exactly 9 digits
              </p>
              {panNumber.length > 0 && (
                <p className={`text-[10px] font-black   ${isPanValid ? 'text-green-500' : 'text-red-400'}`}>
                  {panNumber.length}/9 Digits
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400   ml-1">PAN/VAT Certificate</label>
            <div className="relative">
              <input 
                required
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`p-10 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-5 transition-all ${
                file ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                {file ? (
                  <>
                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                      <FileText className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500 font-medium">Click to replace document</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-2xl shadow-sm transition-transform">
                      <Upload className="w-12 h-12 text-gray-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-gray-700">Upload Certificate</p>
                      <p className="text-xs text-gray-400 font-medium">PDF, JPG, or PNG (Max 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4"
              >
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-red-700 leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            disabled={!isPanValid || !file || isSubmitting || isVerifying}
            className="w-full py-6 bg-secondary text-white rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-secondary/20 disabled:opacity-50 flex items-center justify-center gap-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin" />
                Submitting...
              </>
            ) : isVerifying ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin" />
                AI Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-7 h-7 transition-transform" />
                Register Business
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 font-black   pt-4">
            <div className="h-px w-8 bg-gray-100" />
            <ShieldCheck className="w-4 h-4" />
            Bazaar Secure Verification
            <div className="h-px w-8 bg-gray-100" />
          </div>
        </form>
      </div>

      {/* Verification Overlay */}
      <AnimatePresence>
        {isVerifying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-xl"
          >
          <div className="text-center space-y-8 p-10">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl opacity-30 animate-pulse" />
              <Loader2 className="w-24 h-24 text-secondary animate-spin mx-auto relative z-10" />
              <div className="absolute inset-0 flex items-center justify-center relative z-20">
                <ShieldCheck className="w-10 h-10 text-secondary" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-gray-900 ">AI Verification</h2>
              <p className="text-gray-500 font-bold max-w-xs mx-auto leading-relaxed">
                Our system is analyzing your PAN/VAT certificate for authenticity and matching details.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="w-2 h-2 bg-secondary rounded-full"
                />
              ))}
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



