
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
import type { RecurringBill, RecurrenceFrequency } from '@/types';
import { getExpenseCategories, getIncomeCategories } from '@/lib/store';

const NO_CATEGORY_VALUE = "__NO_CATEGORY_SELECTED__";

const recurringBillFormSchema = z.object({
  payeeName: z.string().min(2, { message: 'Nome do beneficiário/origem deve ter pelo menos 2 caracteres.' }),
  amount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: "Valor deve ser um número" }).positive({ message: 'O valor deve ser positivo.' })
  ),
  type: z.enum(['expense', 'income'], { required_error: 'Selecione o tipo.' }),
  category: z.string().nullable().optional(),
  frequency: z.enum<RecurrenceFrequency, ['daily', 'weekly', 'monthly', 'yearly']>(['daily', 'weekly', 'monthly', 'yearly'], { required_error: 'Selecione a frequência.' }),
  interval: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: "Intervalo deve ser um número" }).int().positive({ message: 'O intervalo deve ser um número inteiro positivo.' })
  ),
  startDate: z.date({ required_error: 'Data de início é obrigatória.' }),
  endDate: z.date().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data final não pode ser anterior à data inicial.",
      path: ['endDate'],
    });
  }
});

export type RecurringBillFormValues = z.infer<typeof recurringBillFormSchema>;

interface RecurringBillFormProps {
  recurringBill?: RecurringBill | null;
  onSave: (data: RecurringBillFormValues) => void;
  onCancel?: () => void;
}

const frequencyOptions: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
  { value: 'yearly', label: 'Anualmente' },
];

export function RecurringBillForm({ recurringBill, onSave, onCancel }: RecurringBillFormProps) {
  const [expenseCats, setExpenseCats] = useState<string[]>([]);
  const [incomeCats, setIncomeCats] = useState<string[]>([]);

  const form = useForm<RecurringBillFormValues>({
    resolver: zodResolver(recurringBillFormSchema),
    defaultValues: {
      payeeName: recurringBill?.payeeName || '',
      amount: recurringBill?.amount || 0,
      type: recurringBill?.type || 'expense',
      category: recurringBill?.category === undefined ? NO_CATEGORY_VALUE : (recurringBill.category || NO_CATEGORY_VALUE),
      frequency: recurringBill?.frequency || 'monthly',
      interval: recurringBill?.interval || 1,
      startDate: recurringBill?.startDate ? new Date(recurringBill.startDate) : new Date(),
      endDate: recurringBill?.endDate ? new Date(recurringBill.endDate) : null,
    },
  });

  const billTypeSelected = form.watch('type');

  useEffect(() => {
    setExpenseCats(getExpenseCategories());
    setIncomeCats(getIncomeCategories());
  }, []);

  useEffect(() => {
    const currentCategory = form.getValues('category');
    const categoriesForType = billTypeSelected === 'expense' ? expenseCats : incomeCats;
    if (currentCategory !== NO_CATEGORY_VALUE && !categoriesForType.includes(currentCategory || '')) {
      form.setValue('category', NO_CATEGORY_VALUE, { shouldValidate: true });
    }
  }, [billTypeSelected, expenseCats, incomeCats, form]);

  const currentCategoryList = billTypeSelected === 'expense' ? expenseCats : incomeCats;

  function onSubmit(data: RecurringBillFormValues) {
     const dataToSave: RecurringBillFormValues = {
      ...data,
      category: data.category === NO_CATEGORY_VALUE ? undefined : data.category,
    };
    onSave(dataToSave);
  }
  
  const frequencySelected = form.watch('frequency');
  const intervalValue = form.watch('interval');
  
  const getIntervalLabel = () => {
    if (!frequencySelected) return "Intervalo";
    const s = intervalValue > 1 ? "s" : "";
    switch (frequencySelected) {
        case 'daily': return `A cada quantos Dias`;
        case 'weekly': return `A cada quantas Semanas`;
        case 'monthly': return `A cada quantos Meses`;
        case 'yearly': return `A cada quantos Anos`;
        default: return "Intervalo";
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('category', NO_CATEGORY_VALUE, { shouldValidate: true });
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="expense"><TrendingDown className="inline mr-2 h-4 w-4 text-destructive" />Despesa Recorrente</SelectItem>
                  <SelectItem value="income"><TrendingUp className="inline mr-2 h-4 w-4 text-green-600" />Receita Recorrente</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payeeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{billTypeSelected === 'expense' ? 'Nome do Beneficiário' : 'Origem da Receita'}</FormLabel>
              <FormControl>
                <Input placeholder={billTypeSelected === 'expense' ? "Ex: Aluguel, Assinatura Spotify" : "Ex: Salário, Consultoria"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Ex: 150.75" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria (Opcional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === NO_CATEGORY_VALUE ? null : value)}
                  value={field.value === null || field.value === undefined ? NO_CATEGORY_VALUE : field.value}
                >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY_VALUE}>Nenhuma</SelectItem>
                  {currentCategoryList.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequência</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {frequencyOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getIntervalLabel()}</FormLabel>
                <FormControl>
                  <Input type="number" min="1" step="1" placeholder="Ex: 1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Início da Recorrência</FormLabel>
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
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    required
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>A primeira ocorrência será considerada a partir desta data.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Final da Recorrência (Opcional)</FormLabel>
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
                        <span>Nenhuma data final (repete indefinidamente)</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={(date) => field.onChange(date || null)} // Pass null if date is cleared
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Se preenchido, a recorrência para após esta data.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
          <Button type="submit">{recurringBill ? 'Salvar Alterações' : 'Adicionar Recorrência'}</Button>
        </div>
      </form>
    </Form>
  );
}
