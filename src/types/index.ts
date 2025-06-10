
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface User {
  id: string; // Firebase UID
  email: string;
  name?: string | null;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  userProfile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  monthlyIncome: number;
  cpf?: string | null;
  cellphone?: string | null;
  photoUrl?: string | null; 
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory extends Category {}
export interface IncomeCategory extends Category {}


export interface Bill {
  id: string;
  payeeName: string;
  amount: number;
  dueDate: string; // ISO string date YYYY-MM-DD
  type: 'expense' | 'income';
  isPaid: boolean;
  paymentDate?: string; // ISO string date YYYY-MM-DD
  paymentReceipt?: string;
  attachmentType?: 'pdf' | 'pix' | 'barcode';
  attachmentValue?: string;
  createdAt: string; // ISO string date
  updatedAt: string;
  userId: string;
  expenseCategoryId?: string | null;
  expenseCategory?: ExpenseCategory | null;
  incomeCategoryId?: string | null;
  incomeCategory?: IncomeCategory | null;
  recurringBillId?: string | null;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringBill {
  id: string;
  payeeName: string;
  amount: number;
  type: 'expense' | 'income';
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string; // ISO string date (YYYY-MM-DD)
  endDate?: string | null; // ISO string date (YYYY-MM-DD)
  nextDueDate: string; // ISO string date (YYYY-MM-DD)
  lastGeneratedDate?: string | null;
  createdAt: string; // ISO string date
  updatedAt: string;
  userId: string;
  expenseCategoryId?: string | null;
  expenseCategory?: ExpenseCategory | null;
  incomeCategoryId?: string | null;
  incomeCategory?: IncomeCategory | null;
}

export interface Payment {
  billId: string;
  paymentDate: string; // ISO string date
  receiptFile?: File;
  receiptUrl?: string;
}

export interface AttachmentData {
  payeeName: string;
  amount: number;
  dueDate: string;
  paymentDetails?: string;
}

export interface Budget {
  id:string;
  limit: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  expenseCategoryId: string;
  expenseCategory: ExpenseCategory; // For relation loading
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null; // ISO string date YYYY-MM-DD
  icon?: string;
  createdAt: string; // ISO string date
  updatedAt: string;
  userId: string;
}
