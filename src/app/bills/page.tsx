'use client';

import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillForm, BillFormValues } from '@/components/bills/bill-form';
import { BillList } from '@/components/bills/bill-list';
import { PaymentForm } from '@/components/bills/payment-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { getBills, addBill as storeAddBill, updateBill as storeUpdateBill, deleteBill as storeDeleteBill, markBillAsPaid as storeMarkBillAsPaid } from '@/lib/store';
import type { Bill } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';


export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isBillFormOpen, setIsBillFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    setBills(getBills());
    
    if (typeof window !== "undefined" && window.location.hash === "#add-bill") {
      setIsBillFormOpen(true);
    }
  }, []);

  const refreshBills = () => {
    setBills(getBills());
  };

  const handleSaveBill = (billData: BillFormValues, attachmentFile?: File) => {
    if (selectedBill) { 
      const updatedBill: Bill = {
        ...selectedBill,
        ...billData,
        dueDate: billData.dueDate.toISOString(),
        category: billData.category || undefined,
      };
      storeUpdateBill(updatedBill);
      toast({ title: billData.type === 'expense' ? 'Despesa Atualizada' : 'Receita Atualizada', description: `${billData.type === 'expense' ? 'Despesa' : 'Receita'} para ${updatedBill.payeeName} salva.`});
    } else { 
      const newBillData: Omit<Bill, 'id' | 'createdAt' | 'isPaid'> = {
        payeeName: billData.payeeName,
        amount: billData.amount,
        dueDate: billData.dueDate.toISOString(),
        type: billData.type,
        category: billData.category || undefined,
        attachmentType: billData.attachmentType,
        attachmentValue: billData.attachmentValue,
      };
      storeAddBill(newBillData);
      toast({ title: billData.type === 'expense' ? 'Despesa Adicionada' : 'Receita Adicionada', description: `Nova ${billData.type === 'expense' ? 'despesa' : 'receita'} para ${billData.payeeName} criada.`});
    }
    refreshBills();
    setIsBillFormOpen(false);
    setSelectedBill(null);
  };

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsBillFormOpen(true);
  };

  const handleDeleteBill = (billId: string) => {
    const billToDelete = bills.find(b => b.id === billId);
    storeDeleteBill(billId);
    refreshBills();
    toast({ title: billToDelete?.type === 'expense' ? 'Despesa Excluída' : 'Receita Excluída', description: `A ${billToDelete?.type === 'expense' ? 'despesa' : 'receita'} foi removida.`, variant: 'destructive' });
  };

  const handleOpenPaymentForm = (bill: Bill) => {
    setSelectedBill(bill);
    setIsPaymentFormOpen(true);
  };

  const handleSavePayment = (billId: string, paymentDate: string, receiptNotes?: string) => {
    const bill = bills.find(b => b.id === billId);
    storeMarkBillAsPaid(billId, paymentDate, receiptNotes);
    refreshBills();
    setIsPaymentFormOpen(false);
    setSelectedBill(null);
    toast({ title: bill?.type === 'expense' ? 'Pagamento Registrado': 'Recebimento Registrado', description: `A ${bill?.type === 'expense' ? 'despesa' : 'receita'} foi marcada como ${bill?.type === 'expense' ? 'paga' : 'recebida'}.`});
  };
  
  const FormDialogComponent = isMobile ? Sheet : Dialog;
  const FormDialogContentComponent = isMobile ? SheetContent : DialogContent;


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Gerenciar Transações</h1>
          <Button onClick={() => { setSelectedBill(null); setIsBillFormOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Transação
          </Button>
      </div>

      <BillList
        bills={bills}
        onEditBill={handleEditBill}
        onDeleteBill={handleDeleteBill}
        onMarkAsPaid={handleOpenPaymentForm} // "Paid" here means paid for expense, received for income
      />

      <FormDialogComponent open={isBillFormOpen} onOpenChange={(open) => {
          setIsBillFormOpen(open);
          if (!open) setSelectedBill(null);
        }}>
        <FormDialogContentComponent side={isMobile ? 'bottom' : undefined} className={isMobile ? "h-[90vh] overflow-y-auto" : "sm:max-w-lg"}>
          <DialogHeader>
            <DialogTitle>{selectedBill ? (selectedBill.type === 'expense' ? 'Editar Despesa' : 'Editar Receita') : 'Adicionar Nova Transação'}</DialogTitle>
            <DialogDescription>
              {selectedBill ? `Modifique os detalhes da ${selectedBill.type === 'expense' ? 'despesa' : 'receita'} selecionada.` : 'Preencha os detalhes da nova despesa ou receita.'}
            </DialogDescription>
          </DialogHeader>
          <div className={isMobile ? "p-4" : "py-4"}>
            <BillForm
              bill={selectedBill}
              onSave={handleSaveBill}
              onCancel={() => {setIsBillFormOpen(false); setSelectedBill(null);}}
            />
          </div>
        </FormDialogContentComponent>
      </FormDialogComponent>

      {selectedBill && (
         <FormDialogComponent open={isPaymentFormOpen} onOpenChange={(open) => {
            setIsPaymentFormOpen(open);
            if (!open) setSelectedBill(null);
          }}>
          <FormDialogContentComponent side={isMobile ? 'bottom' : undefined} className={isMobile ? "h-auto" : "sm:max-w-md"}>
             <DialogHeader>
                <DialogTitle>{selectedBill.type === 'expense' ? 'Registrar Pagamento' : 'Registrar Recebimento'}</DialogTitle>
                <DialogDescription>
                  {selectedBill.type === 'expense' 
                    ? `Confirme os detalhes do pagamento para ${selectedBill.payeeName}.`
                    : `Confirme os detalhes do recebimento de ${selectedBill.payeeName}.`}
                </DialogDescription>
             </DialogHeader>
             <div className={isMobile ? "p-4" : "py-4"}>
              <PaymentForm
                bill={selectedBill}
                onSave={handleSavePayment}
                onCancel={() => {setIsPaymentFormOpen(false); setSelectedBill(null);}}
              />
            </div>
          </FormDialogContentComponent>
        </FormDialogComponent>
      )}
    </div>
  );
}
