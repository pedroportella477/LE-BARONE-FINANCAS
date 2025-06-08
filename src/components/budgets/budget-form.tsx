
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import React, { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Budget } from '@/types';

const budgetFormSchema = z.object({
  category: z.string().min(1, { message: 'Selecione uma categoria de despesa.' }),
  limit: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: "Limite deve ser um número" }).positive({ message: 'O limite deve ser um valor positivo.' })
  ),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  budget?: Budget | null;
  expenseCategories: string[];
  existingBudgetCategories: string[]; // Categories that already have a budget (excluding current if editing)
  onSave: (data: BudgetFormValues) => void;
  onCancel?: () => void;
}

export function BudgetForm({ budget, expenseCategories, existingBudgetCategories, onSave, onCancel }: BudgetFormProps) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: budget?.category || '',
      limit: budget?.limit || 0,
    },
  });
  
  // Reset form if budget prop changes (e.g., opening dialog for new vs. edit)
  useEffect(() => {
    form.reset({
      category: budget?.category || '',
      limit: budget?.limit || 0,
    });
  }, [budget, form]);

  const availableCategories = expenseCategories.filter(cat => 
    !existingBudgetCategories.includes(cat) || (budget && budget.category === cat)
  );


  function onSubmit(data: BudgetFormValues) {
    onSave(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria da Despesa</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={!!budget} // Disable category change when editing
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {budget && budget.category && !availableCategories.includes(budget.category) && (
                     <SelectItem key={budget.category} value={budget.category}>
                        {budget.category}
                      </SelectItem>
                  )}
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  {availableCategories.length === 0 && !budget && (
                    <div className="p-2 text-sm text-muted-foreground">Todas as categorias já possuem orçamento ou não há categorias de despesa.</div>
                  )}
                </SelectContent>
              </Select>
              {!!budget && <FormDescription>A categoria não pode ser alterada ao editar um orçamento.</FormDescription>}
              {!budget && availableCategories.length === 0 && <FormDescription>Crie categorias de despesa na página de Perfil.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite Mensal (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Ex: 500.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl>
              <FormDescription>Defina o valor máximo que você planeja gastar nesta categoria por mês.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
          <Button 
            type="submit" 
            disabled={(form.getValues("category") === '' && !budget) || (availableCategories.length === 0 && !budget)}
          >
            {budget ? 'Salvar Orçamento' : 'Adicionar Orçamento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
