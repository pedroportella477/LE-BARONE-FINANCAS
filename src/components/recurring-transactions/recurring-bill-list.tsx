
'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, Repeat, TrendingDown, TrendingUp, PackageOpen, Tag, CalendarDays, Info } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import type { RecurringBill } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const getFrequencyText = (frequency: RecurringBill['frequency'], interval: number): string => {
  const s = interval > 1 ? 's' : '';
  switch (frequency) {
    case 'daily': return `A cada ${interval} dia${s}`;
    case 'weekly': return `A cada ${interval} semana${s}`;
    case 'monthly': return `A cada ${interval} mês${s}`;
    case 'yearly': return `A cada ${interval} ano${s}`;
    default: return 'Desconhecida';
  }
};

interface RecurringBillListProps {
  recurringBills: RecurringBill[];
  onEdit: (recurringBill: RecurringBill) => void;
  onDelete: (id: string) => void;
}

export function RecurringBillList({ recurringBills, onEdit, onDelete }: RecurringBillListProps) {
  if (recurringBills.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-muted-foreground/30 rounded-lg">
        <Repeat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold text-foreground">Nenhum lançamento recorrente cadastrado.</p>
        <p className="text-muted-foreground">Adicione suas despesas e receitas recorrentes para automatizar seus lançamentos.</p>
      </div>
    );
  }

  const sortedRecurringBills = [...recurringBills].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-4">
      <TooltipProvider>
        {sortedRecurringBills.map((rb) => {
          const isExpense = rb.type === 'expense';
          const frequencyText = getFrequencyText(rb.frequency, rb.interval);
          const startDateFormatted = format(new Date(rb.startDate), 'dd/MM/yyyy', { locale: ptBR });
          const endDateFormatted = rb.endDate ? format(new Date(rb.endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem data final';
          const nextDueDateFormatted = format(new Date(rb.nextDueDate), 'dd/MM/yyyy', { locale: ptBR });

          return (
            <Card key={rb.id} className="shadow-md transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      {isExpense ? <TrendingDown className="mr-2 h-5 w-5 text-destructive" /> : <TrendingUp className="mr-2 h-5 w-5 text-green-600" />}
                      {rb.payeeName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {frequencyText}
                      {rb.category && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs">
                          <Tag className="h-3 w-3" /> {rb.category}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={isExpense ? "destructive" : "default"} className={cn(isExpense ? "bg-destructive/80" : "bg-green-600/80", "text-white")}>
                    {isExpense ? 'Despesa Recorrente' : 'Receita Recorrente'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                <div className={cn("text-2xl font-semibold", isExpense ? "text-destructive" : "text-green-600")}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rb.amount)}
                </div>
                <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                  <div className="flex items-center">
                    <CalendarDays className="mr-1.5 h-4 w-4 text-primary/70" />
                    <span>Início: {startDateFormatted}</span>
                  </div>
                  <div className="flex items-center">
                     <CalendarDays className="mr-1.5 h-4 w-4 text-primary/70" />
                    <span>Fim: {endDateFormatted}</span>
                  </div>
                   <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center cursor-default">
                          <Info className="mr-1.5 h-4 w-4 text-primary/70" />
                          <span>Próxima: {nextDueDateFormatted}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Próxima data em que uma transação individual será considerada.</p>
                        <p>(A geração automática ainda será implementada)</p>
                      </TooltipContent>
                    </Tooltip>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-5 w-5" />
                       <span className="sr-only">Editar</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(rb)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Definição
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir Definição
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a definição da recorrência "{rb.payeeName}"? Esta ação não pode ser desfeita e não excluirá transações já geradas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(rb.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
      </TooltipProvider>
    </div>
  );
}
