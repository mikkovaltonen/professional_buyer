export type PurchaseRequisitionStatus = 'draft' | 'verified' | 'approved' | 'rejected';

export interface PurchaseRequisitionHeader {
  templateBatchName: string; // Työkirjan nimi
  locationCode: string; // Varasto / sijainti
  startDate: string; // ISO date
  endDate: string; // ISO date
  responsibilityCenterOrBuyer: string; // Vastuuhenkilö / ostaja
  notes?: string; // Perustelut / muistiinpano
}

export interface PurchaseRequisitionLine {
  itemNoOrDescription: string; // Tuote / kuvaus
  quantity: number; // Määrä
  unitOfMeasure: string; // Yksikkö
  requestedDate: string; // ISO date for Due/Requested Date
  vendorNoOrName?: string; // Toimittajaehdotus
  directUnitCost?: number; // Yksikköhinta
  currency?: string; // Valuutta
}

export interface PurchaseRequisition {
  id?: string;
  userId: string;
  status: PurchaseRequisitionStatus;
  header: PurchaseRequisitionHeader;
  lines: PurchaseRequisitionLine[];
  createdAt: Date;
  updatedAt: Date;
  verification?: {
    verifiedAt: Date;
    verifiedBy: string;
    note?: string;
  };
}


