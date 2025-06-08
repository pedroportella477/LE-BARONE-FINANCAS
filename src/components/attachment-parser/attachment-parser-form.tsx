
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UploadCloud, Loader2, CheckCircle, AlertTriangle, PlusSquare, ClipboardCopy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { attachmentParser } from '@/ai/flows/attachment-parser';
import type { AttachmentParserOutput } from '@/ai/flows/attachment-parser';
import { useToast } from '@/hooks/use-toast';
import { addBill } from '@/lib/store';
import { defaultCategoryForAttachment } from '@/lib/categories';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const formSchema = z.object({
  file: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, 'Selecione um arquivo.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `O tamanho máximo é 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      'Apenas arquivos .pdf, .jpg, .png, .webp são aceitos.'
    ),
});

type AttachmentParserFormValues = z.infer<typeof formSchema>;

const determineAttachmentTypeFromDetails = (details?: string): 'pdf' | 'pix' | 'barcode' | undefined => {
  if (!details) return undefined;
  const trimmedDetails = details.trim();
  // Looser PDF check, can be a filename or a path-like string
  if (trimmedDetails.toLowerCase().includes('.pdf') || (trimmedDetails.includes('/') && !trimmedDetails.startsWith('http'))) return 'pdf';
  if (/^\d{40,}$/.test(trimmedDetails)) return 'barcode'; // Common barcode lengths are 40+
  if (trimmedDetails.length > 0 && !trimmedDetails.startsWith('http')) return 'pix'; // Default to PIX if details exist, aren't clearly PDF/barcode, and not a URL
  return undefined;
};


export function AttachmentParserForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<AttachmentParserOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<AttachmentParserFormValues>({
    resolver: zodResolver(formSchema),
  });

  const readFileAsDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: AttachmentParserFormValues) => {
    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const file = data.file[0];
      const attachmentDataUri = await readFileAsDataUri(file);
      
      const result = await attachmentParser({ attachmentDataUri });
      setExtractedData(result);
      toast({
        title: 'Análise Concluída!',
        description: 'Os dados do anexo foram extraídos.',
        variant: 'default',
      });
    } catch (e: any) {
      console.error("Attachment parsing error:", e);
      setError(e.message || 'Ocorreu um erro ao analisar o anexo.');
      toast({
        title: 'Erro na Análise',
        description: e.message || 'Não foi possível processar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPix = async (pixCode: string) => {
    if (!navigator.clipboard) {
      toast({
        title: 'Erro ao Copiar',
        description: 'Seu navegador não suporta a cópia para a área de transferência.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(pixCode);
      toast({
        title: 'PIX Copiado!',
        description: 'O código PIX foi copiado para a área de transferência.',
      });
    } catch (err) {
      console.error('Failed to copy PIX code: ', err);
      toast({
        title: 'Erro ao Copiar',
        description: 'Não foi possível copiar o código PIX.',
        variant: 'destructive',
      });
    }
  };

  const handleAddBillFromExtraction = () => {
    if (!extractedData) return;
    try {
      const billAttachmentType = determineAttachmentTypeFromDetails(extractedData.paymentDetails);
      addBill({
        payeeName: extractedData.payeeName,
        amount: extractedData.amount,
        dueDate: extractedData.dueDate, 
        type: 'expense', 
        category: defaultCategoryForAttachment, 
        attachmentType: billAttachmentType,
        attachmentValue: extractedData.paymentDetails,
      });
      toast({
        title: 'Despesa Adicionada!',
        description: `Despesa para ${extractedData.payeeName} adicionada com a categoria '${defaultCategoryForAttachment}'.`,
      });
      setExtractedData(null); 
      form.reset(); // Reset the form as well
    } catch (error) {
      toast({
        title: 'Erro ao Adicionar Despesa',
        description: 'Não foi possível adicionar a despesa automaticamente.',
        variant: 'destructive',
      });
    }
  };
  
  const displayAttachmentType = extractedData ? determineAttachmentTypeFromDetails(extractedData.paymentDetails) : undefined;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-primary" />
          Analisador de Anexos (Beta)
        </CardTitle>
        <CardDescription>
          Envie um PDF de boleto ou imagem de QR Code/código de barras PIX para extrair os detalhes. A transação será adicionada como uma despesa com a categoria padrão "{defaultCategoryForAttachment}".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-foreground mb-1">
              Selecione o arquivo
            </label>
            <Input
              id="file-upload"
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              {...form.register('file')}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {form.formState.errors.file && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.file.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            Analisar Anexo
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {extractedData && (
          <Card className="mt-8 bg-secondary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Dados Extraídos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Beneficiário:</strong> {extractedData.payeeName}</p>
              <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(extractedData.amount)}</p>
              <p><strong>Vencimento:</strong> {new Date(extractedData.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
              {extractedData.paymentDetails && (
                <div className="flex items-center justify-between">
                  <p className="truncate pr-2"><strong>Detalhes Pag.:</strong> {extractedData.paymentDetails}</p>
                  {displayAttachmentType === 'pix' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPix(extractedData.paymentDetails!)}
                      className="ml-2 flex-shrink-0"
                      title="Copiar código PIX"
                    >
                      <ClipboardCopy className="mr-2 h-3 w-3" />
                      Copiar PIX
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddBillFromExtraction} variant="outline">
                <PlusSquare className="mr-2 h-4 w-4" />
                Adicionar esta despesa
              </Button>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
