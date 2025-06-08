
import type { UserProfile, Bill } from '@/types';
import { defaultCategoryForAttachment } from './categories';

const USER_PROFILE_KEY = 'lebaroneFinancasUserProfile';
const BILLS_KEY = 'lebaroneFinancasBills';

// User Profile
export const getUserProfile = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const profile = localStorage.getItem(USER_PROFILE_KEY);
  return profile ? JSON.parse(profile) : null;
};

export const saveUserProfile = (profile: UserProfile): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

// Bills
export const getBills = (): Bill[] => {
  if (typeof window === 'undefined') return [];
  const bills = localStorage.getItem(BILLS_KEY);
  return bills ? JSON.parse(bills).map((bill: any) => ({ 
    ...bill, 
    type: bill.type || 'expense', 
    category: bill.category === undefined ? null : bill.category 
  })) : [];
};

export const saveBills = (bills: Bill[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
};

export const addBill = (bill: Omit<Bill, 'id' | 'createdAt' | 'isPaid'>): Bill => {
  const bills = getBills();
  const newBill: Bill = {
    ...bill,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    isPaid: false,
    category: bill.category === undefined ? null : bill.category,
  };
  // Ensure attachment-parsed bills get the default category if none is provided
  if (bill.category === defaultCategoryForAttachment && !newBill.category) {
    newBill.category = defaultCategoryForAttachment;
  }
  
  const updatedBills = [...bills, newBill];
  saveBills(updatedBills);
  return newBill;
};

export const updateBill = (updatedBill: Bill): void => {
  let bills = getBills();
  bills = bills.map(bill => (bill.id === updatedBill.id ? { ...bill, ...updatedBill, category: updatedBill.category === undefined ? null : updatedBill.category } : bill));
  saveBills(bills);
};

export const deleteBill = (billId: string): void => {
  let bills = getBills();
  bills = bills.filter(bill => bill.id !== billId);
  saveBills(bills);
};

export const markBillAsPaid = (billId: string, paymentDate: string, receiptNotes?: string): Bill | undefined => {
  const bills = getBills();
  const billIndex = bills.findIndex(b => b.id === billId);
  if (billIndex === -1) return undefined;

  const updatedBill = {
    ...bills[billIndex],
    isPaid: true,
    paymentDate: paymentDate,
    paymentReceipt: receiptNotes,
  };
  bills[billIndex] = updatedBill;
  saveBills(bills);
  return updatedBill;
};
