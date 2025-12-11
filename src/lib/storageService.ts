import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';

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

export class StorageService {
  private getStoragePath(userId: string, fileName: string, type: 'knowledge' = 'knowledge'): string {
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
}

export const storageService = new StorageService();
