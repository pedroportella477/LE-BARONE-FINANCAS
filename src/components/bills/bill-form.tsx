
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Paperclip, Ticket, Barcode, TrendingDown, TrendingUp, Loader2, Lightbulb } from 'lucide-react';
import React, { useEffect, useState, useCallback, useRef } from 'react';

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
import { getExpenseCategories, getIncomeCategories } from '@/lib/store';
import { suggestCategory } from '@/ai/flows/suggest-category-flow';


const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB
const NO_CATEGORY_VALUE = "__NO_CATEGORY_SELECTED__";

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
  .refine(files => !files || files.length === 0 || files.length <= 1 , "Apenas um arquivo PDF pode ser enviado.") // Allow no file
  .refine(files => !files || files.length === 0 || files[0].type === "application/pdf", "O arquivo deve ser um PDF.")
  .refine(files => !files || files.length === 0 || files[0].size <= MAX_PDF_SIZE, `O arquivo PDF não pode exceder ${MAX_PDF_SIZE / (1024*1024)}MB.`)
  .optional(),
}).superRefine((data, ctx) => {
  if ((data.attachmentType === 'pix' || data.attachmentType === 'barcode') && (!data.attachmentValue || data.attachmentValue.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O valor do anexo é obrigatório para PIX ou código de barras.",
      path: ['attachmentValue'],
    });
  }
});

export type BillFormValues = z.infer<typeof billFormSchema>;

interface BillFormProps {
  bill?: Bill | null;
  onSave: (billData: BillFormValues, attachmentFile?: File) => void;
  onCancel?: () => void;
}


