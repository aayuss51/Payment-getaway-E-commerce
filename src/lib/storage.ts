import { 
  ref, 
  uploadBytes, 
  getDownloadURL
} from 'firebase/storage';
import { storage } from '../firebase';
import imageCompression from 'browser-image-compression';

/**
 * Uploads an image to Firebase Storage with timeout.
 * Falls back to Base64 string if upload fails.
 */
export const uploadImage = async (
  file: File | Blob, 
  folder: string = 'general', 
  useFallback: boolean = true
): Promise<string> => {
  const timestamp = Date.now();
  const fileName = file instanceof File ? file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase() : `image_${timestamp}.jpg`;
  
  let fileToUpload = file;

  // Compress if it's an image
  if (file.type.startsWith('image/')) {
    try {
      console.log(`[Storage] Optimizing image: ${fileName}`);
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8,
      };
      fileToUpload = await imageCompression(file as File, options);
      console.log(`[Storage] Optimized: ${(file.size / 1024).toFixed(2)} KB -> ${(fileToUpload.size / 1024).toFixed(2)} KB`);
    } catch (compressionError) {
      console.warn('[Storage] Compression failed, uploading original:', compressionError);
    }
  }

  const storageRef = ref(storage, `${folder}/${timestamp}_${fileName}`);
  console.log(`[Storage] Starting upload to: ${storageRef.fullPath}`);

  const uploadPromise = (async () => {
    try {
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('[Storage] Upload successful! URL:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('[Storage] Upload failed:', error.code, error.message);
      if (useFallback) {
        console.log('[Storage] Attempting Base64 fallback due to error');
        return await convertToBase64(file);
      }
      throw error;
    }
  })();

  // 120-second timeout for the whole operation (increased for reliability)
  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Upload timed out after 120s'));
    }, 120000);
  });

  try {
    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.message.includes('timed out') && useFallback) {
      console.log('[Storage] Attempting Base64 fallback due to timeout');
      return await convertToBase64(file);
    }
    throw error;
  }
};

/**
 * Helper to convert File/Blob to Base64 string
 */
const convertToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
