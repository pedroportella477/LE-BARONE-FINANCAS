
'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, PackageOpen, Target, CalendarDays, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import type { FinancialGoal } from '@/types';
import { cn } from '@/lib/utils';
import { getLucideIcon } from './goal-form'; // Helper to get icon component

interface GoalListProps {
  goals: FinancialGoal[];
  onEdit: (goal: FinancialGoal) => void;
  onDelete: (id: string) => void;
}

export function GoalList({ goals, onEdit, onDelete }: GoalListProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-muted-foreground/30 rounded-lg">
        <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold text-foreground">Nenhuma meta financeira definida.</p>
        <p className="text-muted-foreground">Adicione suas metas para começar a planejar seu futuro financeiro.</p>
      </div>
    );
  }

  const sortedGoals = [...goals].sort((a, b) => {
    const aProgress = a.targetAmount > 0 ? (a.currentAmount / a.targetAmount) : 0;
    const bProgress = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) : 0;
    if (aProgress !== bProgress) {
      return bProgress - aProgress; // Sort by progress descending
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Then by creation date descending
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedGoals.map((goal) => {
        const progressPercentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
        const IconComponent = getLucideIcon(goal.icon) || Target;

        let indicatorClassName = 'bg-primary';
        if (progressPercentage >= 100) {
            indicatorClassName = 'bg-green-500';
        } else if (progressPercentage > 75) {
            indicatorClassName = 'bg-sky-500';
        } else if (progressPercentage > 50) {
            indicatorClassName = 'bg-blue-500';
        } else if (progressPercentage > 25) {
            indicatorClassName = 'bg-indigo-500';
        }


        return (
          <Card key={goal.id} className="shadow-md transition-all hover:shadow-lg flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                   <IconComponent className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg font-semibold">{goal.name}</CardTitle>
                </div>
                <span className={cn("text-xs font-semibold px-2 py-1 rounded-full",
                    progressPercentage >= 100 ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                )}>
                    {progressPercentage.toFixed(0)}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-2 flex-grow">
              <Progress value={progressPercentage} indicatorClassName={indicatorClassName} className="h-2.5"/>
              <div className="text-sm text-muted-foreground">
                <p className="flex items-center justify-between">
                  <span>
                    <DollarSign className="inline mr-1 h-4 w-4" />
                    Economizado:
                  </span>
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.currentAmount)}
                  </span>
                </p>
                 <p className="flex items-center justify-between">
                  <span>
                    <Target className="inline mr-1 h-4 w-4" />
                    Alvo:
                  </span>
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.targetAmount)}
                  </span>
                </p>
              </div>
              {goal.targetDate && (
                <div className="text-xs text-muted-foreground flex items-center">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  Data Alvo: {format(parseISO(goal.targetDate), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              )}
               <p className="text-xs text-muted-foreground">
                Criada em: {format(parseISO(goal.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-4 border-t mt-auto">
              <Button variant="outline" size="sm" onClick={() => onEdit(goal)}>
                <Edit className="mr-1.5 h-4 w-4" /> Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1.5 h-4 w-4" /> Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a meta "{goal.name}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(goal.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
