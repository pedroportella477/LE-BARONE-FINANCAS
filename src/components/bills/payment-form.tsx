'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Bill } from '@/types';

const paymentFormSchema = z.object({
  paymentDate: z.date({ required_error: 'Data de pagamento é obrigatória.' }),
  receiptNotes: z.string().optional(), // Simplified: notes about receipt instead of actual upload
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  bill: Bill;
  onSave: (billId: string, paymentDate: string, receiptNotes?: string) => void;
  onCancel: () => void;
}

export function PaymentForm({ bill, onSave, onCancel }: PaymentFormProps) {
  const { toast } = useToast();
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentDate: bill.paymentDate ? new Date(bill.paymentDate) : new Date(),
      receiptNotes: bill.paymentReceipt || '',
    },
  });

  function onSubmit(data: PaymentFormValues) {
    // Actual file upload for receipt would be more complex.
    // For this example, we're just storing a note or a simulated path.
    onSave(bill.id, data.paymentDate.toISOString(), data.receiptNotes);
    toast({
      title: 'Pagamento Registrado!',
      description: `Pagamento para ${bill.payeeName} foi registrado.`,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-medium">Registrar Pagamento para: {bill.payeeName}</h3>
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Pagamento</FormLabel>
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
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="receiptNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comprovante (Nome/Referência)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: comprovante_banco_xyz.pdf" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                O upload real do comprovante não está implementado. Anote uma referência.
              </p>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar Pagamento</Button>
        </div>
      </form>
    </Form>
  );
}
