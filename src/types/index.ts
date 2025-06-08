
export interface UserProfile {
  name: string;
  monthlyIncome: number;
}

export interface Bill {
  id: string;
  payeeName: string;
  amount: number;
  dueDate: string; // ISO string date
  type: 'expense' | 'income';
  category?: string | null;
  attachmentType?: 'pdf' | 'pix' | 'barcode';
  attachmentValue?: string; // file path for PDF, or string for pix/barcode
  isPaid: boolean;
  paymentDate?: string; // ISO string date
  paymentReceipt?: string; // file path for receipt
  createdAt: string; // ISO string date
  recurringBillId?: string; // Optional: link to the parent recurring bill
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringBill {
  id: string;
  payeeName: string;
  amount: number;
  type: 'expense' | 'income';
  category?: string | null;
  frequency: RecurrenceFrequency;
  interval: number; // e.g., if frequency is 'monthly' and interval is 2, it means every 2 months
  startDate: string; // ISO string date (YYYY-MM-DD)
  endDate?: string | null; // ISO string date (YYYY-MM-DD), optional
  nextDueDate: string; // ISO string date (YYYY-MM-DD), calculated
  lastGeneratedDate?: string | null; // ISO string date (YYYY-MM-DD), to track up to when instances were generated
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
