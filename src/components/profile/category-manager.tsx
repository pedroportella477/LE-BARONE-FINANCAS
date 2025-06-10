
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import type { ExpenseCategory, IncomeCategory } from '@/types'; // Import full category types

interface CategoryManagerProps {
  type: 'expense' | 'income';
  categories: string[]; // Still used for quick check if name exists, but deletion uses ID
  categoryObjects: (ExpenseCategory | IncomeCategory)[]; // Full objects for ID access
  onAddCategory: (categoryName: string) => void; // Name is enough for adding
  onDeleteCategory: (categoryName: string, categoryId?: string) => void; // ID is crucial for deletion
}

export function CategoryManager({ type, categories, categoryObjects, onAddCategory, onDeleteCategory }: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  const handleAdd = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory === '') {
      toast({
        title: 'Nome Inválido',
        description: 'O nome da categoria não pode estar vazio.',
        variant: 'destructive',
      });
      return;
    }
    if (categories.some(catName => catName.toLowerCase() === trimmedCategory.toLowerCase())) {
      toast({
        title: 'Categoria Existente',
        description: `A categoria "${trimmedCategory}" já existe.`,
        variant: 'destructive',
      });
      return;
    }
    onAddCategory(trimmedCategory);
    setNewCategory('');
    // Toast for add is handled in the page after successful API call
  };

  const handleDelete = (categoryName: string) => {
    const categoryObject = categoryObjects.find(cat => cat.name === categoryName);
    if (!categoryObject || !categoryObject.id) {
        toast({ title: 'Erro ao Excluir', description: 'ID da categoria não encontrado.', variant: 'destructive'});
        return;
    }
    onDeleteCategory(categoryName, categoryObject.id);
    // Toast for delete is handled in the page after successful API call
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder={`Nova categoria de ${type === 'expense' ? 'despesa' : 'receita'}`}
          className="flex-grow"
        />
        <Button onClick={handleAdd} size="icon" aria-label="Adicionar categoria">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria adicionada ainda.</p>
      )}

      <ul className="space-y-2">
        {categories.map((categoryName) => ( // Iterate by name for display
          <li
            key={categoryName} // Use name for key as it's unique for display list
            className="flex items-center justify-between p-3 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors"
          >
            <span className="text-sm font-medium text-secondary-foreground">{categoryName}</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label={`Excluir categoria ${categoryName}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a categoria "{categoryName}"? 
                    Esta ação não pode ser desfeita. As transações existentes com esta categoria não serão alteradas (o vínculo será removido ou mantido como histórico, dependendo da lógica do backend).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(categoryName)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>
        ))}
      </ul>
    </div>
  );
}
