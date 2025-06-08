
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Budget } from '@/types';
import { cn } from '@/lib/utils';
import { PiggyBank } from 'lucide-react';

interface BudgetProgressCardProps {
  budget: Budget;
  spentAmount: number;
  className?: string;
}

export function BudgetProgressCard({ budget, spentAmount, className }: BudgetProgressCardProps) {
  const percentage = budget.limit > 0 ? Math.min((spentAmount / budget.limit) * 100, 1000) : 0; // Cap at 1000% for display
  const remaining = budget.limit - spentAmount;

  let indicatorClassName = 'bg-green-500'; // Default for up to 70%
  if (percentage > 100) {
    indicatorClassName = 'bg-red-600'; // Over budget
  } else if (percentage > 90) {
    indicatorClassName = 'bg-orange-500'; // 91-100%
  } else if (percentage > 70) {
    indicatorClassName = 'bg-yellow-500'; // 71-90%
  }
  
  const displayPercentage = budget.limit > 0 ? (spentAmount / budget.limit) * 100 : 0;


  return (
    <Card className={cn("shadow-md hover:shadow-lg transition-shadow w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <PiggyBank className="mr-2 h-5 w-5 text-primary" />
            {budget.category}
          </CardTitle>
          <span 
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              displayPercentage > 100 ? "bg-destructive/20 text-destructive" :
              displayPercentage > 90 ? "bg-orange-500/20 text-orange-600" :
              displayPercentage > 70 ? "bg-yellow-500/20 text-yellow-600" :
              "bg-green-500/20 text-green-600"
            )}
          >
            {displayPercentage.toFixed(0)}% Gasto
          </span>
        </div>
        <CardDescription className="text-sm">
          Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.limit)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={percentage > 100 ? 100 : percentage} indicatorClassName={indicatorClassName} className="h-3"/>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Gasto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spentAmount)}
          </span>
          <span className={cn("font-medium", remaining < 0 ? "text-destructive" : "text-green-600")}>
            {remaining >= 0 ? 'Restante: ' : 'Excedente: '} 
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(remaining))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
