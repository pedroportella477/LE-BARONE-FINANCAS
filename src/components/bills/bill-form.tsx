'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Paperclip, Ticket, Barcode } from 'lucide-react';

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
  payeeName: z.string().min(2, { message: 'Nome do beneficiário deve ter pelo menos 2 caracteres.' }),
  amount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({invalid_type_error: "Valor deve ser um número"}).positive({ message: 'O valor da conta deve ser positivo.' })
  ),
  dueDate: z.date({ required_error: 'Data de vencimento é obrigatória.' }),
  attachmentType: z.enum(['pdf', 'pix', 'barcode']).optional(),
  attachmentValue: z.string().optional(), // For PIX key or barcode string
  // attachmentFile: typeof window === 'undefined' ? z.any().optional() : z.instanceof(File).optional(), // For PDF file upload
});

type BillFormValues = z.infer<typeof billFormSchema>;

interface BillFormProps {
  bill?: Bill | null; // For editing
  onSave: (billData: BillFormValues, attachmentFile?: File) => void;
  onCancel?: () => void;
}

export function BillForm({ bill, onSave, onCancel }: BillFormProps) {
  const { toast } = useToast();
  // const [attachmentFile, setAttachmentFile] = useState<File | undefined>();

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      payeeName: bill?.payeeName || '',
      amount: bill?.amount || 0,
      dueDate: bill?.dueDate ? new Date(bill.dueDate) : new Date(),
      attachmentType: bill?.attachmentType || undefined,
      attachmentValue: bill?.attachmentValue || '',
    },
  });

  const attachmentType = form.watch('attachmentType');

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   if (event.target.files && event.target.files[0]) {
  //     setAttachmentFile(event.target.files[0]);
  //     form.setValue('attachmentValue', event.target.files[0].name);
  //   }
  // };

  function onSubmit(data: BillFormValues) {
    // Simplified attachment handling: for PDF, one would typically upload the file separately.
    // For this example, attachmentValue holds filename if PDF, or key/code directly.
    // A real app would handle file uploads to a server or cloud storage.
    // onSave(data, data.attachmentType === 'pdf' ? attachmentFile : undefined);
    onSave(data); // Simplified for now
    
    toast({
      title: bill ? 'Conta Atualizada!' : 'Conta Adicionada!',
      description: `A conta para ${data.payeeName} foi salva.`,
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="payeeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Beneficiário</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Empresa de Luz" {...field} />
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
                <Input type="number" placeholder="Ex: 150.75" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
              <FormLabel>Data de Vencimento</FormLabel>
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
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate()-1)) } // Disable past dates
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
          name="attachmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Anexo (Opcional)</FormLabel>
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

        {attachmentType === 'pix' && (
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

        {attachmentType === 'barcode' && (
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
        
        {/* Simplified PDF: We'll just store a note or filename. Actual upload is complex for this scope. */}
        {attachmentType === 'pdf' && (
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
          // <FormItem>
          //   <FormLabel>Arquivo PDF</FormLabel>
          //   <FormControl>
          //     <Input type="file" accept=".pdf" onChange={handleFileChange} />
          //   </FormControl>
          //   <FormDescription>Anexe o boleto em formato PDF.</FormDescription>
          //   <FormMessage />
          // </FormItem>
        )}


        <div className="flex justify-end gap-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
          <Button type="submit">{bill ? 'Salvar Alterações' : 'Adicionar Conta'}</Button>
        </div>
      </form>
    </Form>
  );
}
