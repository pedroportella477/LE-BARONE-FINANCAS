
'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalForm, GoalFormValues } from '@/components/financial-goals/goal-form';
import { GoalList } from '@/components/financial-goals/goal-list';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { getFinancialGoals, addFinancialGoal as storeAddFinancialGoal, updateFinancialGoal as storeUpdateFinancialGoal, deleteFinancialGoal as storeDeleteFinancialGoal } from '@/lib/store';
import type { FinancialGoal } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export default function FinancialGoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    refreshGoals();
  }, []);

  const refreshGoals = () => {
    setGoals(getFinancialGoals());
  };

  const handleSave = (data: GoalFormValues) => {
    const goalData: Omit<FinancialGoal, 'id' | 'createdAt'> = {
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      targetDate: data.targetDate ? data.targetDate.toISOString().split('T')[0] : undefined,
      icon: data.icon === 'none' ? undefined : data.icon,
    };

    if (selectedGoal) {
      storeUpdateFinancialGoal({ 
        ...selectedGoal, 
        ...goalData,
      });
      toast({ title: 'Meta Atualizada', description: `Meta "${goalData.name}" salva.` });
    } else {
      storeAddFinancialGoal(goalData);
      toast({ title: 'Meta Adicionada', description: `Nova meta "${goalData.name}" criada.` });
    }
    refreshGoals();
    setIsFormOpen(false);
    setSelectedGoal(null);
  };

  const handleEdit = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const goalToDelete = goals.find(g => g.id === id);
    storeDeleteFinancialGoal(id);
    refreshGoals();
    toast({ title: 'Meta Excluída', description: `A meta "${goalToDelete?.name}" foi removida.`, variant: 'destructive' });
  };
  
  const FormComponent = isMobile ? Sheet : Dialog;
  const FormContentComponent = isMobile ? SheetContent : DialogContent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-primary">Metas Financeiras</h1>
        </div>
        <Button onClick={() => { setSelectedGoal(null); setIsFormOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Meta
        </Button>
      </div>
      <p className="text-muted-foreground">
        Defina e acompanhe seus objetivos financeiros.
      </p>

      <GoalList
        goals={goals}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormComponent open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedGoal(null);
        }}>
        <FormContentComponent side={isMobile ? 'bottom' : undefined} className={isMobile ? "h-auto" : "sm:max-w-lg"}>
          <DialogHeader className={isMobile ? "p-4" : ""}>
            <DialogTitle>{selectedGoal ? 'Editar Meta Financeira' : 'Adicionar Nova Meta Financeira'}</DialogTitle>
            <DialogDescription>
              {selectedGoal ? 'Modifique os detalhes da sua meta.' : 'Preencha os detalhes da sua nova meta financeira.'}
            </DialogDescription>
          </DialogHeader>
          <div className={isMobile ? "p-4 pt-0" : "py-4"}>
            <GoalForm
              goal={selectedGoal}
              onSave={handleSave}
              onCancel={() => {setIsFormOpen(false); setSelectedGoal(null);}}
            />
          </div>
        </FormContentComponent>
      </FormComponent>
    </div>
  );
}
