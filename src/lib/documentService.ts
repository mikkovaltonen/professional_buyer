import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { InsuranceDocument } from '@/types/documents';

export const documentService = {
  // Add a new document
  async addDocument(document: Omit<InsuranceDocument, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'insurance_documents'), document);
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  },

  // Get user's documents
  async getUserDocuments(userId: string): Promise<InsuranceDocument[]> {
    try {
      const q = query(
        collection(db, 'insurance_documents'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InsuranceDocument[];
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  },

  // Delete a document
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'insurance_documents', documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}; 