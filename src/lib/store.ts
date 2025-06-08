
import type { UserProfile, Bill, RecurringBill, RecurrenceFrequency } from '@/types';
import { defaultExpenseCategories, defaultIncomeCategories, defaultCategoryForAttachment } from './categories';
import { addDays, addWeeks, addMonths, addYears, formatISO, parseISO, isBefore, isEqual, startOfDay } from 'date-fns';

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
    dueDate: billData.dueDate, // Should be YYYY-MM-DD
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
    paymentDate: paymentDate, // Should be YYYY-MM-DD
    paymentReceipt: receiptNotes,
  };
  bills[billIndex] = updatedBill;
  saveBills(bills);
  return updatedBill;
};

// --- Recurring Bills ---

export const calculateNextDueDate = (
  currentOrStartDateStr: string, // YYYY-MM-DD
  frequency: RecurrenceFrequency,
  interval: number
): string => {
  const currentOrStartDate = parseISO(currentOrStartDateStr);
  let nextDate: Date;
  switch (frequency) {
    case 'daily':
      nextDate = addDays(currentOrStartDate, interval);
      break;
    case 'weekly':
      nextDate = addWeeks(currentOrStartDate, interval);
      break;
    case 'monthly':
      nextDate = addMonths(currentOrStartDate, interval);
      break;
    case 'yearly':
      nextDate = addYears(currentOrStartDate, interval);
      break;
    default:
      throw new Error('Invalid recurrence frequency');
  }
  return formatISO(nextDate, { representation: 'date' });
};

export const getRecurringBills = (): RecurringBill[] => {
  if (typeof window === 'undefined') return [];
  const storedRecurringBills = localStorage.getItem(RECURRING_BILLS_KEY);
  if (!storedRecurringBills) return [];
  try {
    const parsed = JSON.parse(storedRecurringBills) as RecurringBill[];
    // Ensure all necessary fields have default or valid values
    return parsed.map(rb => ({
      ...rb,
      id: rb.id || Date.now().toString(),
      payeeName: rb.payeeName || 'N/A',
      amount: Number(rb.amount) || 0,
      type: rb.type || 'expense',
      frequency: rb.frequency || 'monthly',
      interval: Number(rb.interval) || 1,
      startDate: rb.startDate || formatISO(new Date(), { representation: 'date' }),
      nextDueDate: rb.nextDueDate || rb.startDate || formatISO(new Date(), { representation: 'date' }),
      createdAt: rb.createdAt || new Date().toISOString(),
      category: rb.category || null,
      endDate: rb.endDate || null,
      lastGeneratedDate: rb.lastGeneratedDate || null,
    }));
  } catch (error) {
    console.error("Error parsing recurring bills from localStorage:", error);
    localStorage.removeItem(RECURRING_BILLS_KEY);
    return [];
  }
};

export const saveRecurringBills = (recurringBills: RecurringBill[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RECURRING_BILLS_KEY, JSON.stringify(recurringBills));
};

export const addRecurringBill = (
  data: Omit<RecurringBill, 'id' | 'createdAt' | 'nextDueDate' | 'lastGeneratedDate'>
): RecurringBill => {
  const recurringBills = getRecurringBills();
  
  const newRecurringBill: RecurringBill = {
    ...data,
    id: Date.now().toString() + Math.random().toString().slice(2, 8),
    createdAt: new Date().toISOString(),
    nextDueDate: data.startDate, // Initial next due date is the start date
    lastGeneratedDate: null, 
    category: data.category || null,
    endDate: data.endDate || null,
  };
  const updatedRecurringBills = [...recurringBills, newRecurringBill];
  saveRecurringBills(updatedRecurringBills);
  return newRecurringBill;
};

