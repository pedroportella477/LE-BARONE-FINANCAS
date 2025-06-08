
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Target, Award, Briefcase, Car, Gift, GraduationCap, Home, ShoppingCart, Smile, Plane, Circle } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FinancialGoal } from '@/types';
import * as LucideIcons from 'lucide-react';

const goalFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome da meta deve ter pelo menos 2 caracteres.' }),
  targetAmount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: "Valor alvo deve ser um número" }).positive({ message: 'O valor alvo deve ser positivo.' })
  ),
  currentAmount: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)), // Default to 0 if empty
    z.number({ invalid_type_error: "Valor atual deve ser um número" }).min(0, { message: 'O valor atual não pode ser negativo.' })
  ),
  targetDate: z.date().nullable().optional(),
  icon: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.currentAmount > data.targetAmount) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O valor atual não pode ser maior que o valor alvo.",
            path: ['currentAmount'],
        });
    }
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  goal?: FinancialGoal | null;
  onSave: (data: GoalFormValues) => void;
  onCancel?: () => void;
}

const suggestedIcons = [
  { name: 'Nenhum', value: 'none', IconComponent: Circle },
  { name: 'Alvo', value: 'Target', IconComponent: Target },
  { name: 'Prêmio', value: 'Award', IconComponent: Award },
  { name: 'Viagem', value: 'Plane', IconComponent: Plane },
  { name: 'Casa', value: 'Home', IconComponent: Home },
  { name: 'Carro', value: 'Car', IconComponent: Car },
  { name: 'Educação', value: 'GraduationCap', IconComponent: GraduationCap },
  { name: 'Presente', value: 'Gift', IconComponent: Gift },
  { name: 'Compras', value: 'ShoppingCart', IconComponent: ShoppingCart },
  { name: 'Diversão', value: 'Smile', IconComponent: Smile },
  { name: 'Negócios', value: 'Briefcase', IconComponent: Briefcase },
];

export function GoalForm({ goal, onSave, onCancel }: GoalFormProps) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: goal?.name || '',
      targetAmount: goal?.targetAmount || 0,
      currentAmount: goal?.currentAmount || 0,
      targetDate: goal?.targetDate ? parseISO(goal.targetDate) : null,
      icon: goal?.icon || 'none',
    },
  });
  
  useEffect(() => {
    form.reset({
      name: goal?.name || '',
      targetAmount: goal?.targetAmount || 0,
      currentAmount: goal?.currentAmount || 0,
      targetDate: goal?.targetDate ? parseISO(goal.targetDate) : null,
      icon: goal?.icon || 'none',
    });
  }, [goal, form]);

  function onSubmit(data: GoalFormValues) {
    onSave(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Meta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Viagem para a praia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Valor Alvo (R$)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 5000.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="currentAmount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Valor Atual (R$)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 500.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                 <FormDescription>Quanto você já economizou para esta meta.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Alvo (Opcional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={(date) => field.onChange(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Quando você pretende alcançar esta meta?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ícone (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ícone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suggestedIcons.map(({ value, name, IconComponent }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Escolha um ícone para representar sua meta.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
          <Button type="submit">{goal ? 'Salvar Meta' : 'Adicionar Meta'}</Button>
        </div>
      </form>
    </Form>
  );
}

// Helper to get Lucide icon component by name
export function getLucideIcon(iconName?: string): React.ElementType | null {
  if (!iconName || iconName === 'none') return null;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Circle; // Fallback to Circle if icon not found
}
