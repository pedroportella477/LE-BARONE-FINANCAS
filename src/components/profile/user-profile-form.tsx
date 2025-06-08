
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import React, { useState, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';
import { saveUserProfile } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Trash2 } from 'lucide-react'; // Importar ícones
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const RESIZED_IMAGE_DIMENSION = 150; // px

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  monthlyIncome: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: 'Renda mensal deve ser um número' }).positive({
      message: 'A renda mensal deve ser um valor positivo.',
    })
  ),
  cpf: z
    .string()
    .refine((val) => val === '' || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val), {
      message: 'CPF inválido. Formato esperado: 000.000.000-00 ou deixe em branco.',
    })
    .optional()
    .nullable(),
  cellphone: z
    .string()
    .refine((val) => val === '' || /^\(\d{2}\) \d{5}-\d{4}$/.test(val), {
      message: 'Celular inválido. Formato esperado: (00) 00000-0000 ou deixe em branco.',
    })
    .optional()
    .nullable(),
  photoUrl: z.string().nullable().optional(), // Armazena a Data URL
  // Campo para o input de arquivo, não será salvo diretamente no profileData
  photoFile: z
    .custom<FileList>()
    .refine(
      (files) => {
        if (!files || files.length === 0) return true; // Permite não selecionar arquivo
        return files[0].size <= MAX_FILE_SIZE_BYTES;
      },
      `O tamanho máximo da foto é ${MAX_FILE_SIZE_MB}MB.`
    )
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;
        return ACCEPTED_IMAGE_TYPES.includes(files[0].type);
      },
      'Apenas arquivos JPG, PNG, GIF, WEBP são permitidos.'
    )
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileFormProps {
  initialProfile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
}

export function UserProfileForm({ initialProfile, onSave }: UserProfileFormProps) {
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(initialProfile?.photoUrl || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialProfile?.name || '',
      monthlyIncome: initialProfile?.monthlyIncome || 0,
      cpf: initialProfile?.cpf || '',
      cellphone: initialProfile?.cellphone || '',
      photoUrl: initialProfile?.photoUrl || null,
      photoFile: undefined,
    },
  });

  useEffect(() => {
    // Sincronizar previewImage com o valor inicial do formulário, caso initialProfile mude
    setPreviewImage(initialProfile?.photoUrl || null);
    form.reset({
        name: initialProfile?.name || '',
        monthlyIncome: initialProfile?.monthlyIncome || 0,
        cpf: initialProfile?.cpf || '',
        cellphone: initialProfile?.cellphone || '',
        photoUrl: initialProfile?.photoUrl || null,
        photoFile: undefined,
    });
  }, [initialProfile, form]);


  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar com Zod antes de processar
      const validationResult = await form.trigger('photoFile');
      if (!validationResult || form.formState.errors.photoFile) {
        setPreviewImage(initialProfile?.photoUrl || null); // Reverte para a imagem anterior ou nenhuma
        form.setValue('photoFile', undefined); // Limpa o arquivo inválido
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const originalDataUrl = reader.result as string;
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            toast({ title: 'Erro ao processar imagem', description: 'Não foi possível obter o contexto do canvas.', variant: 'destructive'});
            return;
          }

          let { width, height } = img;
          if (width > height) {
            if (width > RESIZED_IMAGE_DIMENSION) {
              height = Math.round((height * RESIZED_IMAGE_DIMENSION) / width);
              width = RESIZED_IMAGE_DIMENSION;
            }
          } else {
            if (height > RESIZED_IMAGE_DIMENSION) {
              width = Math.round((width * RESIZED_IMAGE_DIMENSION) / height);
              height = RESIZED_IMAGE_DIMENSION;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9); // Qualidade 0.9
          setPreviewImage(resizedDataUrl);
          form.setValue('photoUrl', resizedDataUrl, { shouldValidate: true });
        };
        img.onerror = () => {
            toast({ title: 'Erro ao carregar imagem', description: 'Não foi possível carregar o arquivo de imagem selecionado.', variant: 'destructive'});
            setPreviewImage(initialProfile?.photoUrl || null);
            form.setValue('photoFile', undefined);
        };
        img.src = originalDataUrl;
      };
      reader.onerror = () => {
        toast({ title: 'Erro ao ler arquivo', description: 'Não foi possível ler o arquivo selecionado.', variant: 'destructive'});
        setPreviewImage(initialProfile?.photoUrl || null);
        form.setValue('photoFile', undefined);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    form.setValue('photoUrl', null);
    form.setValue('photoFile', undefined); // Limpa qualquer arquivo selecionado
    const fileInput = document.getElementById('photoFile') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = ''; // Reseta o input de arquivo
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    const profileData: UserProfile = {
      name: data.name,
      monthlyIncome: data.monthlyIncome,
      cpf: data.cpf || null,
      cellphone: data.cellphone || null,
      photoUrl: data.photoUrl, // Já deve ser a Data URL redimensionada ou null
    };
    saveUserProfile(profileData);
    onSave(profileData);
    toast({
      title: 'Perfil Salvo!',
      description: 'Suas informações de perfil foram atualizadas com sucesso.',
      variant: 'default',
    });
    form.setValue('photoFile', undefined); // Limpa o campo photoFile após o envio bem-sucedido
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle>Seu Perfil</CardTitle>
        <CardDescription>Atualize suas informações pessoais, renda mensal e foto.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col md:flex-row-reverse md:gap-8 items-start">
              {/* Coluna do Avatar (à direita em desktop, acima em mobile pela classe flex-col md:flex-row-reverse) */}
              <div className="w-full md:w-auto md:max-w-[200px] flex flex-col items-center space-y-3 mb-6 md:mb-0 md:pt-8">
                <Avatar className="h-36 w-36 text-4xl border-2 border-primary/20 shadow-md">
                  <AvatarImage src={previewImage || undefined} alt={form.getValues('name')} />
                  <AvatarFallback>
                    {form.getValues('name')?.substring(0, 2).toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>
                {/* O input real está escondido, o label age como botão */}
                <FormField
                  control={form.control}
                  name="photoFile"
                  render={({ field }) => ( // field não é usado diretamente aqui, mas é necessário para o hook form
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          id="photoFile" // ID para o label
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </FormControl>
                       <label
                        htmlFor="photoFile" // Conecta ao input escondido
                        className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer w-full flex items-center justify-center')}
                      >
                        <Upload className="mr-2 h-4 w-4" /> Alterar Foto
                      </label>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                {(previewImage) && (
                  <Button variant="ghost" onClick={handleRemoveImage} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" /> Remover Foto
                  </Button>
                )}
                <p className="text-xs text-muted-foreground text-center px-2">
                  JPG, PNG, GIF, WEBP (Máx {MAX_FILE_SIZE_MB}MB). A imagem será redimensionada para {RESIZED_IMAGE_DIMENSION}x{RESIZED_IMAGE_DIMENSION}px.
                </p>
              </div>

              {/* Coluna dos Campos do Formulário (à esquerda em desktop) */}
              <div className="flex-grow space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormDescription>Como você gostaria de ser chamado?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renda Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 3000.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>Sua renda mensal líquida.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>Seu Cadastro de Pessoa Física.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cellphone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>Seu número de celular com DDD.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" className="w-full md:w-auto">Salvar Alterações</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
