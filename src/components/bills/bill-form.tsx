
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Paperclip, Ticket, Barcode, TrendingDown, TrendingUp, UploadCloud } from 'lucide-react';

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
import { expenseCategories, incomeCategories } from '@/lib/categories';

const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB

const billFormSchema = z.object({
  payeeName: z.string().min(2, { message: 'Nome do beneficiário/origem deve ter pelo menos 2 caracteres.' }),
  amount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({invalid_type_error: "Valor deve ser um número"}).positive({ message: 'O valor deve ser positivo.' })
  ),
  dueDate: z.date({ required_error: 'Data de vencimento/recebimento é obrigatória.' }),
  type: z.enum(['expense', 'income'], { required_error: 'Selecione o tipo.'}),
  category: z.string().nullable().optional(),
  attachmentType: z.enum(['pdf', 'pix', 'barcode']).optional(),
  attachmentValue: z.string().optional(),
  attachmentPdfFile: z.custom<FileList>((val) => val instanceof FileList, {
    message: 'Selecione um arquivo PDF.',
  })
  .refine(files => !files || files.length <= 1, "Apenas um arquivo PDF pode ser enviado.")
  .refine(files => !files || !files[0] || files[0].type === "application/pdf", "O arquivo deve ser um PDF.")
  .refine(files => !files || !files[0] || files[0].size <= MAX_PDF_SIZE, `O arquivo PDF não pode exceder ${MAX_PDF_SIZE / (1024*1024)}MB.`)
  .optional(),
}).superRefine((data, ctx) => {
  if ((data.attachmentType === 'pix' || data.attachmentType === 'barcode') && (!data.attachmentValue || data.attachmentValue.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O valor do anexo é obrigatório para PIX ou código de barras.",
      path: ['attachmentValue'],
    });
  }
  if (data.attachmentType === 'pdf' && (!data.attachmentPdfFile || data.attachmentPdfFile.length === 0) && !data.attachmentValue) {
     // If editing an old bill that had attachmentValue (filename) but no file, it's ok.
     // For new bills, if PDF is selected, a file should ideally be uploaded.
     // However, current onSave mechanism relies on attachmentValue for the filename.
     // This refine can be adjusted if file upload becomes strictly mandatory for PDF type.
  }
});

export type BillFormValues = z.infer<typeof billFormSchema>;

interface BillFormProps {
  bill?: Bill | null;
  onSave: (billData: BillFormValues, attachmentFile?: File) => void;
  onCancel?: () => void;
}

const NO_CATEGORY_VALUE = "__NO_CATEGORY_SELECTED__";

export function BillForm({ bill, onSave, onCancel }: BillFormProps) {
  const { toast } = useToast();

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      payeeName: bill?.payeeName || '',
      amount: bill?.amount || 0,
      dueDate: bill?.dueDate ? new Date(bill.dueDate) : new Date(),
      type: bill?.type || 'expense',
      category: bill?.category === undefined ? NO_CATEGORY_VALUE : (bill.category || NO_CATEGORY_VALUE),
      attachmentType: bill?.attachmentType || undefined,
      attachmentValue: bill?.attachmentValue || '',
      attachmentPdfFile: undefined,
    },
  });

  const attachmentTypeSelected = form.watch('attachmentType');
  const billTypeSelected = form.watch('type');
  const selectedPdfFile = form.watch('attachmentPdfFile');

  const currentCategoryList = billTypeSelected === 'expense' ? expenseCategories : incomeCategories;

  function onSubmit(data: BillFormValues) {
    let fileToSave: File | undefined = undefined;
    // Create a new object for data to be saved, ensuring attachmentPdfFile is not part of it.
    const billDataForSave: Omit<BillFormValues, 'attachmentPdfFile'> & { category: string | null } = {
        payeeName: data.payeeName,
        amount: data.amount,
        dueDate: data.dueDate,
        type: data.type,
        category: data.category === NO_CATEGORY_VALUE ? null : data.category,
        attachmentType: data.attachmentType,
        attachmentValue: data.attachmentValue, // Will be overwritten by filename if PDF is uploaded
    };


    if (data.attachmentType === 'pdf' && data.attachmentPdfFile && data.attachmentPdfFile.length > 0) {
      fileToSave = data.attachmentPdfFile[0];
      billDataForSave.attachmentValue = fileToSave.name; // Set filename in attachmentValue
    } else if (data.attachmentType !== 'pdf') {
      // If not PDF, ensure attachmentPdfFile related data is not impacting attachmentValue if type changed
      // This is mostly handled by the form fields visibility, but as a safeguard:
      // billDataForSave.attachmentValue is already data.attachmentValue
    }


    onSave(billDataForSave as BillFormValues, fileToSave); // Cast as BillFormValues for the handler, though attachmentPdfFile is effectively gone
    
    const actionText = bill ? (billTypeSelected === 'expense' ? 'Despesa Atualizada!' : 'Receita Atualizada!') : (billTypeSelected === 'expense' ? 'Despesa Adicionada!' : 'Receita Adicionada!');
    toast({
      title: actionText,
      description: `${billTypeSelected === 'expense' ? 'A despesa' : 'A receita'} para ${data.payeeName} foi salva.`,
    });
    form.reset({
        payeeName: '', 
        amount: 0, 
        dueDate: new Date(), 
        type: 'expense', 
        category: NO_CATEGORY_VALUE, 
        attachmentType: undefined, 
        attachmentValue: '', 
        attachmentPdfFile: undefined
    });
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
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('category', NO_CATEGORY_VALUE, { shouldValidate: true });
                  if (value === 'income') { // Clear attachment fields if switching to income
                    form.setValue('attachmentType', undefined);
                    form.setValue('attachmentValue', '');
                    form.setValue('attachmentPdfFile', undefined);
                  }
                }}
                defaultValue={field.value}
              >
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
                    // disabled={(date) => billTypeSelected === 'expense' && date < new Date(new Date().setDate(new Date().getDate()-1)) } // Allow past dates for logging old bills
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
                <Select
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value || NO_CATEGORY_VALUE}
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
                  <Select 
                    onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('attachmentValue', ''); // Clear previous value on type change
                        form.setValue('attachmentPdfFile', undefined); // Clear file on type change
                    }} 
                    defaultValue={field.value}
                   >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum anexo" />
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

            {attachmentTypeSelected === 'pdf' && (
              <FormField
                control={form.control}
                name="attachmentPdfFile"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                  <FormItem>
                    <FormLabel>Arquivo PDF</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => onChange(e.target.files)}
                        onBlur={onBlur}
                        name={name}
                        ref={ref}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </FormControl>
                    {selectedPdfFile && selectedPdfFile.length > 0 && (
                      <FormDescription className="text-xs text-muted-foreground">
                        Arquivo selecionado: {selectedPdfFile[0].name} ({(selectedPdfFile[0].size / 1024).toFixed(1)} KB)
                      </FormDescription>
                    )}
                    {!selectedPdfFile && bill?.attachmentType === 'pdf' && bill?.attachmentValue && (
                       <FormDescription className="text-xs text-muted-foreground">
                        Anexo existente: {bill.attachmentValue}. Envie um novo arquivo para substituí-lo.
                      </FormDescription>
                    )}
                    <FormDescription>Selecione um arquivo PDF (máx. {MAX_PDF_SIZE / (1024*1024)}MB). O nome do arquivo será salvo.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

