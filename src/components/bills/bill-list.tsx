'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, CheckCircle, AlertCircle, FileText, Ticket, Barcode, MoreVertical, CircleDollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Bill } from '@/types';
import { cn } from '@/lib/utils';

interface BillListProps {
  bills: Bill[];
  onEditBill: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
  onMarkAsPaid: (bill: Bill) => void;
}

const AttachmentIcon = ({ type }: { type?: 'pdf' | 'pix' | 'barcode' }) => {
  if (type === 'pdf') return <FileText className="h-4 w-4 text-muted-foreground" />;
  if (type === 'pix') return <Ticket className="h-4 w-4 text-muted-foreground" />;
  if (type === 'barcode') return <Barcode className="h-4 w-4 text-muted-foreground" />;
  return null;
};

export function BillList({ bills, onEditBill, onDeleteBill, onMarkAsPaid }: BillListProps) {
  if (bills.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Nenhuma conta cadastrada ainda.</p>;
  }

  const sortedBills = [...bills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                .sort((a,b) => (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0));


  return (
    <div className="space-y-4">
      {sortedBills.map((bill) => {
        const isOverdue = !bill.isPaid && new Date(bill.dueDate) < new Date(new Date().toDateString()); // Compare dates only
        return (
          <Card key={bill.id} className={cn("shadow-md transition-all hover:shadow-lg", bill.isPaid && "opacity-70 bg-secondary/30", isOverdue && "border-destructive")}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{bill.payeeName}</CardTitle>
                  <CardDescription className={cn(isOverdue && "text-destructive font-semibold")}>
                    Vence em: {format(new Date(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    {bill.attachmentType && bill.attachmentValue && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <AttachmentIcon type={bill.attachmentType} />
                        <span className="text-xs">{bill.attachmentType === 'pdf' ? 'PDF' : bill.attachmentType.toUpperCase()}</span>
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Badge variant={bill.isPaid ? 'default' : isOverdue ? 'destructive' : 'secondary'} className={cn(bill.isPaid ? "bg-green-600 hover:bg-green-700 text-white" : isOverdue ? "" : "bg-yellow-500 hover:bg-yellow-600 text-white")}>
                  {bill.isPaid ? <CheckCircle className="mr-1 h-4 w-4" /> : isOverdue ? <AlertCircle className="mr-1 h-4 w-4" /> : null}
                  {bill.isPaid ? 'Paga' : isOverdue ? 'Vencida' : 'Pendente'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-semibold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
              </div>
              {bill.isPaid && bill.paymentDate && (
                <p className="text-sm text-green-700 mt-1">
                  Pago em: {format(new Date(bill.paymentDate), 'dd/MM/yyyy', { locale: ptBR })}
                  {bill.paymentReceipt && ` (${bill.paymentReceipt})`}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!bill.isPaid && (
                    <DropdownMenuItem onClick={() => onMarkAsPaid(bill)}>
                      <CircleDollarSign className="mr-2 h-4 w-4" />
                      Marcar como Paga
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onEditBill(bill)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">Excluir</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a conta de "{bill.payeeName}" no valor de R$ {bill.amount.toFixed(2)}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteBill(bill.id)}
                          className={buttonVariants({variant: "destructive"})}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

// Helper to get buttonVariants for AlertDialogAction destructive style
// This is a workaround as AlertDialogAction doesn't directly accept variant prop in some shadcn versions
// This should be imported from '@/components/ui/button'
const buttonVariants = ({ variant }: { variant: "destructive" | "default" | "outline" | "secondary" | "ghost" | "link" | null | undefined }) => {
  if (variant === "destructive") return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  return ""; // Default or other variants
};
