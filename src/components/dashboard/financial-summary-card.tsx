import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FinancialSummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  valueClassName?: string;
}

export function FinancialSummaryCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  valueClassName,
}: FinancialSummaryCardProps) {
  const formattedValue = typeof value === 'number' 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) 
    : value;

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold text-foreground", valueClassName)}>{formattedValue}</div>
        {description && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
