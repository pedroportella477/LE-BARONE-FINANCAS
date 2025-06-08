
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
  const storedBills = localStorage.getItem(BILLS_KEY);
  if (!storedBills) return [];
  
  try {
    const parsedBills = JSON.parse(storedBills) as Array<any>;
    if (!Array.isArray(parsedBills)) {
        console.warn("Bills from localStorage is not an array.");
        return []; 
    }

    return parsedBills.map((bill: any): Bill => {
      let categoryToSet: string | null = null;
      if (bill.category && typeof bill.category === 'string' && bill.category.trim() !== '') {
        categoryToSet = bill.category;
      } else if (bill.category === null) { // Explicitly keep null if it was stored as null
        categoryToSet = null;
      }
      // Any other case (undefined, empty string, wrong type) defaults to null implicitly via initialization

      return { 
        id: String(bill.id || Date.now().toString() + Math.random().toString()),
        payeeName: String(bill.payeeName || 'N/A'),
        amount: Number(bill.amount || 0), 
        dueDate: String(bill.dueDate || new Date().toISOString()), 
        type: bill.type === 'income' ? 'income' : 'expense', 
        category: categoryToSet, 
        isPaid: Boolean(bill.isPaid || false),
        createdAt: String(bill.createdAt || new Date().toISOString()),
        attachmentType: bill.attachmentType && ['pdf', 'pix', 'barcode'].includes(bill.attachmentType) ? bill.attachmentType : undefined,
        attachmentValue: typeof bill.attachmentValue === 'string' ? bill.attachmentValue : undefined,
        paymentDate: typeof bill.paymentDate === 'string' ? bill.paymentDate : undefined,
        paymentReceipt: typeof bill.paymentReceipt === 'string' ? bill.paymentReceipt : undefined,
      };
    }).filter(bill => bill.id && bill.payeeName && bill.dueDate && bill.createdAt);
  } catch (error) {
    console.error("Error parsing bills from localStorage:", error);
    localStorage.removeItem(BILLS_KEY); // Clear potentially corrupted data
    return []; 
  }
};

export const saveBills = (bills: Bill[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
};

export const addBill = (billData: Omit<Bill, 'id' | 'createdAt' | 'isPaid'>): Bill => {
  const bills = getBills();
  const newBill: Bill = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    isPaid: false,
    payeeName: billData.payeeName,
    amount: billData.amount,
    dueDate: billData.dueDate,
    type: billData.type,
    category: billData.category || null, // category from form is string | null
    attachmentType: billData.attachmentType,
    attachmentValue: billData.attachmentValue,
  };
  
  const updatedBills = [...bills, newBill];
  saveBills(updatedBills);
  return newBill;
};

export const updateBill = (updatedBillData: Bill): void => {
  let bills = getBills();
  bills = bills.map(bill => (bill.id === updatedBillData.id ? { 
    ...bill, // Preserve existing fields not being updated
    ...updatedBillData, 
    category: updatedBillData.category || null, 
  } : bill));
  saveBills(bills);
};

export const deleteBill = (billId: string): void => {
  if (typeof window === 'undefined') return;
  let bills = getBills();
  bills = bills.filter(bill => bill.id !== billId);
  saveBills(bills);
};

export const markBillAsPaid = (billId: string, paymentDate: string, receiptNotes?: string): Bill | undefined => {
  if (typeof window === 'undefined') return undefined;
  const bills = getBills();
  const billIndex = bills.findIndex(b => b.id === billId);
  if (billIndex === -1) return undefined;

  const updatedBill: Bill = {
    ...bills[billIndex],
    isPaid: true,
    paymentDate: paymentDate,
    paymentReceipt: receiptNotes,
  };
  bills[billIndex] = updatedBill;
  saveBills(bills);
  return updatedBill;
};
