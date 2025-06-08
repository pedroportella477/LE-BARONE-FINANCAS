
import type { UserProfile, Bill } from '@/types';
import { defaultExpenseCategories, defaultIncomeCategories, defaultCategoryForAttachment } from './categories';

const USER_PROFILE_KEY = 'lebaroneFinancasUserProfile';
const BILLS_KEY = 'lebaroneFinancasBills';
const EXPENSE_CATEGORIES_KEY = 'lebaroneFinancasExpenseCategories';
const INCOME_CATEGORIES_KEY = 'lebaroneFinancasIncomeCategories';

// --- User Profile ---
export const getUserProfile = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const profile = localStorage.getItem(USER_PROFILE_KEY);
  return profile ? JSON.parse(profile) : null;
};

export const saveUserProfile = (profile: UserProfile): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

// --- Categories ---
const initializeCategories = (key: string, defaultCategories: string[], specialDefault?: string): string[] => {
  if (typeof window === 'undefined') return [...defaultCategories];
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  let initialCategories = [...defaultCategories];
  if (specialDefault && !initialCategories.includes(specialDefault)) {
    initialCategories.push(specialDefault);
  }
  localStorage.setItem(key, JSON.stringify(initialCategories));
  return initialCategories;
};

export const getExpenseCategories = (): string[] => {
  return initializeCategories(EXPENSE_CATEGORIES_KEY, defaultExpenseCategories, defaultCategoryForAttachment);
};

export const getIncomeCategories = (): string[] => {
  return initializeCategories(INCOME_CATEGORIES_KEY, defaultIncomeCategories);
};

const saveCategories = (key: string, categories: string[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(categories));
};

export const addExpenseCategory = (category: string): string[] => {
  const categories = getExpenseCategories();
  if (!categories.includes(category) && category.trim() !== '') {
    const newCategories = [...categories, category.trim()];
    saveCategories(EXPENSE_CATEGORIES_KEY, newCategories);
    return newCategories;
  }
  return categories;
};

export const addIncomeCategory = (category: string): string[] => {
  const categories = getIncomeCategories();
  if (!categories.includes(category) && category.trim() !== '') {
    const newCategories = [...categories, category.trim()];
    saveCategories(INCOME_CATEGORIES_KEY, newCategories);
    return newCategories;
  }
  return categories;
};

export const deleteExpenseCategory = (categoryToDelete: string): string[] => {
  let categories = getExpenseCategories();
  categories = categories.filter(category => category !== categoryToDelete);
  saveCategories(EXPENSE_CATEGORIES_KEY, categories);
  // Also update bills that might use this category? For now, no. Bill keeps the string.
  return categories;
};

export const deleteIncomeCategory = (categoryToDelete: string): string[] => {
  let categories = getIncomeCategories();
  categories = categories.filter(category => category !== categoryToDelete);
  saveCategories(INCOME_CATEGORIES_KEY, categories);
  return categories;
};


// --- Bills ---
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
      } else if (bill.category === null) { 
        categoryToSet = null;
      }
      
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
    localStorage.removeItem(BILLS_KEY); 
    return []; 
  }
};

export const saveBills = (bills: Bill[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
};

export const addBill = (billData: Omit<Bill, 'id' | 'createdAt' | 'isPaid'>): Bill => {
  const bills = getBills();
  
  // Ensure "Anexo Importado" category exists if used
  if (billData.type === 'expense' && billData.category === defaultCategoryForAttachment) {
    addExpenseCategory(defaultCategoryForAttachment);
  }

  const newBill: Bill = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    isPaid: false,
    payeeName: billData.payeeName,
    amount: billData.amount,
    dueDate: billData.dueDate,
    type: billData.type,
    category: billData.category || null,
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
    ...bill, 
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
