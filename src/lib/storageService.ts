import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export interface KnowledgeDocument {
  id?: string;
  name: string;
  originalFormat: string;
  content?: string; // Store content directly for small files
  storageUrl?: string; // Optional - for large files using Storage
  downloadUrl?: string; // Optional - for large files using Storage
  size: number;
  uploadedAt: Date;
  userId: string;
  type: 'internal-knowledge';
}

export interface ERPDocument {
  id?: string;
  name: string;
  originalFormat: string;
  content?: string; // Store content as CSV/JSON for Excel files
  rawData?: any[][]; // Parsed Excel data as array of arrays
  headers?: string[]; // Column headers
  storageUrl?: string; // Optional - for large files using Storage
  downloadUrl?: string; // Optional - for large files using Storage
  size: number;
  uploadedAt: Date;
  userId: string;
  type: 'erp-integration';
  sheets?: string[]; // Excel sheet names
}

export class StorageService {
  private getStoragePath(userId: string, fileName: string, type: 'knowledge' | 'erp' = 'knowledge'): string {
    return `${type}/${userId}/${Date.now()}_${fileName}`;
  }

  async uploadDocument(
    file: File, 
    userId: string,
    originalFormat: string = 'md'
  ): Promise<KnowledgeDocument> {
    try {
      // Read file content
      const content = await file.text();
      
      // Save directly to Firestore (avoiding Storage CORS issues)
      const docData = {
        name: file.name,
        originalFormat,
        content, // Store content directly in Firestore
        size: file.size,
        uploadedAt: new Date(),
        userId,
        type: 'internal-knowledge' as const
      };

      const docRef = await addDoc(collection(db, 'knowledge'), docData);
      
      return {
        id: docRef.id,
        ...docData,
        storageUrl: '', // Not using storage
        downloadUrl: '' // Not using storage
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('Failed to upload document');
    }
  }

  async getUserDocuments(userId: string): Promise<KnowledgeDocument[]> {
    try {
      const q = query(
        collection(db, 'knowledge'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KnowledgeDocument[];
      
      // Sort by uploadedAt on client side until index is created
      return documents.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  async deleteDocument(documentId: string, storagePath?: string): Promise<void> {
    try {
      // Delete from storage if using storage
      if (storagePath) {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'knowledge', documentId));
    } catch (error) {
      console.error('Delete failed:', error);
      throw new Error('Failed to delete document');
    }
  }

  async downloadDocument(document: KnowledgeDocument): Promise<string> {
    try {
      // If content is stored directly in Firestore
      if (document.content) {
        return document.content;
      }
      
      // Otherwise fetch from storage URL
      if (document.downloadUrl) {
        const response = await fetch(document.downloadUrl);
        if (!response.ok) {
          throw new Error('Download failed');
        }
        return await response.text();
      }
      
      throw new Error('No content available');
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download document');
    }
  }

  /**
   * Upload ERP/Excel document with parsing
   */
  async uploadERPDocument(
    file: File, 
    userId: string
  ): Promise<ERPDocument> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!['xlsx', 'xls'].includes(fileExtension || '')) {
        throw new Error('Only Excel (.xlsx, .xls) files are supported');
      }
      
      let content = '';
      let rawData: any[][] = [];
      let headers: string[] = [];
      let sheets: string[] = [];
      
      // Handle Excel files only
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      sheets = workbook.SheetNames;
      
      // Process first sheet
      const firstSheet = workbook.Sheets[sheets[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
      
      if (jsonData.length > 0) {
        headers = jsonData[0].map((h: any) => String(h || '').trim());
        rawData = jsonData.slice(1);
      }
      
      // Convert to CSV format for content
      content = XLSX.utils.sheet_to_csv(firstSheet);
      
      // Save to Firestore (convert arrays to JSON strings to avoid nested array issues)
      const docData = {
        name: file.name,
        originalFormat: fileExtension,
        content,
        rawDataJson: JSON.stringify(rawData), // Convert to JSON string
        headersJson: JSON.stringify(headers), // Convert to JSON string
        sheetsJson: JSON.stringify(sheets), // Convert to JSON string
        rowCount: rawData.length,
        columnCount: headers.length,
        size: file.size,
        uploadedAt: new Date(),
        userId,
        type: 'erp-integration' as const
      };

      const docRef = await addDoc(collection(db, 'erpDocuments'), docData);
      
      // Convert JSON strings back to arrays for return value
      return {
        id: docRef.id,
        name: docData.name,
        originalFormat: docData.originalFormat,
        content: docData.content,
        rawData: JSON.parse(docData.rawDataJson),
        headers: JSON.parse(docData.headersJson),
        sheets: JSON.parse(docData.sheetsJson),
        size: docData.size,
        uploadedAt: docData.uploadedAt,
        userId: docData.userId,
        type: docData.type,
        storageUrl: '', // Not using storage for now
        downloadUrl: '' // Not using storage for now
      };
    } catch (error) {
      console.error('ERP upload failed:', error);
      throw new Error(`Failed to upload ERP document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's ERP documents
   */
  async getUserERPDocuments(userId: string): Promise<ERPDocument[]> {
    try {
      const q = query(
        collection(db, 'erpDocuments'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          originalFormat: data.originalFormat,
          content: data.content,
          rawData: data.rawDataJson ? JSON.parse(data.rawDataJson) : [],
          headers: data.headersJson ? JSON.parse(data.headersJson) : [],
          sheets: data.sheetsJson ? JSON.parse(data.sheetsJson) : [],
          size: data.size,
          uploadedAt: data.uploadedAt,
          userId: data.userId,
          type: data.type,
          storageUrl: data.storageUrl || '',
          downloadUrl: data.downloadUrl || ''
        };
      }) as ERPDocument[];
      
      // Sort by uploadedAt on client side
      return documents.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to fetch ERP documents:', error);
      throw new Error('Failed to fetch ERP documents');
    }
  }

  /**
   * Delete ERP document
   */
  async deleteERPDocument(documentId: string, storagePath?: string): Promise<void> {
    try {
      // Delete from storage if using storage
      if (storagePath) {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'erpDocuments', documentId));
    } catch (error) {
      console.error('Delete failed:', error);
      throw new Error('Failed to delete ERP document');
    }
  }

  /**
   * Download ERP document
   */
  async downloadERPDocument(document: ERPDocument): Promise<string> {
    try {
      // Return CSV content
      if (document.content) {
        return document.content;
      }
      
      throw new Error('No content available');
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download ERP document');
    }
  }
}

export const storageService = new StorageService();