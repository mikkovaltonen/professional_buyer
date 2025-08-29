import { db } from './firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export interface PurchaseOrder {
  poNumber: number;
  supplierName: string;
  supplierAddress: string;
  supplierVatNo: string;
  productCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatPercent: number;
  lineAmount: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  receiveBy: string;
  pricesIncludingVat: boolean;
  vendorInvoiceNo: number;
  vendorOrderNo: number;
  giroNo: string;
  vatRegistrationNo: string;
}

export class SamplePurchaseOrderService {
  private collectionName = 'sample_purchase_orders';

  /**
   * Get all purchase orders (shared for all users)
   */
  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const q = query(collection(db, this.collectionName));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as PurchaseOrder));
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  /**
   * Search purchase orders with criteria (shared data for all users)
   */
  async searchPurchaseOrders(
    criteria: {
      supplierName?: string;
      productDescription?: string;
      buyerName?: string;
      poNumber?: number;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<PurchaseOrder[]> {
    try {
      // Get all purchase orders (shared for all users)
      const allOrders = await this.getAllPurchaseOrders();
      
      // Apply filters
      let filtered = allOrders;
      
      if (criteria.supplierName) {
        filtered = filtered.filter(order => 
          order.supplierName.toLowerCase().includes(criteria.supplierName!.toLowerCase())
        );
      }
      
      if (criteria.productDescription) {
        filtered = filtered.filter(order => 
          order.description.toLowerCase().includes(criteria.productDescription!.toLowerCase())
        );
      }
      
      if (criteria.buyerName) {
        filtered = filtered.filter(order => 
          order.buyerName.toLowerCase().includes(criteria.buyerName!.toLowerCase())
        );
      }
      
      if (criteria.poNumber) {
        filtered = filtered.filter(order => 
          order.poNumber === criteria.poNumber
        );
      }
      
      if (criteria.dateFrom) {
        filtered = filtered.filter(order => 
          order.receiveBy >= criteria.dateFrom!
        );
      }
      
      if (criteria.dateTo) {
        filtered = filtered.filter(order => 
          order.receiveBy <= criteria.dateTo!
        );
      }
      
      return filtered;
    } catch (error) {
      console.error('Error searching purchase orders:', error);
      throw error;
    }
  }
}

export const samplePurchaseOrderService = new SamplePurchaseOrderService();