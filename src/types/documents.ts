export interface InsuranceDocument {
  id?: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'current' | 'proposal';
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
} 