export const updateRecurringBill = (updatedData: RecurringBill): void => {
  let recurringBills = getRecurringBills();
  // Ensure nextDueDate is recalculated if startDate, frequency, or interval changes significantly
  // For simplicity, if editing, we assume nextDueDate might need to be preserved or smartly updated by the form/caller.
  // However, if `startDate` is changed to be after `nextDueDate`, `nextDueDate` should become `startDate`.
  let finalData = { ...updatedData };
  if (parseISO(finalData.startDate) > parseISO(finalData.nextDueDate)) {
    finalData.nextDueDate = finalData.startDate;
  }

  recurringBills = recurringBills.map(rb =>
    rb.id === finalData.id ? { ...rb, ...finalData, category: finalData.category || null, endDate: finalData.endDate || null } : rb
  );
  saveRecurringBills(recurringBills);
};

export const deleteRecurringBill = (recurringBillId: string): void => {
  let recurringBills = getRecurringBills();
  recurringBills = recurringBills.filter(rb => rb.id !== recurringBillId);
  saveRecurringBills(recurringBills);
};


export const processRecurringBills = (): { generatedCount: number, updatedBills: Bill[] } => {
  if (typeof window === 'undefined') return { generatedCount: 0, updatedBills: getBills() };

  let allBills = getBills();
  const recurringBills = getRecurringBills();
  const today = startOfDay(new Date());
  let generatedCount = 0;
  const updatedRecurringDefinitions: RecurringBill[] = [];

  recurringBills.forEach(rb => {
    let currentNextDueDate = parseISO(rb.nextDueDate);
    const rbStartDate = parseISO(rb.startDate);

    // Ensure nextDueDate is not before startDate
    if (isBefore(currentNextDueDate, rbStartDate)) {
      currentNextDueDate = rbStartDate;
      rb.nextDueDate = formatISO(currentNextDueDate, { representation: 'date' });
    }
    
    let instancesToCreateForThisRb = 0;

    while (
      (isBefore(currentNextDueDate, today) || isEqual(currentNextDueDate, today)) &&
      (!rb.endDate || isBefore(currentNextDueDate, parseISO(rb.endDate)) || isEqual(currentNextDueDate, parseISO(rb.endDate)))
    ) {
      // Check if an instance for this specific recurring bill and this specific due date already exists
      const instanceExists = allBills.some(
        bill => bill.recurringBillId === rb.id && bill.dueDate === formatISO(currentNextDueDate, { representation: 'date' })
      );

      if (!instanceExists) {
        const newBillData: Omit<Bill, 'id' | 'createdAt' | 'isPaid'> = {
          payeeName: rb.payeeName,
          amount: rb.amount,
          dueDate: formatISO(currentNextDueDate, { representation: 'date' }),
          type: rb.type,
          category: rb.category || null,
          recurringBillId: rb.id,
        };
        const createdBill = addBill(newBillData, true); // Pass true for isInstanceFromRecurring
        allBills = [...allBills, createdBill]; // Manually update allBills for subsequent checks within this loop
        generatedCount++;
        instancesToCreateForThisRb++;
        rb.lastGeneratedDate = formatISO(currentNextDueDate, { representation: 'date' });
      }
      
      // Calculate the next due date based on the *current* (just processed) due date
      const nextIterationDueDate = calculateNextDueDate(formatISO(currentNextDueDate, {representation: 'date'}), rb.frequency, rb.interval);
      currentNextDueDate = parseISO(nextIterationDueDate);
      rb.nextDueDate = nextIterationDueDate; // Update recurring bill's next due date for saving
      
      // Safety break for misconfiguration or very long intervals catching up
      if (instancesToCreateForThisRb > 100) { // Arbitrary limit
          console.warn(`Recurring bill ${rb.id} generated over 100 instances in one go. Breaking to prevent infinite loop.`);
          break;
      }
    }
    updatedRecurringDefinitions.push(rb);
  });

  if (generatedCount > 0) {
    saveRecurringBills(updatedRecurringDefinitions);
    // saveBills(allBills) is called within addBill, but if we modified allBills directly without calling addBill each time, we'd need it here.
    // Since addBill calls saveBills, it's okay for now.
  }
  
  return { generatedCount, updatedBills: getBills() }; // Return the latest state of bills
};
