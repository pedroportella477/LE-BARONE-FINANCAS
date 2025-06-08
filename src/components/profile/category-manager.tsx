
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface CategoryManagerProps {
  type: 'expense' | 'income';
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export function CategoryManager({ type, categories, onAddCategory, onDeleteCategory }: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  const handleAdd = () => {
    if (newCategory.trim() === '') {
      toast({
        title: 'Nome Inválido',
        description: 'O nome da categoria não pode estar vazio.',
        variant: 'destructive',
      });
      return;
    }
    if (categories.includes(newCategory.trim())) {
      toast({
        title: 'Categoria Existente',
        description: `A categoria "${newCategory.trim()}" já existe.`,
        variant: 'destructive',
      });
      return;
    }
    onAddCategory(newCategory.trim());
    setNewCategory('');
    toast({
      title: 'Categoria Adicionada!',
      description: `Categoria "${newCategory.trim()}" adicionada com sucesso.`,
    });
  };

  const handleDelete = (category: string) => {
    onDeleteCategory(category);
    toast({
      title: 'Categoria Removida!',
      description: `Categoria "${category}" removida. As transações existentes com esta categoria não serão alteradas.`,
      variant: 'default'
    });
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
        {categories.map((category) => (
          <li
            key={category}
            className="flex items-center justify-between p-3 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors"
          >
            <span className="text-sm font-medium text-secondary-foreground">{category}</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label={`Excluir categoria ${category}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a categoria "{category}"? 
                    Esta ação não pode ser desfeita. As transações existentes com esta categoria permanecerão com ela, mas a categoria não estará mais disponível para novas transações.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(category)}
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
