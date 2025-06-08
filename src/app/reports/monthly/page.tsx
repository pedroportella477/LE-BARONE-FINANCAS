
'use client';

import { useEffect, useState } from 'react';
import { BarChart3, CalendarFold, TrendingDown, TrendingUp, DollarSign, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinancialSummaryCard } from '@/components/dashboard/financial-summary-card';
import { getBills } from '@/lib/store';
import type { Bill } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';

interface CategoryData {
  name: string;
  total: number;
}

const chartConfigBase = {
  total: {
    label: 'Total (R$)',
  },
} satisfies ChartConfig;


const months = [
  { value: 0, label: 'Janeiro' }, { value: 1, label: 'Fevereiro' }, { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' }, { value: 4, label: 'Maio' }, { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' }, { value: 10, label: 'Novembro' }, { value: 11, label: 'Dezembro' },
];

const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

export default function MonthlyReportPage() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [expensesByCategoryChartData, setExpensesByCategoryChartData] = useState<CategoryData[]>([]);
  const [incomeByCategoryChartData, setIncomeByCategoryChartData] = useState<CategoryData[]>([]);

  useEffect(() => {
    const allBills = getBills();

    const filteredBills = allBills.filter(bill => {
      if (!bill.isPaid || !bill.paymentDate) return false;
      const paymentDate = new Date(bill.paymentDate); // Ensure paymentDate includes timezone or is treated as local
      return paymentDate.getMonth() === selectedMonth && paymentDate.getFullYear() === selectedYear;
    });

    const currentIncome = filteredBills
      .filter(bill => bill.type === 'income')
      .reduce((sum, bill) => sum + bill.amount, 0);
    setTotalIncome(currentIncome);

    const currentExpenses = filteredBills
      .filter(bill => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0);
    setTotalExpenses(currentExpenses);

    setNetBalance(currentIncome - currentExpenses);

    // Expenses by category
    const groupedExpenses = filteredBills
      .filter(bill => bill.type === 'expense')
      .reduce((acc, bill) => {
        const category = bill.category || 'Sem Categoria';
        if (!acc[category]) acc[category] = 0;
        acc[category] += bill.amount;
        return acc;
      }, {} as Record<string, number>);
    setExpensesByCategoryChartData(Object.entries(groupedExpenses).map(([name, total]) => ({ name, total })).sort((a,b) => b.total - a.total));
    
    // Income by category
    const groupedIncome = filteredBills
      .filter(bill => bill.type === 'income')
      .reduce((acc, bill) => {
        const category = bill.category || 'Sem Categoria';
        if (!acc[category]) acc[category] = 0;
        acc[category] += bill.amount;
        return acc;
      }, {} as Record<string, number>);
    setIncomeByCategoryChartData(Object.entries(groupedIncome).map(([name, total]) => ({ name, total })).sort((a,b) => b.total - a.total));

  }, [selectedMonth, selectedYear]);

  const years = getYears();

  const expenseChartConfig = { ...chartConfigBase, total: { ...chartConfigBase.total, color: 'hsl(var(--chart-2))' } };
  const incomeChartConfig = { ...chartConfigBase, total: { ...chartConfigBase.total, color: 'hsl(var(--chart-1))' } };
  

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <CalendarFold className="mr-3 h-8 w-8" />
            Relatório Mensal
          </h1>
          <p className="text-muted-foreground">Analise suas finanças para o período selecionado.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-[180px] bg-card shadow-md">
              <SelectValue placeholder="Selecione o Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px] bg-card shadow-md">
              <SelectValue placeholder="Selecione o Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <h2 className="text-2xl font-semibold tracking-tight text-center">
        Resumo de {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        <FinancialSummaryCard
          title="Total Receitas Recebidas"
          value={totalIncome}
          icon={Coins}
          valueClassName={totalIncome >= 0 ? "text-green-600" : "text-destructive"}
        />
        <FinancialSummaryCard
          title="Total Despesas Pagas"
          value={totalExpenses}
          icon={TrendingDown}
          valueClassName={totalExpenses > 0 ? "text-destructive" : ""}
        />
        <FinancialSummaryCard
          title="Saldo do Mês"
          value={netBalance}
          icon={DollarSign}
          valueClassName={netBalance >= 0 ? "text-green-600" : "text-destructive"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Despesas Pagas por Categoria
            </CardTitle>
            <CardDescription>Distribuição das suas despesas pagas no período.</CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByCategoryChartData.length > 0 ? (
              <ChartContainer config={expenseChartConfig} className="min-h-[250px] w-full sm:min-h-[300px]">
                <BarChart accessibilityLayer data={expensesByCategoryChartData} layout="vertical" margin={{ top: 5, right: 0, left: -20, bottom: 50 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={120} interval={0}/>
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), "Total"]}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="total" position="right" formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)} fontSize={10} fill="hsl(var(--foreground))"/>
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma despesa paga encontrada para este período.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
                <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
                Receitas Recebidas por Categoria
            </CardTitle>
            <CardDescription>Distribuição das suas receitas recebidas no período.</CardDescription>
          </CardHeader>
          <CardContent>
            {incomeByCategoryChartData.length > 0 ? (
              <ChartContainer config={incomeChartConfig} className="min-h-[250px] w-full sm:min-h-[300px]">
                 <BarChart accessibilityLayer data={incomeByCategoryChartData} layout="vertical" margin={{ top: 5, right: 0, left: -20, bottom: 50 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={120} interval={0}/>
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), "Total"]}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} barSize={20}>
                     <LabelList dataKey="total" position="right" formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)} fontSize={10} fill="hsl(var(--foreground))"/>
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma receita recebida encontrada para este período.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

