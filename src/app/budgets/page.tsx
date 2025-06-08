
'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BudgetForm, BudgetFormValues } from '@/components/budgets/budget-form';
import { BudgetList } from '@/components/budgets/budget-list';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { getBudgets, addBudget as storeAddBudget, updateBudget as storeUpdateBudget, deleteBudget as storeDeleteBudget, getExpenseCategories } from '@/lib/store';
import type { Budget } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    refreshBudgets();
    setExpenseCategories(getExpenseCategories());
  }, []);

  const refreshBudgets = () => {
    setBudgets(getBudgets());
  };

  const handleSave = (data: BudgetFormValues) => {
    const budgetData = {
      category: data.category,
      limit: data.limit,
    };

    if (selectedBudget) {
      storeUpdateBudget({ 
        ...selectedBudget, 
        ...budgetData,
      });
      toast({ title: 'Orçamento Atualizado', description: `Orçamento para ${budgetData.category} salvo.` });
    } else {
      // Check if budget for this category already exists before adding
      const existingBudget = budgets.find(b => b.category === data.category);
      if (existingBudget) {
         storeUpdateBudget({ ...existingBudget, limit: data.limit });
         toast({ title: 'Orçamento Atualizado', description: `Limite para ${data.category} atualizado.` });
      } else {
        storeAddBudget(budgetData);
        toast({ title: 'Orçamento Adicionado', description: `Novo orçamento para ${budgetData.category} criado.` });
      }
    }
    refreshBudgets();
    setIsFormOpen(false);
    setSelectedBudget(null);
  };

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const budgetToDelete = budgets.find(b => b.id === id);
    storeDeleteBudget(id);
    refreshBudgets();
    toast({ title: 'Orçamento Excluído', description: `O orçamento para ${budgetToDelete?.category} foi removido.`, variant: 'destructive' });
  };
  
  const FormComponent = isMobile ? Sheet : Dialog;
  const FormContentComponent = isMobile ? SheetContent : DialogContent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-primary">Orçamentos Mensais</h1>
        </div>
        <Button onClick={() => { setSelectedBudget(null); setIsFormOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Orçamento
        </Button>
      </div>
      <p className="text-muted-foreground">
        Defina limites de gastos mensais para suas categorias de despesa.
      </p>

      <BudgetList
        budgets={budgets}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormComponent open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedBudget(null);
        }}>
        <FormContentComponent side={isMobile ? 'bottom' : undefined} className={isMobile ? "h-auto" : "sm:max-w-md"}>
          <DialogHeader className={isMobile ? "p-4" : ""}>
            <DialogTitle>{selectedBudget ? 'Editar Orçamento' : 'Adicionar Novo Orçamento'}</DialogTitle>
            <DialogDescription>
              {selectedBudget ? 'Modifique o limite para a categoria selecionada.' : 'Defina um limite de gastos para uma categoria de despesa.'}
            </DialogDescription>
          </DialogHeader>
          <div className={isMobile ? "p-4 pt-0" : "py-4"}>
            <BudgetForm
              budget={selectedBudget}
              expenseCategories={expenseCategories}
              existingBudgetCategories={budgets.map(b => b.category)}
              onSave={handleSave}
              onCancel={() => {setIsFormOpen(false); setSelectedBudget(null);}}
            />
          </div>
        </FormContentComponent>
      </FormComponent>
    </div>
  );
}
