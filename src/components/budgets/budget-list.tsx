
'use client';

import { Edit, Trash2, PackageOpen, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Budget } from '@/types';
import { cn } from '@/lib/utils';

interface BudgetListProps {
  budgets: Budget[];
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

export function BudgetList({ budgets, onEdit, onDelete }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-muted-foreground/30 rounded-lg">
        <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold text-foreground">Nenhum orçamento definido.</p>
        <p className="text-muted-foreground">Adicione orçamentos para suas categorias de despesa para começar a planejar.</p>
      </div>
    );
  }

  const sortedBudgets = [...budgets].sort((a, b) => a.category.localeCompare(b.category));

  return (
    <div className="space-y-4">
      {sortedBudgets.map((budget) => (
        <Card key={budget.id} className="shadow-md transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary" /> 
                {budget.category}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className={cn("text-2xl font-semibold text-foreground")}>
              Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.limit)}
            </div>
            <CardDescription className="text-xs mt-1">
              Criado em: {new Date(budget.createdAt).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(budget)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o orçamento para a categoria "{budget.category}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(budget.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
