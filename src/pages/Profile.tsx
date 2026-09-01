import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { uploadImage } from '../lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { User, Camera, Save, Loader2, CheckCircle2, AlertCircle, X, ZoomIn, ZoomOut, Scissors } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';

export const Profile = () => {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  if (!profile || !user) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('login_to_view_profile')}</h1>
      </div>
    );
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('upload_image_error'));
      return;
    }

    // Validate file size (max 40MB)
    if (file.size > 40 * 1024 * 1024) {
      setError(t('image_size_error'));
      return;
    }

    setError(null);
    setSuccess(null);

    // Load image for cropping
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result as string);
      setIsCropping(true);
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setIsCropping(false);
    setIsUploading(true);
    setError(null);

    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      console.log(`[Profile] Processing cropped image: ${(croppedImage.size / 1024).toFixed(2)} KB`);
      
      // Show preview immediately
      const objectUrl = URL.createObjectURL(croppedImage);
      setPreviewURL(objectUrl);

      let downloadURL: string;
      try {
        // Try uploading to Firebase Storage first
        downloadURL = await uploadImage(croppedImage, `profiles/${user.uid}`);
        console.log('[Profile] Image uploaded to Storage successfully');
      } catch (storageErr: any) {
        console.warn('[Profile] Firebase Storage upload failed, using Base64 fallback:', storageErr);
        // Fallback to Base64 if Storage fails (safe for profile pics < 1MB)
        downloadURL = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(croppedImage);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
        });
      }
      
      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL
      });
      
      setSuccess(t('profile_pic_updated'));
      URL.revokeObjectURL(objectUrl);
      setPreviewURL(null);
    } catch (err: any) {
      console.error('Profile Update Error:', err);
      const errorMessage = err.code ? `[${err.code}] ${err.message}` : (err.message || 'Failed to process image.');
      setError(`${t('checkout_failed')} ${errorMessage}.`);
      setPreviewURL(null);
    } finally {
      setIsUploading(false);
      setImageToCrop(null);
    }
  };

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

        // Limit output size to 800x800 for faster uploads
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
          const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
          resolve(file);
        }, 'image/jpeg', 0.8);
      };
      image.onerror = () => reject(new Error('Failed to load image'));
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError(t('name_empty_error'));
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim()
      });
      
      setSuccess(t('profile_updated'));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      setError(t('checkout_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <BackButton />
      
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 ">{t('profile_settings_title')}</h1>
        <p className="text-gray-500 mt-2 font-medium">{t('profile_settings_desc')}</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-12">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-12">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-red-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-secondary text-4xl font-black">
                {previewURL || profile.photoURL ? (
                  <img 
                    src={previewURL || profile.photoURL || ''} 
                    alt={profile.displayName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  profile.displayName[0]
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                      <span className="text-[10px] text-white font-bold  ">{t('processing')}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isCropping}
                className="absolute bottom-0 right-0 p-3 bg-secondary text-white rounded-full shadow-lg transition-all transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <p className="mt-4 text-xs font-bold text-gray-400  ">Profile Picture</p>
          </div>

          {/* Cropping Modal */}
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
                      <h2 className="text-xl font-black text-gray-900">{t('adjust_photo')}</h2>
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
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      cropShape="round"
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
                        className="flex-1 px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold transition-all"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleCropSave}
                        className="flex-1 px-6 py-4 bg-secondary text-white rounded-2xl font-black transition-all shadow-xl shadow-secondary/10"
                      >
                        {t('apply_save')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Form Section */}
          <form onSubmit={handleSaveProfile} className="space-y-8">
            <div>
              <label className="block text-xs font-black text-gray-400   mb-3">
                {t('full_name')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                  placeholder={t('full_name')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400   mb-3">
                {t('email_address')}
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="block w-full px-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 font-bold cursor-not-allowed"
              />
              <p className="mt-2 text-[10px] text-gray-400 italic">{t('email_change_warning')}</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-bold"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {success}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSaving || isUploading || displayName === profile.displayName}
              className="w-full bg-secondary text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {t('saving_changes')}
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  {t('save_profile')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};



