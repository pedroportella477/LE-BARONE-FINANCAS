
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import React, { useState, useEffect, useCallback } from 'react';
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
import type { UserProfile as UserProfileType } from '@/types'; // Renamed to avoid conflict
// import { saveUserProfile as saveUserProfileToLocalStore } from '@/lib/store'; // No longer saving directly to local store
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';


const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const RESIZED_IMAGE_DIMENSION = 150; // px

const profileFormSchema = z.object({
  // Name and email will come from Firebase Auth user object, not part of this form's direct state for saving to UserProfile model
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
  photoFile: z
    .custom<FileList>()
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;
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

// Remove onSave from props, it will be handled by API call
interface UserProfileFormProps {
  // initialProfile: UserProfileType | null; // UserProfileType comes from AuthContext now
}

export function UserProfileForm({ }: UserProfileFormProps) {
  const { toast } = useToast();
  const { user, dbUser, dbUserProfile, loading: authLoading, refreshDbUser } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      monthlyIncome: 0,
      cpf: '',
      cellphone: '',
      photoUrl: null,
      photoFile: undefined,
    },
  });
  
  const userName = user?.displayName || dbUser?.name || "Usuário";
  const userEmail = user?.email || dbUser?.email || "Email não disponível";


  useEffect(() => {
    if (dbUserProfile) {
      form.reset({
        monthlyIncome: dbUserProfile.monthlyIncome || 0,
        cpf: dbUserProfile.cpf || '',
        cellphone: dbUserProfile.cellphone || '',
        photoUrl: dbUserProfile.photoUrl || user?.photoURL || null, // Prioritize dbUserProfile.photoUrl
        photoFile: undefined,
      });
      setPreviewImage(dbUserProfile.photoUrl || user?.photoURL || null);
    } else if (user) { // If dbUserProfile is null but Firebase user exists (e.g. during initial creation)
       form.reset({
        monthlyIncome: 0,
        cpf: '',
        cellphone: '',
        photoUrl: user.photoURL || null,
        photoFile: undefined,
      });
      setPreviewImage(user.photoURL || null);
    }
  }, [dbUserProfile, user, form]);


  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationResult = await form.trigger('photoFile');
      if (!validationResult || form.formState.errors.photoFile) {
        setPreviewImage(dbUserProfile?.photoUrl || user?.photoURL || null);
        form.setValue('photoFile', undefined);
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
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setPreviewImage(resizedDataUrl);
          form.setValue('photoUrl', resizedDataUrl, { shouldValidate: true });
        };
        img.onerror = () => {
          toast({ title: 'Erro ao carregar imagem', variant: 'destructive'});
          setPreviewImage(dbUserProfile?.photoUrl || user?.photoURL || null);
          form.setValue('photoFile', undefined);
        };
        img.src = originalDataUrl;
      };
      reader.onerror = () => {
        toast({ title: 'Erro ao ler arquivo', variant: 'destructive'});
        setPreviewImage(dbUserProfile?.photoUrl || user?.photoURL || null);
        form.setValue('photoFile', undefined);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    form.setValue('photoUrl', null);
    form.setValue('photoFile', undefined);
    const fileInput = document.getElementById('photoFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
      toast({ title: "Erro de Autenticação", description: "Usuário não está logado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const payload = {
        // name: data.name, // Name and email are from Firebase Auth primarily
        monthlyIncome: data.monthlyIncome,
        cpf: data.cpf || null,
        cellphone: data.cellphone || null,
        photoUrl: data.photoUrl, // This is the potentially new Data URL from previewImage
      };

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao atualizar perfil.');
      }

      await refreshDbUser(); // Refresh user data in AuthContext
      toast({
        title: 'Perfil Salvo!',
        description: 'Suas informações de perfil foram atualizadas.',
        variant: 'default',
      });
      form.setValue('photoFile', undefined);
    } catch (error: any) {
      toast({
        title: 'Erro ao Salvar Perfil',
        description: error.message || 'Ocorreu um problema ao salvar suas informações.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (authLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
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
              <div className="w-full md:w-auto md:max-w-[200px] flex flex-col items-center space-y-3 mb-6 md:mb-0 md:pt-8">
                <Avatar className="h-36 w-36 text-4xl border-2 border-primary/20 shadow-md">
                  <AvatarImage src={previewImage || undefined} alt={userName} />
                  <AvatarFallback>
                    {userName?.substring(0, 2).toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="photoFile"
                  render={() => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          id="photoFile"
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                       <label
                        htmlFor="photoFile"
                        className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer w-full flex items-center justify-center', isSubmitting && "opacity-50 cursor-not-allowed")}
                      >
                        <Upload className="mr-2 h-4 w-4" /> Alterar Foto
                      </label>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />
                {(previewImage) && (
                  <Button variant="ghost" onClick={handleRemoveImage} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remover Foto
                  </Button>
                )}
                <p className="text-xs text-muted-foreground text-center px-2">
                  JPG, PNG, GIF, WEBP (Máx {MAX_FILE_SIZE_MB}MB). A imagem será redimensionada.
                </p>
              </div>

              <div className="flex-grow space-y-6">
                 {/* Display Name and Email (read-only from auth) */}
                <FormItem>
                    <FormLabel>Nome Completo (Google)</FormLabel>
                    <Input readOnly value={userName} className="bg-muted/50 cursor-default" />
                    <FormDescription>Seu nome como configurado na conta Google.</FormDescription>
                </FormItem>
                <FormItem>
                    <FormLabel>Email (Google)</FormLabel>
                    <Input readOnly value={userEmail} className="bg-muted/50 cursor-default" />
                     <FormDescription>Seu email de login.</FormDescription>
                </FormItem>

                <FormField
                  control={form.control}
                  name="monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renda Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 3000.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
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
                        <Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} disabled={isSubmitting} />
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
                        <Input placeholder="(00) 00000-0000" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>Seu número de celular com DDD.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || authLoading}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
