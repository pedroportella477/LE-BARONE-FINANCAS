import type { UserProfile, Bill } from '@/types';

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
  // Ensure all bills have a type, default to 'expense' for old data
  // Ensure all bills have category as optional
  return bills ? JSON.parse(bills).map((bill: any) => ({ ...bill, type: bill.type || 'expense', category: bill.category })) : [];
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
    category: bill.category || undefined, // Ensure category is handled
  };
  const updatedBills = [...bills, newBill];
  saveBills(updatedBills);
  return newBill;
};

export const updateBill = (updatedBill: Bill): void => {
  let bills = getBills();
  bills = bills.map(bill => (bill.id === updatedBill.id ? { ...bill, ...updatedBill, category: updatedBill.category || undefined } : bill));
  saveBills(bills);
};

export const deleteBill = (billId: string): void => {
  let bills = getBills();
  bills = bills.filter(bill => bill.id !== billId);
  saveBills(bills);
};

export const markBillAsPaid = (billId: string, paymentDate: string, receiptUrl?: string): Bill | undefined => {
  const bills = getBills();
  const billIndex = bills.findIndex(b => b.id === billId);
  if (billIndex === -1) return undefined;

  const updatedBill = {
    ...bills[billIndex],
    isPaid: true,
    paymentDate: paymentDate,
    paymentReceipt: receiptUrl,
  };
  bills[billIndex] = updatedBill;
  saveBills(bills);
  return updatedBill;
};
