
'use client';

import { useEffect, useState } from 'react';
import { UserProfileForm } from '@/components/profile/user-profile-form';
import { CategoryManager } from '@/components/profile/category-manager';
// import { getUserProfile, getExpenseCategories, getIncomeCategories, addExpenseCategory, addIncomeCategory, deleteExpenseCategory, deleteIncomeCategory } from '@/lib/store'; // Store functions are now obsolete for profile/categories
import type { UserProfile as UserProfileType, ExpenseCategory, IncomeCategory } from '@/types'; // Renamed UserProfile
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, dbUserProfile, loading: authLoading, refreshDbUser } = useAuth();
  const { toast } = useToast();
  
  const [expenseCategoriesList, setExpenseCategoriesList] = useState<ExpenseCategory[]>([]);
  const [incomeCategoriesList, setIncomeCategoriesList] = useState<IncomeCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const fetchCategories = async () => {
    if (!user) return;
    setCategoriesLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Falha ao buscar categorias');
      const data = await response.json();
      setExpenseCategoriesList(data.expenseCategories || []);
      setIncomeCategoriesList(data.incomeCategories || []);
    } catch (error: any) {
      toast({ title: 'Erro ao Carregar Categorias', description: error.message, variant: 'destructive' });
      setExpenseCategoriesList([]);
      setIncomeCategoriesList([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);


  const handleAddCategory = async (type: 'expense' | 'income', categoryName: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name: categoryName, type }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao adicionar categoria');
      }
      // const newCategory = await response.json(); // newCategory contains {id, name, type, userId ...}
      toast({ title: 'Categoria Adicionada!', description: `Categoria "${categoryName}" adicionada.`});
      fetchCategories(); // Re-fetch all categories
    } catch (error: any) {
      toast({ title: 'Erro ao Adicionar', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (type: 'expense' | 'income', categoryId: string, categoryName: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/categories?id=${categoryId}&type=${type}`, { // Pass ID and type for deletion
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
         const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao excluir categoria');
      }
      toast({ title: 'Categoria Removida!', description: `Categoria "${categoryName}" removida.`});
      fetchCategories(); // Re-fetch all categories
    } catch (error: any) {
      toast({ title: 'Erro ao Excluir', description: error.message, variant: 'destructive' });
    }
  };

  if (authLoading || (user && categoriesLoading)) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (!user || !dbUserProfile) {
     return <div className="flex justify-center items-center h-full"><p>Por favor, faça login para ver seu perfil.</p></div>;
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações de Perfil e Categorias</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e personalize suas categorias financeiras.</p>
      </div>

      <UserProfileForm /> {/* UserProfileForm now gets its data from AuthContext */}

      <Separator className="my-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gerenciar Categorias de Despesa</CardTitle>
            <CardDescription>Adicione ou remova categorias para organizar suas despesas.</CardDescription>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> :
              <CategoryManager
                type="expense"
                categories={expenseCategoriesList.map(c => c.name)} // Pass only names for display
                categoryObjects={expenseCategoriesList} // Pass full objects for deletion by ID
                onAddCategory={(categoryName) => handleAddCategory('expense', categoryName)}
                onDeleteCategory={(categoryName, categoryId) => handleDeleteCategory('expense', categoryId!, categoryName)}
              />
            }
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gerenciar Categorias de Receita</CardTitle>
            <CardDescription>Adicione ou remova categorias para organizar suas fontes de receita.</CardDescription>
          </CardHeader>
          <CardContent>
             {categoriesLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> :
              <CategoryManager
                type="income"
                categories={incomeCategoriesList.map(c => c.name)}
                categoryObjects={incomeCategoriesList}
                onAddCategory={(categoryName) => handleAddCategory('income', categoryName)}
                onDeleteCategory={(categoryName, categoryId) => handleDeleteCategory('income', categoryId!, categoryName)}
              />
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
