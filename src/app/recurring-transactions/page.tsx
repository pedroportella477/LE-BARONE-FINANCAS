
'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecurringBillForm, RecurringBillFormValues } from '@/components/recurring-transactions/recurring-bill-form';
import { RecurringBillList } from '@/components/recurring-transactions/recurring-bill-list';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { getRecurringBills, addRecurringBill as storeAddRecurringBill, updateRecurringBill as storeUpdateRecurringBill, deleteRecurringBill as storeDeleteRecurringBill } from '@/lib/store';
import type { RecurringBill } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export default function RecurringTransactionsPage() {
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [selectedRecurringBill, setSelectedRecurringBill] = useState<RecurringBill | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    refreshRecurringBills();
  }, []);

  const refreshRecurringBills = () => {
    setRecurringBills(getRecurringBills());
  };

  const handleSave = (data: RecurringBillFormValues) => {
    const recurringBillData = {
      payeeName: data.payeeName,
      amount: data.amount,
      type: data.type,
      category: data.category || undefined,
      frequency: data.frequency,
      interval: data.interval,
      startDate: data.startDate.toISOString().split('T')[0], // Store as YYYY-MM-DD
      endDate: data.endDate ? data.endDate.toISOString().split('T')[0] : undefined,
    };

    if (selectedRecurringBill) {
      storeUpdateRecurringBill({ 
        ...selectedRecurringBill, 
        ...recurringBillData,
        // nextDueDate might need recalculation based on changes, handled by store or later logic
      });
      toast({ title: 'Lançamento Recorrente Atualizado', description: `Recorrência para ${recurringBillData.payeeName} salva.` });
    } else {
      storeAddRecurringBill(recurringBillData);
      toast({ title: 'Lançamento Recorrente Adicionado', description: `Nova recorrência para ${recurringBillData.payeeName} criada.` });
    }
    refreshRecurringBills();
    setIsFormOpen(false);
    setSelectedRecurringBill(null);
  };

  const handleEdit = (recurringBill: RecurringBill) => {
    setSelectedRecurringBill(recurringBill);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const billToDelete = recurringBills.find(b => b.id === id);
    storeDeleteRecurringBill(id);
    refreshRecurringBills();
    toast({ title: 'Lançamento Recorrente Excluído', description: `A recorrência de ${billToDelete?.payeeName} foi removida.`, variant: 'destructive' });
  };
  
  const FormComponent = isMobile ? Sheet : Dialog;
  const FormContentComponent = isMobile ? SheetContent : DialogContent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Repeat className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-primary">Lançamentos Recorrentes</h1>
        </div>
        <Button onClick={() => { setSelectedRecurringBill(null); setIsFormOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Recorrência
        </Button>
      </div>
      <p className="text-muted-foreground">
        Gerencie despesas e receitas que se repetem periodicamente. As transações individuais serão geradas automaticamente no futuro.
      </p>

      <RecurringBillList
        recurringBills={recurringBills}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormComponent open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedRecurringBill(null);
        }}>
        <FormContentComponent side={isMobile ? 'bottom' : undefined} className={isMobile ? "h-[95vh] overflow-y-auto" : "sm:max-w-lg"}>
          <DialogHeader className={isMobile ? "p-4" : ""}>
            <DialogTitle>{selectedRecurringBill ? 'Editar Lançamento Recorrente' : 'Adicionar Novo Lançamento Recorrente'}</DialogTitle>
            <DialogDescription>
              {selectedRecurringBill ? 'Modifique os detalhes da recorrência.' : 'Preencha os detalhes do novo lançamento recorrente.'}
            </DialogDescription>
          </DialogHeader>
          <div className={isMobile ? "p-4 pt-0" : "py-4"}>
            <RecurringBillForm
              recurringBill={selectedRecurringBill}
              onSave={handleSave}
              onCancel={() => {setIsFormOpen(false); setSelectedRecurringBill(null);}}
            />
          </div>
        </FormContentComponent>
      </FormComponent>
    </div>
  );
}