export function BillForm({ bill, onSave, onCancel }: BillFormProps) {
  const { toast } = useToast();
  const [expenseCats, setExpenseCats] = useState<string[]>([]);
  const [incomeCats, setIncomeCats] = useState<string[]>([]);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [categorySuggestionError, setCategorySuggestionError] = useState<string | null>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  
  const watchedPayeeName = form.watch('payeeName');
  const watchedBillType = form.watch('type');
  const attachmentTypeSelected = form.watch('attachmentType');
  const selectedPdfFile = form.watch('attachmentPdfFile');

  useEffect(() => {
    setExpenseCats(getExpenseCategories());
    setIncomeCats(getIncomeCategories());
  }, []);
  
  useEffect(() => {
    const currentCategory = form.getValues('category');
    const categoriesForType = watchedBillType === 'expense' ? expenseCats : incomeCats;
    if (currentCategory !== NO_CATEGORY_VALUE && !categoriesForType.includes(currentCategory || '')) {
        form.setValue('category', NO_CATEGORY_VALUE, { shouldValidate: true });
    }
  }, [watchedBillType, expenseCats, incomeCats, form]);

  const currentCategoryList = watchedBillType === 'expense' ? expenseCats : incomeCats;

  const triggerCategorySuggestion = useCallback(async () => {
    if (watchedPayeeName.length < 3 || !watchedBillType || currentCategoryList.length === 0) {
      setIsSuggestingCategory(false);
      return;
    }

    setIsSuggestingCategory(true);
    setCategorySuggestionError(null);

    try {
      const result = await suggestCategory({
        payeeName: watchedPayeeName,
        transactionType: watchedBillType,
        availableCategories: currentCategoryList,
      });

      if (result.suggestedCategory && currentCategoryList.includes(result.suggestedCategory)) {
        // Only set if user hasn't picked a category or if it's the default placeholder
        const currentFormCategory = form.getValues('category');
        if (currentFormCategory === NO_CATEGORY_VALUE || currentFormCategory === null || currentFormCategory === undefined) {
          form.setValue('category', result.suggestedCategory, { shouldValidate: true });
        }
      }
    } catch (error: any) {
      console.error("Error suggesting category:", error);
      setCategorySuggestionError("Erro ao sugerir categoria.");
      // Do not toast here to avoid being too noisy, error is subtle.
    } finally {
      setIsSuggestingCategory(false);
    }
  }, [watchedPayeeName, watchedBillType, currentCategoryList, form, toast]);

  useEffect(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    if (watchedPayeeName.length >= 3 && watchedBillType && !bill) { // Only suggest for new bills
      suggestionTimeoutRef.current = setTimeout(() => {
        triggerCategorySuggestion();
      }, 1000); // Debounce for 1 second
    } else {
      setIsSuggestingCategory(false); // Clear suggestion if conditions not met
    }
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [watchedPayeeName, watchedBillType, triggerCategorySuggestion, bill]);


  function onSubmit(data: BillFormValues) {
    let fileToSave: File | undefined = undefined;
    const billDataForSave: Omit<BillFormValues, 'attachmentPdfFile'> & { category: string | null } = {
        payeeName: data.payeeName,
        amount: data.amount,
        dueDate: data.dueDate,
        type: data.type,
        category: data.category === NO_CATEGORY_VALUE ? null : data.category,
        attachmentType: data.attachmentType,
        attachmentValue: data.attachmentValue, 
    };

    if (data.attachmentType === 'pdf' && data.attachmentPdfFile && data.attachmentPdfFile.length > 0) {
      fileToSave = data.attachmentPdfFile[0];
      billDataForSave.attachmentValue = fileToSave.name; 
    } else if (data.attachmentType !== 'pdf' && data.attachmentValue) {
       billDataForSave.attachmentValue = data.attachmentValue;
    } else if (data.attachmentType === 'pdf' && !fileToSave && bill?.attachmentType === 'pdf' && bill?.attachmentValue) {
      billDataForSave.attachmentValue = bill.attachmentValue;
    } else {
      if(!(data.attachmentType === 'pdf' && bill?.attachmentType === 'pdf' && bill?.attachmentValue && !fileToSave)){
         billDataForSave.attachmentValue = data.attachmentType ? data.attachmentValue : undefined;
      }
    }
    
    onSave(billDataForSave as BillFormValues, fileToSave); 
    
    const actionText = bill ? (watchedBillType === 'expense' ? 'Despesa Atualizada!' : 'Receita Atualizada!') : (watchedBillType === 'expense' ? 'Despesa Adicionada!' : 'Receita Adicionada!');
    toast({
      title: actionText,
      description: `${watchedBillType === 'expense' ? 'A despesa' : 'A receita'} para ${data.payeeName} foi salva.`,
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
    setIsSuggestingCategory(false);
    setCategorySuggestionError(null);
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
                  if (value === 'income') { 
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
              <FormLabel>{watchedBillType === 'expense' ? 'Nome do Beneficiário' : 'Origem da Receita'}</FormLabel>
              <FormControl>
                <Input placeholder={watchedBillType === 'expense' ? "Ex: Empresa de Luz" : "Ex: Salário, Cliente X"} {...field} />
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
              <FormLabel>{watchedBillType === 'expense' ? 'Data de Vencimento' : 'Data de Recebimento'}</FormLabel>
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Categoria (Opcional)
                {isSuggestingCategory && <Loader2 className="ml-2 h-4 w-4 animate-spin text-primary" />}
                {/* Optional: Show lightbulb if AI successfully suggested and field was auto-filled */}
                {/* {!isSuggestingCategory && form.getValues('category') !== NO_CATEGORY_VALUE && form.getValues('category') !== bill?.category && <Lightbulb className="ml-2 h-4 w-4 text-yellow-500" />} */}

              </FormLabel>
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
              <FormDescription>
                Agrupe suas transações por categoria. Você pode gerenciar as categorias na página de Perfil.
                 {categorySuggestionError && <span className="text-destructive"> {categorySuggestionError}</span>}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        {watchedBillType === 'expense' && (
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
                        form.setValue('attachmentValue', ''); 
                        form.setValue('attachmentPdfFile', undefined); 
                    }} 
                    value={field.value || ""}
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
          <Button type="submit">{bill ? (watchedBillType === 'expense' ? 'Salvar Despesa' : 'Salvar Receita') : (watchedBillType === 'expense' ? 'Adicionar Despesa' : 'Adicionar Receita')}</Button>
        </div>
      </form>
    </Form>
  );
}
