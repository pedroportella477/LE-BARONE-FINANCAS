'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Paperclip, Ticket, Barcode, TrendingDown, TrendingUp, Tag } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import type { Bill } from '@/types';

const billFormSchema = z.object({
  payeeName: z.string().min(2, { message: 'Nome do beneficiário/origem deve ter pelo menos 2 caracteres.' }),
  amount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({invalid_type_error: "Valor deve ser um número"}).positive({ message: 'O valor deve ser positivo.' })
  ),
  dueDate: z.date({ required_error: 'Data de vencimento/recebimento é obrigatória.' }),
  type: z.enum(['expense', 'income'], { required_error: 'Selecione o tipo.'}),
  category: z.string().optional(),
  attachmentType: z.enum(['pdf', 'pix', 'barcode']).optional(),
  attachmentValue: z.string().optional(),
});

export type BillFormValues = z.infer<typeof billFormSchema>;

interface BillFormProps {
  bill?: Bill | null; // For editing
  onSave: (billData: BillFormValues, attachmentFile?: File) => void;
  onCancel?: () => void;
}

export function BillForm({ bill, onSave, onCancel }: BillFormProps) {
  const { toast } = useToast();

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      payeeName: bill?.payeeName || '',
      amount: bill?.amount || 0,
      dueDate: bill?.dueDate ? new Date(bill.dueDate) : new Date(),
      type: bill?.type || 'expense',
      category: bill?.category || '',
      attachmentType: bill?.attachmentType || undefined,
      attachmentValue: bill?.attachmentValue || '',
    },
  });

  const attachmentTypeSelected = form.watch('attachmentType');
  const billTypeSelected = form.watch('type');

  function onSubmit(data: BillFormValues) {
    onSave(data);
    const actionText = bill ? (billTypeSelected === 'expense' ? 'Despesa Atualizada!' : 'Receita Atualizada!') : (billTypeSelected === 'expense' ? 'Despesa Adicionada!' : 'Receita Adicionada!');
    toast({
      title: actionText,
      description: `${billTypeSelected === 'expense' ? 'A despesa' : 'A receita'} para ${data.payeeName} foi salva.`,
    });
    form.reset({dueDate: new Date(), type: 'expense', amount: 0, payeeName: '', category: ''}); // Reset with defaults
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="expense"><TrendingDown className="inline mr-2 h-4 w-4 text-destructive" />Despesa</SelectItem>
                  <SelectItem value="income"><TrendingUp className="inline mr-2 h-4 w-4 text-green-600" />Receita</SelectItem>
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
                <Input placeholder={billTypeSelected === 'expense' ? "Ex: Empresa de Luz" : "Ex: Salário, Cliente X"} {...field} />
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
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{billTypeSelected === 'expense' ? 'Data de Vencimento' : 'Data de Recebimento'}</FormLabel>
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
                    disabled={(date) => billTypeSelected === 'expense' && date < new Date(new Date().setDate(new Date().getDate()-1)) }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
              <FormControl>
                <div className="relative">
                   <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input placeholder="Ex: Alimentação, Transporte, Salário" {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormDescription>
                Agrupe suas transações por categoria.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        {billTypeSelected === 'expense' && (
          <>
            <FormField
              control={form.control}
              name="attachmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Anexo (Opcional para Despesa)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de anexo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf"><Paperclip className="inline mr-2 h-4 w-4" />Boleto PDF</SelectItem>
                      <SelectItem value="pix"><Ticket className="inline mr-2 h-4 w-4" />Chave PIX</SelectItem>
                      <SelectItem value="barcode"><Barcode className="inline mr-2 h-4 w-4" />Código de Barras</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {attachmentTypeSelected === 'pix' && (
              <FormField
                control={form.control}
                name="attachmentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave PIX</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a chave PIX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {attachmentTypeSelected === 'barcode' && (
              <FormField
                control={form.control}
                name="attachmentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Barras</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite ou cole o código de barras" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {attachmentTypeSelected === 'pdf' && (
              <FormField
                control={form.control}
                name="attachmentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Arquivo PDF (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: conta_luz_maio.pdf" {...field} />
                    </FormControl>
                    <FormDescription>Apenas o nome do arquivo. O upload real do PDF não está implementado.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
          <Button type="submit">{bill ? (billTypeSelected === 'expense' ? 'Salvar Despesa' : 'Salvar Receita') : (billTypeSelected === 'expense' ? 'Adicionar Despesa' : 'Adicionar Receita')}</Button>
        </div>
      </form>
    </Form>
  );
}
