
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, CheckCircle, AlertCircle, FileText, Ticket, Barcode, MoreVertical, CircleDollarSign, TrendingDown, TrendingUp, PackageOpen, Tag } from 'lucide-react';
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
  AlertDialogTrigger, // Adicionada a importação que faltava
} from "@/components/ui/alert-dialog";
import type { Bill } from '@/types';
import { cn } from '@/lib/utils';

interface BillListProps {
  bills: Bill[];
  onEditBill: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
  onMarkAsPaid: (bill: Bill) => void; // "Paid" means paid for expense, received for income
}

const AttachmentIcon = ({ type }: { type?: 'pdf' | 'pix' | 'barcode' }) => {
  if (type === 'pdf') return <FileText className="h-4 w-4 text-muted-foreground" />;
  if (type === 'pix') return <Ticket className="h-4 w-4 text-muted-foreground" />;
  if (type === 'barcode') return <Barcode className="h-4 w-4 text-muted-foreground" />;
  return null;
};

export function BillList({ bills, onEditBill, onDeleteBill, onMarkAsPaid }: BillListProps) {
  if (bills.length === 0) {
    return (
      <div className="text-center py-12">
        <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold text-foreground">Nenhuma transação cadastrada.</p>
        <p className="text-muted-foreground">Adicione suas despesas e receitas para começar.</p>
      </div>
    );
  }
  
  const sortedBills = [...bills]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .sort((a,b) => (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0));


  return (
    <div className="space-y-4">
      {sortedBills.map((bill) => {
        const isOverdue = !bill.isPaid && new Date(bill.dueDate) < new Date(new Date().toDateString());
        const isExpense = bill.type === 'expense';

        let statusText = '';
        let statusIcon = null;
        let badgeVariant: "default" | "destructive" | "secondary" | "outline" = 'secondary';
        let badgeBgColor = '';

        if (bill.isPaid) {
          statusText = isExpense ? 'Paga' : 'Recebida';
          statusIcon = <CheckCircle className="mr-1 h-4 w-4" />;
          badgeVariant = 'default';
          badgeBgColor = isExpense ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white';
        } else if (isOverdue) {
          statusText = isExpense ? 'Vencida' : 'Receb. Atrasado';
          statusIcon = <AlertCircle className="mr-1 h-4 w-4" />;
          badgeVariant = 'destructive';
        } else {
          statusText = isExpense ? 'Pendente' : 'A Receber';
          badgeVariant = 'secondary';
          badgeBgColor = isExpense ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white';
        }
        

        return (
          <Card 
            key={bill.id} 
            className={cn(
              "shadow-md transition-all hover:shadow-lg", 
              bill.isPaid && "opacity-80 bg-card",
              isOverdue && !bill.isPaid && "border-destructive",
              !isExpense && !bill.isPaid && "border-sky-500",
              !isExpense && bill.isPaid && "opacity-80 bg-card"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center">
                    {isExpense ? <TrendingDown className="mr-2 h-5 w-5 text-destructive" /> : <TrendingUp className="mr-2 h-5 w-5 text-green-600" />}
                    {bill.payeeName}
                  </CardTitle>
                  <CardDescription className={cn("mt-1", isOverdue && "text-destructive font-semibold")}>
                    {isExpense ? 'Vence em: ' : 'Receber em: '} {format(new Date(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    {isExpense && bill.attachmentType && bill.attachmentValue && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <AttachmentIcon type={bill.attachmentType} />
                        <span className="text-xs">{bill.attachmentType === 'pdf' ? 'PDF' : bill.attachmentType.toUpperCase()}</span>
                      </span>
                    )}
                  </CardDescription>
                   {bill.category && (
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <Tag className="mr-1 h-3 w-3" />
                      {bill.category}
                    </div>
                  )}
                </div>
                <Badge variant={badgeVariant} className={cn(badgeBgColor, !badgeBgColor && "text-white")}>
                  {statusIcon}
                  {statusText}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className={cn("text-2xl font-semibold", isExpense ? "text-destructive" : "text-green-600")}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
              </div>
              {bill.isPaid && bill.paymentDate && (
                <p className={cn("text-sm mt-1", isExpense ? "text-green-700" : "text-sky-700")}>
                  {isExpense ? 'Pago em: ' : 'Recebido em: '} {format(new Date(bill.paymentDate), 'dd/MM/yyyy', { locale: ptBR })}
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
                      {isExpense ? 'Marcar como Paga' : 'Marcar como Recebida'}
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
                          Tem certeza que deseja excluir a {isExpense ? 'despesa' : 'receita'} de "{bill.payeeName}" no valor de R$ {bill.amount.toFixed(2)}? Esta ação não pode ser desfeita.
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

const buttonVariants = ({ variant }: { variant: "destructive" | "default" | "outline" | "secondary" | "ghost" | "link" | null | undefined }) => {
  if (variant === "destructive") return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  return ""; 
};

