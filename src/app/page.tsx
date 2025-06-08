'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown, PlusCircle, ListChecks, AlertTriangle, Coins, PackageOpen } from 'lucide-react';
import { FinancialSummaryCard } from '@/components/dashboard/financial-summary-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getBills, getUserProfile } from '@/lib/store';
import type { UserProfile, Bill } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalPendingExpenses, setTotalPendingExpenses] = useState(0);
  const [incomeReceivedThisMonth, setIncomeReceivedThisMonth] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [incomeCompromised, setIncomeCompromised] = useState(false);

  useEffect(() => {
    const profile = getUserProfile();
    setUserProfile(profile);
    const storedBills = getBills();
    setBills(storedBills);

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
    const effectiveIncomeThisMonth = profileMonthlyIncome + receivedIncome;
    setRemainingBalance(effectiveIncomeThisMonth - pendingExpenses);

    if (profile && profile.monthlyIncome > 0) {
      if (pendingExpenses / profile.monthlyIncome >= 0.4) {
        setIncomeCompromised(true);
      } else {
        setIncomeCompromised(false);
      }
    }
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
