import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import vision from '@google-cloud/vision';
import { GoogleGenAI } from "@google/genai";

admin.initializeApp();

const db = admin.firestore();
const visionClient = new vision.ImageAnnotatorClient();

// Initialize Gemini AI for embeddings
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Cloud Function: Generate Product Embedding
 * Triggered when a product is created or updated.
 * Converts product name and description into a vector for semantic search.
 */
export const onProductWrite = functions.firestore
  .document('products/{productId}')
  .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : null;
    const previousData = change.before.exists ? change.before.data() : null;

    if (!data) return null; // Document deleted

    // Check if name or description changed to avoid unnecessary API calls
    if (previousData && 
        data.name === previousData.name && 
        data.description === previousData.description &&
        data.embedding) {
      return null;
    }

    console.log(`Generating embedding for product: ${context.params.productId}`);

    try {
      const textToEmbed = `${data.name}. ${data.description}`;
      const result = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: [textToEmbed],
      });

      if (result.embeddings && result.embeddings.length > 0) {
        const embedding = result.embeddings[0].values;
        await change.after.ref.update({ 
          embedding,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Embedding updated for ${context.params.productId}`);
      }
    } catch (error) {
      console.error('Error generating product embedding:', error);
    }
    return null;
  });

/**
 * Nepal IRD Simulation
 * Verifies if the PAN number passes basic regex (9 digits)
 */
const verifyWithIRD = (panNumber: string): 'Verified' | 'Invalid' => {
  console.log(`[IRD Simulation] Verifying PAN: ${panNumber}`);
  const panRegex = /^\d{9}$/;
  if (panRegex.test(panNumber)) {
    return 'Verified';
  }
  return 'Invalid';
};

/**
 * Cloud Function: On PAN Document Upload
 * Triggered when a vendor uploads their PAN/VAT document to Storage.
 * Path: vendors/{vendorId}/documents/pan_vat.jpg
 */
export const onPanDocumentUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name; // e.g., vendors/UID123/documents/pan_vat.jpg
    if (!filePath || !filePath.includes('/documents/pan_vat')) {
      console.log('Not a PAN document upload. Skipping.');
      return null;
    }

    const pathParts = filePath.split('/');
    const vendorId = pathParts[1];

    console.log(`Processing PAN document for vendor: ${vendorId}`);

    try {
      // 1. OCR Processing with Google Cloud Vision
      const gcsUri = `gs://${object.bucket}/${filePath}`;
      const [result] = await visionClient.textDetection(gcsUri);
      const detections = result.textAnnotations;
      const fullText = detections && detections.length > 0 ? detections[0].description : '';

      if (!fullText) {
        throw new Error('No text detected in the document.');
      }

      // 2. Extract PAN (9 digits) and Business Name
      // Simple regex for 9-digit PAN
      const panMatch = fullText.match(/\b\d{9}\b/);
      const extractedPan = panMatch ? panMatch[0] : null;

      // Extracting Business Name is tricky without a fixed template.
      // For this simulation, we assume the first line or a specific keyword match.
      const lines = fullText.split('\n');
      const extractedBusinessName = lines[0].trim(); // Placeholder logic

      console.log(`Extracted PAN: ${extractedPan}`);
      console.log(`Extracted Business Name: ${extractedBusinessName}`);

      // 3. Strict Validation
      const vendorDoc = await db.collection('vendors').doc(vendorId).get();
      if (!vendorDoc.exists) {
        throw new Error(`Vendor document ${vendorId} not found.`);
      }

      const vendorData = vendorDoc.data();
      const legalName = vendorData?.legalName || '';

      let status: 'verified' | 'flagged' = 'verified';
      const flags: string[] = [];

      // Validate PAN format
      if (!extractedPan || extractedPan.length !== 9) {
        status = 'flagged';
        flags.push('Invalid PAN format (must be 9 digits)');
      }

      // Validate Business Name match (case-insensitive fuzzy match)
      if (extractedBusinessName.toLowerCase() !== legalName.toLowerCase()) {
        // In a real app, you might use a string similarity algorithm
        console.warn(`Name mismatch: Extracted "${extractedBusinessName}" vs Stored "${legalName}"`);
        status = 'flagged';
        flags.push('Business name mismatch');
      }

      // 4. Nepal IRD Simulation Check
      if (extractedPan) {
        const irdStatus = verifyWithIRD(extractedPan);
        if (irdStatus !== 'Verified') {
          status = 'flagged';
          flags.push('IRD verification failed');
        }
      }

      // 5. Update Firestore
      await db.collection('vendors').doc(vendorId).update({
        verificationStatus: status,
        panDetails: {
          extractedPan,
          extractedBusinessName,
          verificationDate: admin.firestore.FieldValue.serverTimestamp(),
          flags: flags.length > 0 ? flags : null,
          rawOcrText: fullText.substring(0, 500) // Store snippet for debugging
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Verification complete for ${vendorId}. Status: ${status}`);
      return null;

    } catch (error) {
      console.error('Error processing PAN document:', error);
      
      // Update vendor status to error/flagged if something went wrong
      await db.collection('vendors').doc(vendorId).update({
        verificationStatus: 'flagged',
        verificationError: error instanceof Error ? error.message : 'Unknown error during OCR',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });
