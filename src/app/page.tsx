'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown, PlusCircle, ListChecks, AlertTriangle } from 'lucide-react';
import { FinancialSummaryCard } from '@/components/dashboard/financial-summary-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getBills, getUserProfile } from '@/lib/store';
import type { UserProfile, Bill } from '@/types';

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [incomeCompromised, setIncomeCompromised] = useState(false);

  useEffect(() => {
    const profile = getUserProfile();
    setUserProfile(profile);
    const storedBills = getBills();
    setBills(storedBills);

    const currentMonthExpenses = storedBills
      .filter(bill => !bill.isPaid && new Date(bill.dueDate).getMonth() === new Date().getMonth()) // Example: unpaid bills this month
      .reduce((sum, bill) => sum + bill.amount, 0);
    setTotalExpenses(currentMonthExpenses);

    if (profile && profile.monthlyIncome > 0) {
      setRemainingBalance(profile.monthlyIncome - currentMonthExpenses);
      if (currentMonthExpenses / profile.monthlyIncome >= 0.4) {
        setIncomeCompromised(true);
      } else {
        setIncomeCompromised(false);
      }
    } else {
      setRemainingBalance(0 - currentMonthExpenses);
    }
  }, []);

  const greeting = userProfile ? `Olá, ${userProfile.name}!` : 'Bem-vindo(a) ao Lebarone Finanças!';

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
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Conta
            </Button>
          </Link>
          <Link href="/bills" passHref>
            <Button variant="outline">
              <ListChecks className="mr-2 h-4 w-4" /> Ver Contas
            </Button>
          </Link>
        </div>
      </div>

      {incomeCompromised && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
          <AlertTriangle className="h-4 w-4 !text-destructive" />
          <AlertTitle className="text-destructive">Atenção: Renda Comprometida!</AlertTitle>
          <AlertDescription className="text-destructive/90">
            Mais de 40% da sua renda mensal está comprometida com despesas. Considere revisar seus gastos.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FinancialSummaryCard
          title="Renda Mensal"
          value={userProfile?.monthlyIncome ?? 0}
          icon={DollarSign}
          description="Sua renda mensal cadastrada."
        />
        <FinancialSummaryCard
          title="Despesas Pendentes (Mês)"
          value={totalExpenses}
          icon={TrendingDown}
          description="Soma das contas não pagas neste mês."
          valueClassName={totalExpenses > 0 ? "text-destructive" : ""}
        />
        <FinancialSummaryCard
          title="Saldo Restante (Mês)"
          value={remainingBalance}
          icon={TrendingUp}
          description="Renda mensal menos despesas pendentes."
           valueClassName={remainingBalance < 0 ? "text-destructive" : "text-green-600"}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Próximas Contas</h2>
        {bills.filter(b => !b.isPaid).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0,3).map(bill => (
            <div key={bill.id} className="mb-2 p-4 border rounded-lg bg-card flex justify-between items-center">
                <div>
                    <p className="font-medium">{bill.payeeName}</p>
                    <p className="text-sm text-muted-foreground">Vence em: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <p className="font-semibold text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                </p>
            </div>
        ))}
        {bills.filter(b => !b.isPaid).length === 0 && (
            <p className="text-muted-foreground">Nenhuma conta pendente encontrada.</p>
        )}
      </div>

    </div>
  );
}
