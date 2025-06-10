
import type { UserProfile, Bill, RecurringBill, RecurrenceFrequency, Budget, FinancialGoal, ExpenseCategory, IncomeCategory } from '@/types';
import { defaultExpenseCategories as appDefaultExpenseCategories, defaultIncomeCategories as appDefaultIncomeCategories, defaultCategoryForAttachment } from './categories'; // Renamed to avoid conflict
import { addDays, addWeeks, addMonths, addYears, formatISO, parseISO, isBefore, isEqual, startOfDay } from 'date-fns';

// ###################################################################################
// ## ATENÇÃO: Este arquivo (store.ts) usa localStorage e PRECISA SER REATORADO   ##
// ## para usar chamadas de API para um backend com Prisma após a configuração    ##
// ## da autenticação e das rotas de API.                                         ##
// ## As funções abaixo são placeholders e/ou podem não funcionar corretamente   ##
// ## até que a integração com o backend (Prisma + API Routes) seja concluída.   ##
// ###################################################################################


const USER_PROFILE_KEY_LEGACY = 'lebaroneFinancasUserProfile';
const BILLS_KEY_LEGACY = 'lebaroneFinancasBills';
const EXPENSE_CATEGORIES_KEY_LEGACY = 'lebaroneFinancasExpenseCategories';
const INCOME_CATEGORIES_KEY_LEGACY = 'lebaroneFinancasIncomeCategories';
const RECURRING_BILLS_KEY_LEGACY = 'lebaroneFinancasRecurringBills';
const BUDGETS_KEY_LEGACY = 'lebaroneFinancasBudgets';
const FINANCIAL_GOALS_KEY_LEGACY = 'lebaroneFinancasFinancialGoals';

// --- User Profile ---
// Esta função será substituída por uma chamada de API que busca o perfil do usuário logado.
export const getUserProfile = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  // Comentado para evitar conflito com o novo sistema de auth.
  // const profileString = localStorage.getItem(USER_PROFILE_KEY_LEGACY);
  // if (profileString) {
  //   const profile = JSON.parse(profileString);
  //   return {
  //     id: profile.id || 'legacy-profile', // Adicionar ID se não existir
  //     userId: profile.userId || 'legacy-user', // Adicionar userId se não existir
  //     name: profile.name || '',
  //     monthlyIncome: profile.monthlyIncome || 0,
  //     cpf: profile.cpf || null,
  //     cellphone: profile.cellphone || null,
  //     photoUrl: profile.photoUrl || null,
  //     createdAt: profile.createdAt || new Date().toISOString(),
  //     updatedAt: profile.updatedAt || new Date().toISOString(),
  //   };
  // }
  console.warn("getUserProfile (localStorage) está obsoleto. Use o AuthContext ou chamadas de API.");
  return null;
};

// Esta função será substituída por uma chamada de API para salvar o perfil.
export const saveUserProfile = (profile: UserProfile): void => {
  if (typeof window === 'undefined') return;
  // localStorage.setItem(USER_PROFILE_KEY_LEGACY, JSON.stringify(profile));
  console.warn("saveUserProfile (localStorage) está obsoleto. Use chamadas de API.");
};

// --- Categories ---
// Estas funções serão substituídas por chamadas de API que gerenciam categorias por usuário.
export const getExpenseCategories = (): string[] => {
  console.warn("getExpenseCategories (localStorage) está obsoleto. Categorias agora são por usuário via API.");
  return []; // Retornar vazio, pois as categorias virão do DB por usuário
};

export const getIncomeCategories = (): string[] => {
  console.warn("getIncomeCategories (localStorage) está obsoleto. Categorias agora são por usuário via API.");
  return []; // Retornar vazio
};

export const addExpenseCategory = (category: string): string[] => {
  console.warn("addExpenseCategory (localStorage) está obsoleto.");
  return [];
};

export const addIncomeCategory = (category: string): string[] => {
  console.warn("addIncomeCategory (localStorage) está obsoleto.");
  return [];
};

export const deleteExpenseCategory = (categoryToDelete: string): string[] => {
  console.warn("deleteExpenseCategory (localStorage) está obsoleto.");
  return [];
};

export const deleteIncomeCategory = (categoryToDelete: string): string[] => {
  console.warn("deleteIncomeCategory (localStorage) está obsoleto.");
  return [];
};

// --- Bills ---
// Estas funções serão substituídas por chamadas de API.
export const getBills = (): Bill[] => {
  if (typeof window === 'undefined') return [];
  console.warn("getBills (localStorage) está obsoleto.");
  return [];
};

export const saveBills = (bills: Bill[]): void => {
  if (typeof window === 'undefined') return;
  console.warn("saveBills (localStorage) está obsoleto.");
};

