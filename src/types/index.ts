export interface UserProfile {
  name: string;
  monthlyIncome: number;
}

export interface Bill {
  id: string;
  payeeName: string;
  amount: number;
  dueDate: string; // ISO string date
  attachmentType?: 'pdf' | 'pix' | 'barcode';
  attachmentValue?: string; // file path for PDF, or string for pix/barcode
  isPaid: boolean;
  paymentDate?: string; // ISO string date
  paymentReceipt?: string; // file path for receipt
  createdAt: string; // ISO string date
}

export interface Payment {
  billId: string;
  paymentDate: string; // ISO string date
  receiptFile?: File; // For upload
  receiptUrl?: string; // For display/storage
}

export interface AttachmentData {
  payeeName: string;
  amount: number;
  dueDate: string;
  paymentDetails?: string;
}
