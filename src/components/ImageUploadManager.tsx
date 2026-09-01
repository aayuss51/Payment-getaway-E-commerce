import React, { useState, useCallback, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { 
  Upload, X, Star, GripVertical, Image as ImageIcon, 
  Loader2, Trash2, CheckCircle2, AlertCircle, Sparkles, RefreshCw,
  ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { uploadImage } from '../lib/storage';

interface ImageUploadManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  path?: string;
}

interface UploadStatus {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const ImageUploadManager: React.FC<ImageUploadManagerProps> = ({ 
  images, 
  onChange, 
  maxImages = 8,
  path = 'products'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  const clearStatus = () => setStatus(null);

  const handleAddUrl = () => {
    if (!urlInput) return;
    if (images.length >= maxImages) {
      setStatus({ type: 'error', message: `Reached limit of ${maxImages} images.` });
      return;
    }
    // Simple URL validation
    try {
      new URL(urlInput);
      onChange([...images, urlInput]);
      setUrlInput('');
      setShowUrlInput(false);
      setStatus({ type: 'success', message: 'Image URL added successfully.' });
      setTimeout(clearStatus, 3000);
    } catch {
      setStatus({ type: 'error', message: 'Please enter a valid image URL.' });
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    
    clearStatus();
    setIsUploading(true);
    const newImages: string[] = [];
    let errorCount = 0;
    let skipCount = 0;

    const options = {
      maxSizeMB: 0.8, // Slightly more aggressive compression
      maxWidthOrHeight: 1280, // 720p/1080p equivalent is usually enough for ecommerce
      useWebWorker: true,
      initialQuality: 0.7, // Start with lower quality to speed up process
    };

    const uploadPromises = Array.from(files).map(async (file, i) => {
      if (images.length + i >= maxImages) {
        skipCount++;
        return null;
      }
      
      // Validation: Type
      if (!file.type.startsWith('image/')) {
        errorCount++;
        return null;
      }

      // Validation: Size (Max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        errorCount++;
        return null;
      }

      try {
        // Optimization Step
        const compressedFile = await imageCompression(file, options);
        // Upload to Firebase Storage
        return await uploadImage(compressedFile, path);
      } catch (error: any) {
        console.error('Upload error:', error);
        errorCount++;
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);
      newImages.push(...successfulUploads);
    } catch (error) {
      console.error('Batch upload error:', error);
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
      setStatus({ 
        type: 'success', 
        message: `Successfully uploaded and optimized ${newImages.length} image${newImages.length > 1 ? 's' : ''}.` 
      });
    }

    if (errorCount > 0 || skipCount > 0) {
      setStatus({ 
        type: 'error', 
        message: `${errorCount > 0 ? `${errorCount} file(s) failed validation. ` : ''}${skipCount > 0 ? `Reached limit of ${maxImages} images.` : ''}` 
      });
    }

    setIsUploading(false);
    setIsOptimizing(false);

    // Auto-clear success status after 3 seconds
    if (newImages.length > 0 && errorCount === 0) {
      setTimeout(clearStatus, 3000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [primary] = newImages.splice(index, 1);
    newImages.unshift(primary);
    onChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    onChange(newImages);
  };

  const handleReplaceClick = (index: number) => {
    setReplacingIndex(index);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null) return;
    
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Please select a valid image file.' });
      return;
    }

    setIsUploading(true);
    setIsOptimizing(true);
    
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      // Upload to Firebase Storage
      const downloadURL = await uploadImage(compressedFile, path);
      
      const newImages = [...images];
      newImages[replacingIndex] = downloadURL;
      onChange(newImages);
      setStatus({ type: 'success', message: 'Image replaced successfully.' });
    } catch (error: any) {
      console.error('Replacement error:', error);
      setStatus({ type: 'error', message: error.message || 'Failed to replace image.' });
    } finally {
      setIsUploading(false);
      setIsOptimizing(false);
      setReplacingIndex(null);
      if (e.target) e.target.value = '';
      setTimeout(clearStatus, 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with stats */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center shadow-inner">
            <ImageIcon className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h4 className="text-lg font-black text-gray-900 ">Product Gallery</h4>
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-gray-400  font-black ">
                {images.length} / {maxImages} Photos
              </p>
              {isOptimizing && (
                <span className="flex items-center gap-1.5 text-[10px] text-secondary font-black   animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Optimizing
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(images.length / maxImages) * 100}%` }}
              className="h-full bg-gradient-to-r from-secondary to-secondary/80"
            />
          </div>
          <span className="text-[9px] font-black text-gray-400  er">Storage Capacity</span>
        </div>
      </div>

      {/* Status Feedback */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${
              status.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                : 'bg-red-50 border-red-100 text-red-700'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-bold">{status.message}</p>
            <button 
              onClick={clearStatus}
              className="ml-auto p-2 hover:bg-black/5 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Zone */}
      {images.length < maxImages && (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative h-64 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer
              flex flex-col items-center justify-center gap-6 group overflow-hidden
              ${isDraggingOver 
                ? 'border-secondary bg-secondary/5 scale-[0.98] shadow-inner' 
                : 'border-gray-200 hover:border-secondary/40 hover:bg-gray-50/50'
              }
              ${isUploading ? 'pointer-events-none' : ''}
            `}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <input 
              ref={replaceInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleReplaceFile}
              disabled={isUploading}
            />
            
            <div className={`
              w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500
              ${isDraggingOver ? 'bg-secondary text-white rotate-12 scale-110 shadow-xl shadow-secondary/20' : 'bg-white text-gray-400 shadow-sm group-hover:text-secondary group-hover:-rotate-6'}
            `}>
              {isUploading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <Upload className="w-10 h-10" />
              )}
            </div>
            
            <div className="text-center px-8">
              <h5 className="text-lg font-black text-gray-900 ">
                {isUploading 
                  ? isOptimizing ? 'Optimizing for Web...' : 'Uploading to Cloud...' 
                  : 'Drop your product photos here'
                }
              </h5>
              <p className="text-xs text-gray-400 font-bold   mt-2">
                {isUploading ? 'Please wait a moment' : 'Or click to browse files'}
              </p>
            </div>

            {isUploading && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100">
                <motion.div 
                  className="h-full bg-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-gray-100" />
              <span className="text-[10px] font-black text-gray-300  ">or add URL manually</span>
              <span className="h-px w-8 bg-gray-100" />
            </div>

            {!showUrlInput ? (
              <button 
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="text-xs font-bold text-secondary hover:text-secondary/80 transition-colors flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> Add Image by URL
              </button>
            ) : (
              <div className="flex w-full gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <input 
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste image URL here..."
                  className="flex-1 px-5 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary transition-all text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="px-6 py-3 bg-secondary text-white rounded-xl font-bold text-sm hover:bg-secondary transition-all shadow-lg"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {images.map((url, index) => (
            <motion.div
              key={url}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`
                group relative aspect-square rounded-[2.5rem] border-2 overflow-hidden transition-all
                ${index === 0 
                  ? 'border-secondary shadow-xl shadow-secondary/10' 
                  : 'border-gray-100 hover:border-secondary/20 hover:shadow-lg'
                }
              `}
            >
              <img src={url} className="w-full h-full object-cover" alt="" />
              
              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    disabled={index === 0}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    disabled={index === images.length - 1}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReplaceClick(index)}
                    className="p-3 bg-white text-gray-900 rounded-2xl shadow-xl hover:scale-110 transition-all"
                    title="Replace"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => setPrimary(index)}
                      className="p-3 bg-secondary text-white rounded-2xl shadow-xl hover:scale-110 transition-all"
                      title="Set as Primary"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {index === 0 && (
                  <div className="bg-secondary text-white px-3 py-1 rounded-full text-[9px] font-black   flex items-center gap-1.5 shadow-lg">
                    <Star className="w-3 h-3 fill-white" />
                    Primary Image
                  </div>
                )}
                <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black   shadow-lg">
                  Photo {index + 1}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State in Grid */}
        {images.length === 0 && !isUploading && (
          <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-gray-200" />
            </div>
            <h5 className="text-xl font-black text-gray-900 ">No photos yet</h5>
            <p className="text-sm text-gray-400 font-medium mt-2">Upload at least one photo to showcase your product.</p>
          </div>
        )}
      </div>
    </div>
  );
};