export const addBill = (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt' | 'isPaid' | 'userId' | 'expenseCategory' | 'incomeCategory'>, isInstanceFromRecurring: boolean = false): Bill | null => {
  console.warn("addBill (localStorage) está obsoleto.");
  // Simular uma criação de bill para não quebrar totalmente a interface, mas isso não será persistido corretamente.
  // A API real fará a persistência.
  const tempBill: Bill = {
    id: Date.now().toString() + Math.random().toString().slice(2, 8),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPaid: false,
    userId: 'temp-user-id', // Placeholder
    payeeName: billData.payeeName,
    amount: billData.amount,
    dueDate: billData.dueDate,
    type: billData.type,
    expenseCategoryId: billData.expenseCategoryId,
    incomeCategoryId: billData.incomeCategoryId,
    attachmentType: billData.attachmentType,
    attachmentValue: billData.attachmentValue,
    recurringBillId: billData.recurringBillId,
  };
  return tempBill;
};

export const updateBill = (updatedBillData: Bill): void => {
  console.warn("updateBill (localStorage) está obsoleto.");
};

export const deleteBill = (billId: string): void => {
  if (typeof window === 'undefined') return;
  console.warn("deleteBill (localStorage) está obsoleto.");
};

export const markBillAsPaid = (billId: string, paymentDate: string, receiptNotes?: string): Bill | undefined => {
  if (typeof window === 'undefined') return undefined;
  console.warn("markBillAsPaid (localStorage) está obsoleto.");
  return undefined;
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
  console.warn("getRecurringBills (localStorage) está obsoleto.");
  return [];
};

export const saveRecurringBills = (recurringBills: RecurringBill[]): void => {
  if (typeof window === 'undefined') return;
  console.warn("saveRecurringBills (localStorage) está obsoleto.");
};

export const addRecurringBill = (
  data: Omit<RecurringBill, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate' | 'lastGeneratedDate' | 'userId' | 'expenseCategory' | 'incomeCategory'>
): RecurringBill | null => {
  console.warn("addRecurringBill (localStorage) está obsoleto.");
  return null;
};

export const updateRecurringBill = (updatedData: RecurringBill): void => {
  console.warn("updateRecurringBill (localStorage) está obsoleto.");
};

export const deleteRecurringBill = (recurringBillId: string): void => {
  console.warn("deleteRecurringBill (localStorage) está obsoleto.");
};

export const processRecurringBills = (): { generatedCount: number, updatedBills: Bill[] } => {
  if (typeof window === 'undefined') return { generatedCount: 0, updatedBills: getBills() };
  console.warn("processRecurringBills (localStorage) está obsoleto. A lógica de geração será movida para o backend ou API.");
  // Esta lógica precisará ser completamente refeita para funcionar com o backend.
  // Por enquanto, retorna estado vazio para evitar erros.
  return { generatedCount: 0, updatedBills: [] };
};


// --- Budgets ---
export const getBudgets = (): Budget[] => {
  if (typeof window === 'undefined') return [];
  console.warn("getBudgets (localStorage) está obsoleto.");
  return [];
};

export const saveBudgets = (budgets: Budget[]): void => {
  if (typeof window === 'undefined') return;
  console.warn("saveBudgets (localStorage) está obsoleto.");
};

export const addBudget = (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'expenseCategory'>): Budget | null => {
   console.warn("addBudget (localStorage) está obsoleto.");
  return null;
};

export const updateBudget = (updatedBudgetData: Budget): void => {
  console.warn("updateBudget (localStorage) está obsoleto.");
};

export const deleteBudget = (budgetId: string): void => {
  console.warn("deleteBudget (localStorage) está obsoleto.");
};

// --- Financial Goals ---
export const getFinancialGoals = (): FinancialGoal[] => {
  if (typeof window === 'undefined') return [];
  console.warn("getFinancialGoals (localStorage) está obsoleto.");
  return [];
};

export const saveFinancialGoals = (goals: FinancialGoal[]): void => {
  if (typeof window === 'undefined') return;
  console.warn("saveFinancialGoals (localStorage) está obsoleto.");
};

export const addFinancialGoal = (goalData: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): FinancialGoal | null => {
  console.warn("addFinancialGoal (localStorage) está obsoleto.");
  return null;
};

export const updateFinancialGoal = (updatedGoalData: FinancialGoal): void => {
  console.warn("updateFinancialGoal (localStorage) está obsoleto.");
};

export const deleteFinancialGoal = (goalId: string): void => {
  console.warn("deleteFinancialGoal (localStorage) está obsoleto.");
};


// Default categories from the app
export const AppDefaultExpenseCategories: string[] = appDefaultExpenseCategories;
export const AppDefaultIncomeCategories: string[] = appDefaultIncomeCategories;
export const AppDefaultCategoryForAttachment: string = defaultCategoryForAttachment;
