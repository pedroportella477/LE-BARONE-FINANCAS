
'use client';

import { useEffect, useState } from 'react';
import { UserProfileForm } from '@/components/profile/user-profile-form';
import { CategoryManager } from '@/components/profile/category-manager';
import { getUserProfile, getExpenseCategories, getIncomeCategories, addExpenseCategory, addIncomeCategory, deleteExpenseCategory, deleteIncomeCategory } from '@/lib/store';
import type { UserProfile } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenseCategoriesList, setExpenseCategoriesList] = useState<string[]>([]);
  const [incomeCategoriesList, setIncomeCategoriesList] = useState<string[]>([]);

  useEffect(() => {
    setProfile(getUserProfile());
    setExpenseCategoriesList(getExpenseCategories());
    setIncomeCategoriesList(getIncomeCategories());
    setLoading(false);
  }, []);

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile); // saveUserProfile is called within UserProfileForm
  };

  const handleAddCategory = (type: 'expense' | 'income', category: string) => {
    if (type === 'expense') {
      setExpenseCategoriesList(addExpenseCategory(category));
    } else {
      setIncomeCategoriesList(addIncomeCategory(category));
    }
  };

  const handleDeleteCategory = (type: 'expense' | 'income', category: string) => {
    if (type === 'expense') {
      setExpenseCategoriesList(deleteExpenseCategory(category));
    } else {
      setIncomeCategoriesList(deleteIncomeCategory(category));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Carregando perfil e categorias...</p></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e personalize suas categorias financeiras.</p>
      </div>

      <UserProfileForm initialProfile={profile} onSave={handleSaveProfile} />

      <Separator className="my-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gerenciar Categorias de Despesa</CardTitle>
            <CardDescription>Adicione ou remova categorias para organizar suas despesas.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryManager
              type="expense"
              categories={expenseCategoriesList}
              onAddCategory={(category) => handleAddCategory('expense', category)}
              onDeleteCategory={(category) => handleDeleteCategory('expense', category)}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gerenciar Categorias de Receita</CardTitle>
            <CardDescription>Adicione ou remova categorias para organizar suas fontes de receita.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryManager
              type="income"
              categories={incomeCategoriesList}
              onAddCategory={(category) => handleAddCategory('income', category)}
              onDeleteCategory={(category) => handleDeleteCategory('income', category)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
