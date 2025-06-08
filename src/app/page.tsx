
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown, PlusCircle, ListChecks, AlertTriangle, Coins, PackageOpen, BarChart3, Target as TargetIcon } from 'lucide-react';
import { FinancialSummaryCard } from '@/components/dashboard/financial-summary-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getBills, getUserProfile, getFinancialGoals } from '@/lib/store';
import type { UserProfile, Bill, FinancialGoal } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BudgetProgressCard } from '@/components/dashboard/budget-progress-card'; // Assuming this will be used or was part of a previous step. Keep if still needed.
import { getBudgets } from '@/lib/store'; // For budgets
import type { Budget } from '@/types'; // For budgets
import { getLucideIcon } from '@/components/financial-goals/goal-form';
import { cn } from '@/lib/utils';


interface CategoryExpense {
  name: string;
  total: number;
}

interface BudgetStatus {
  budget: Budget;
  spent: number;
  percentage: number;
  remaining: number;
}

const chartConfig = {
  total: {
    label: 'Total Gasto (R$)',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalPendingExpenses, setTotalPendingExpenses] = useState(0);
  const [incomeReceivedThisMonth, setIncomeReceivedThisMonth] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [incomeCompromised, setIncomeCompromised] = useState(false);
  const [expensesByCategoryChartData, setExpensesByCategoryChartData] = useState<CategoryExpense[]>([]);
  const [budgetStatusList, setBudgetStatusList] = useState<BudgetStatus[]>([]);
  const [dashboardGoals, setDashboardGoals] = useState<FinancialGoal[]>([]);


  useEffect(() => {
    const profile = getUserProfile();
    setUserProfile(profile);
    const storedBills = getBills();
    setBills(storedBills);
    const storedBudgets = getBudgets();
    const storedFinancialGoals = getFinancialGoals();

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const pendingExpenses = storedBills
      .filter(bill => bill.type === 'expense' && !bill.isPaid && 
                     new Date(bill.dueDate).getMonth() === currentMonth &&
                     new Date(bill.dueDate).getFullYear() === currentYear)
      .reduce((sum, bill) => sum + bill.amount, 0);
    setTotalPendingExpenses(pendingExpenses);

    const receivedIncome = storedBills
      .filter(bill => bill.type === 'income' && bill.isPaid && 
                     bill.paymentDate &&
                     new Date(bill.paymentDate).getMonth() === currentMonth &&
                     new Date(bill.paymentDate).getFullYear() === currentYear)
      .reduce((sum, bill) => sum + bill.amount, 0);
    setIncomeReceivedThisMonth(receivedIncome);

    const profileMonthlyIncome = profile?.monthlyIncome ?? 0;
    const effectiveIncomeThisMonth = profileMonthlyIncome + receivedIncome; // Or just profile.monthlyIncome depending on how it's interpreted
    setRemainingBalance(effectiveIncomeThisMonth - pendingExpenses);

    if (profile && profile.monthlyIncome > 0) {
      if (pendingExpenses / profile.monthlyIncome >= 0.4) {
        setIncomeCompromised(true);
      } else {
        setIncomeCompromised(false);
      }
    }

    // Calculate expenses by category for the current month (PAID expenses)
    const paidExpensesThisMonth = storedBills.filter(
      (bill) =>
        bill.type === 'expense' &&
        bill.isPaid &&
        bill.paymentDate &&
        new Date(bill.paymentDate).getMonth() === currentMonth &&
        new Date(bill.paymentDate).getFullYear() === currentYear
    );

    const groupedExpenses = paidExpensesThisMonth.reduce((acc, bill) => {
      const category = bill.category || 'Sem Categoria';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += bill.amount;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(groupedExpenses)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
    setExpensesByCategoryChartData(chartData);

    // Budget Status
    const statusList: BudgetStatus[] = [];
    storedBudgets.forEach(budget => {
      const spentInMonth = paidExpensesThisMonth // Use already filtered paid expenses
        .filter(bill => bill.category === budget.category)
        .reduce((sum, bill) => sum + bill.amount, 0);
      
      const percentage = budget.limit > 0 ? (spentInMonth / budget.limit) * 100 : 0;
      const remaining = budget.limit - spentInMonth;
      statusList.push({ budget, spent: spentInMonth, percentage, remaining });
    });
    setBudgetStatusList(statusList.sort((a,b) => (b.spent/b.budget.limit) - (a.spent/a.budget.limit)));

    // Financial Goals for Dashboard
    const sortedGoalsForDashboard = [...storedFinancialGoals].sort((a, b) => {
      const aProgress = a.targetAmount > 0 ? (a.currentAmount / a.targetAmount) : 0;
      const bProgress = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) : 0;
      if (aProgress !== bProgress) return bProgress - aProgress; // Higher progress first
      return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime(); // Newer goals first for tie-breaking
    });
    setDashboardGoals(sortedGoalsForDashboard.slice(0, 3)); // Show top 3

  }, []);

  const greeting = userProfile ? `Olá, ${userProfile.name}!` : 'Bem-vindo(a) ao Lebarone Finanças!';
  
  const upcomingExpenses = bills
    .filter(b => b.type === 'expense' && !b.isPaid)
    .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0,3);

  const upcomingIncomes = bills
    .filter(b => b.type === 'income' && !b.isPaid)
    .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0,3);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{greeting}</h1>
          <p className="text-muted-foreground">Aqui está um resumo das suas finanças.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/bills#add-bill" passHref>
            <Button variant="default">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Transação
            </Button>
          </Link>
          <Link href="/bills" passHref>
            <Button variant="outline">
              <ListChecks className="mr-2 h-4 w-4" /> Ver Transações
            </Button>
          </Link>
        </div>
      </div>

      {incomeCompromised && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
          <AlertTriangle className="h-4 w-4 !text-destructive" />
          <AlertTitle className="text-destructive">Atenção: Renda Comprometida!</AlertTitle>
          <AlertDescription className="text-destructive/90">
            Mais de 40% da sua renda mensal (cadastrada no perfil) está comprometida com despesas pendentes este mês. Considere revisar seus gastos.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <FinancialSummaryCard
          title="Renda Mensal (Perfil)"
          value={userProfile?.monthlyIncome ?? 0}
          icon={DollarSign}
          description="Sua renda mensal base cadastrada."
        />
        <FinancialSummaryCard
          title="Receitas Recebidas (Mês)"
          value={incomeReceivedThisMonth}
          icon={Coins}
          description="Soma das receitas efetivamente recebidas este mês."
          valueClassName={incomeReceivedThisMonth > 0 ? "text-green-600" : ""}
        />
        <FinancialSummaryCard
          title="Despesas Pendentes (Mês)"
          value={totalPendingExpenses}
          icon={TrendingDown}
          description="Soma das despesas não pagas neste mês."
          valueClassName={totalPendingExpenses > 0 ? "text-destructive" : ""}
        />
        <FinancialSummaryCard
          title="Saldo Estimado (Mês)"
          value={remainingBalance}
          icon={TrendingUp}
          description="Renda (perfil + recebida) menos despesas pendentes."
          valueClassName={remainingBalance < 0 ? "text-destructive" : "text-green-600"}
        />
      </div>

      {expensesByCategoryChartData.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Despesas Pagas por Categoria (Mês Atual)
            </CardTitle>
            <CardDescription>Distribuição dos seus gastos pagos este mês por categoria.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full sm:min-h-[300px]">
              <BarChart 
                accessibilityLayer 
                data={expensesByCategoryChartData} 
                margin={{ top: 5, right: 0, left: -20, bottom: 50 }}
                layout="vertical"
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    width={100}
                    interval={0}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                  formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), "Total"]}
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} barSize={20}>
                   <LabelList 
                    dataKey="total" 
                    position="right" 
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)} 
                    fontSize={10}
                    fill="hsl(var(--foreground))"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {budgetStatusList.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-4 text-primary flex items-center">
            <ListChecks className="mr-2 h-6 w-6"/> {/* Replaced PiggyBank with ListChecks for variety */}
            Progresso dos Orçamentos (Mês Atual)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgetStatusList.map(({ budget, spent }) => (
               <BudgetProgressCard
                key={budget.id}
                budget={budget}
                spentAmount={spent}
              />
            ))}
          </div>
        </section>
      )}
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight mb-4 text-primary flex items-center">
          <TargetIcon className="mr-2 h-6 w-6"/>
          Suas Metas Financeiras
        </h2>
        {dashboardGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardGoals.map(goal => {
              const progressPercentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
              const Icon = getLucideIcon(goal.icon) || TargetIcon;
              let progressIndicatorClassName = 'bg-primary';
                if (progressPercentage >= 100) {
                    progressIndicatorClassName = 'bg-green-500';
                } else if (progressPercentage > 75) {
                    progressIndicatorClassName = 'bg-sky-500';
                } else if (progressPercentage > 50) {
                    progressIndicatorClassName = 'bg-blue-500';
                } else if (progressPercentage > 25) {
                    progressIndicatorClassName = 'bg-indigo-500';
                }

              return (
                <Card key={goal.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg font-medium">{goal.name}</CardTitle>
                      </div>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", progressPercentage >= 100 ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary")}>
                        {progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Progress value={progressPercentage} indicatorClassName={progressIndicatorClassName} className="h-2 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.currentAmount)} / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.targetAmount)}
                    </p>
                    {goal.targetDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Meta: {format(parseISO(goal.targetDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border rounded-lg bg-card shadow-sm">
            <TargetIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma meta financeira definida ainda.</p>
            <Link href="/financial-goals" passHref>
              <Button variant="link" className="mt-2 text-primary hover:underline">Criar uma meta</Button>
            </Link>
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4 text-destructive flex items-center">
            <TrendingDown className="mr-2 h-6 w-6"/>
            Próximas Despesas
          </h2>
          {upcomingExpenses.length > 0 ? upcomingExpenses.map(bill => (
              <div key={bill.id} className="mb-3 p-4 border rounded-lg bg-card shadow-sm flex justify-between items-center">
                  <div>
                      <p className="font-medium text-card-foreground">{bill.payeeName}</p>
                      <p className="text-sm text-muted-foreground">Vence em: {format(new Date(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                  <p className="font-semibold text-lg text-destructive">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                  </p>
              </div>
          )) : (
            <div className="text-center py-6 border rounded-lg bg-card shadow-sm">
                <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma despesa pendente encontrada.</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4 text-green-600 flex items-center">
            <TrendingUp className="mr-2 h-6 w-6" />
            Próximas Receitas
          </h2>
          {upcomingIncomes.length > 0 ? upcomingIncomes.map(bill => (
              <div key={bill.id} className="mb-3 p-4 border rounded-lg bg-card shadow-sm flex justify-between items-center">
                  <div>
                      <p className="font-medium text-card-foreground">{bill.payeeName}</p>
                      <p className="text-sm text-muted-foreground">Receber em: {format(new Date(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                  <p className="font-semibold text-lg text-green-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                  </p>
              </div>
          )) : (
            <div className="text-center py-6 border rounded-lg bg-card shadow-sm">
                <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma receita pendente encontrada.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
