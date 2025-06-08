
import type { UserProfile, Bill, RecurringBill, RecurrenceFrequency } from '@/types';
import { defaultExpenseCategories, defaultIncomeCategories, defaultCategoryForAttachment } from './categories';
import { addDays, addWeeks, addMonths, addYears, formatISO } from 'date-fns';

const USER_PROFILE_KEY = 'lebaroneFinancasUserProfile';
const BILLS_KEY = 'lebaroneFinancasBills';
const EXPENSE_CATEGORIES_KEY = 'lebaroneFinancasExpenseCategories';
const INCOME_CATEGORIES_KEY = 'lebaroneFinancasIncomeCategories';
const RECURRING_BILLS_KEY = 'lebaroneFinancasRecurringBills';

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
        recurringBillId: typeof bill.recurringBillId === 'string' ? bill.recurringBillId : undefined,
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

export const addBill = (billData: Omit<Bill, 'id' | 'createdAt' | 'isPaid'>, isInstanceFromRecurring: boolean = false): Bill => {
  const bills = getBills();
  
  if (!isInstanceFromRecurring && billData.type === 'expense' && billData.category === defaultCategoryForAttachment) {
    addExpenseCategory(defaultCategoryForAttachment);
  }

  const newBill: Bill = {
    id: Date.now().toString() + Math.random().toString().slice(2, 8), // More robust ID
    createdAt: new Date().toISOString(),
    isPaid: false,
    payeeName: billData.payeeName,
    amount: billData.amount,
    dueDate: billData.dueDate,
    type: billData.type,
    category: billData.category || null,
    attachmentType: billData.attachmentType,
    attachmentValue: billData.attachmentValue,
    recurringBillId: billData.recurringBillId,
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

// --- Recurring Bills ---

export const calculateNextDueDate = (
  currentOrStartDate: Date,
  frequency: RecurrenceFrequency,
  interval: number
): Date => {
  switch (frequency) {
    case 'daily':
      return addDays(currentOrStartDate, interval);
    case 'weekly':
      return addWeeks(currentOrStartDate, interval);
    case 'monthly':
      return addMonths(currentOrStartDate, interval);
    case 'yearly':
      return addYears(currentOrStartDate, interval);
    default:
      throw new Error('Invalid recurrence frequency');
  }
};

export const getRecurringBills = (): RecurringBill[] => {
  if (typeof window === 'undefined') return [];
  const storedRecurringBills = localStorage.getItem(RECURRING_BILLS_KEY);
  return storedRecurringBills ? JSON.parse(storedRecurringBills) : [];
};

export const saveRecurringBills = (recurringBills: RecurringBill[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RECURRING_BILLS_KEY, JSON.stringify(recurringBills));
};

export const addRecurringBill = (
  data: Omit<RecurringBill, 'id' | 'createdAt' | 'nextDueDate' | 'lastGeneratedDate'>
): RecurringBill => {
  const recurringBills = getRecurringBills();
  const startDate = new Date(data.startDate);
  
  // The first 'nextDueDate' is simply the startDate if no instances have been generated yet.
  // Or, if we decide to generate the first instance immediately upon creation,
  // then nextDueDate should be startDate, and an instance is created for startDate.
  // For simplicity now, nextDueDate will be the first date an instance *should* be created.
  const nextDueDate = startDate;

  const newRecurringBill: RecurringBill = {
    ...data,
    id: Date.now().toString() + Math.random().toString().slice(2, 8),
    createdAt: new Date().toISOString(),
    nextDueDate: formatISO(nextDueDate, { representation: 'date' }),
    lastGeneratedDate: null, // No instances generated yet
    category: data.category || null,
    endDate: data.endDate || null,
  };
  const updatedRecurringBills = [...recurringBills, newRecurringBill];
  saveRecurringBills(updatedRecurringBills);
  return newRecurringBill;
};

export const updateRecurringBill = (updatedData: RecurringBill): void => {
  let recurringBills = getRecurringBills();
  recurringBills = recurringBills.map(rb =>
    rb.id === updatedData.id ? { ...rb, ...updatedData, category: updatedData.category || null, endDate: updatedData.endDate || null } : rb
  );
  saveRecurringBills(recurringBills);
};

export const deleteRecurringBill = (recurringBillId: string): void => {
  let recurringBills = getRecurringBills();
  recurringBills = recurringBills.filter(rb => rb.id !== recurringBillId);
  saveRecurringBills(recurringBills);
  // Optionally, also delete generated Bill instances? For now, no.
};
