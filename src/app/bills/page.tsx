'use client';

import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillForm } from '@/components/bills/bill-form';
import { BillList } from '@/components/bills/bill-list';
import { PaymentForm } from '@/components/bills/payment-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { getBills, saveBills, addBill as storeAddBill, updateBill as storeUpdateBill, deleteBill as storeDeleteBill, markBillAsPaid as storeMarkBillAsPaid } from '@/lib/store';
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
    
    // Check for URL hash to open add bill dialog
    if (typeof window !== "undefined" && window.location.hash === "#add-bill") {
      setIsBillFormOpen(true);
      // Optional: remove the hash
      // window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const refreshBills = () => {
    setBills(getBills());
  };

  const handleSaveBill = (billData: any /* BillFormValues */, attachmentFile?: File) => {
    // console.log("Bill data from form:", billData);
    // console.log("Attachment file:", attachmentFile);

    if (selectedBill) { // Editing existing bill
      const updatedBill: Bill = {
        ...selectedBill,
        ...billData,
        dueDate: billData.dueDate.toISOString(),
        // Handle attachment saving logic here if implementing file uploads
        // For simplicity, attachmentValue from form is used directly
      };
      storeUpdateBill(updatedBill);
      toast({ title: 'Conta Atualizada', description: `Conta para ${updatedBill.payeeName} salva.`});
    } else { // Adding new bill
      const newBillData = {
        payeeName: billData.payeeName,
        amount: billData.amount,
        dueDate: billData.dueDate.toISOString(),
        attachmentType: billData.attachmentType,
        attachmentValue: billData.attachmentValue,
      };
      storeAddBill(newBillData);
      toast({ title: 'Conta Adicionada', description: `Nova conta para ${billData.payeeName} criada.`});
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
    storeDeleteBill(billId);
    refreshBills();
    toast({ title: 'Conta Excluída', description: 'A conta foi removida com sucesso.', variant: 'destructive' });
  };

  const handleOpenPaymentForm = (bill: Bill) => {
    setSelectedBill(bill);
    setIsPaymentFormOpen(true);
  };

  const handleSavePayment = (billId: string, paymentDate: string, receiptNotes?: string) => {
    storeMarkBillAsPaid(billId, paymentDate, receiptNotes);
    refreshBills();
    setIsPaymentFormOpen(false);
    setSelectedBill(null);
    toast({ title: 'Pagamento Registrado', description: 'A conta foi marcada como paga.'});
  };
  
  const FormDialogComponent = isMobile ? Sheet : Dialog;
  const FormDialogContentComponent = isMobile ? SheetContent : DialogContent;


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Gerenciar Contas</h1>
          <Button onClick={() => { setSelectedBill(null); setIsBillFormOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Conta
          </Button>
      </div>

      <BillList
        bills={bills}
        onEditBill={handleEditBill}
        onDeleteBill={handleDeleteBill}
        onMarkAsPaid={handleOpenPaymentForm}
      />

      <FormDialogComponent open={isBillFormOpen} onOpenChange={(open) => {
          setIsBillFormOpen(open);
          if (!open) setSelectedBill(null);
        }}>
        {/* Trigger is handled by button above/edit actions */}
        <FormDialogContentComponent side={isMobile ? 'bottom' : undefined} className={isMobile ? "h-[90vh] overflow-y-auto" : "sm:max-w-lg"}>
          <DialogHeader>
            <DialogTitle>{selectedBill ? 'Editar Conta' : 'Adicionar Nova Conta'}</DialogTitle>
            <DialogDescription>
              {selectedBill ? 'Modifique os detalhes da conta selecionada.' : 'Preencha os detalhes da nova conta a pagar.'}
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
                <DialogTitle>Registrar Pagamento</DialogTitle>
                <DialogDescription>Confirme os detalhes do pagamento para {selectedBill.payeeName}.</DialogDescription>
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
