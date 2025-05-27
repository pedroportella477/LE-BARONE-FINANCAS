'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';
import { saveUserProfile } from '@/lib/store';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  monthlyIncome: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)), // Convert empty string to undefined for optional number
    z.number({invalid_type_error: "Renda mensal deve ser um número"}).positive({
    message: 'A renda mensal deve ser um valor positivo.',
  })),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileFormProps {
  initialProfile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
}

export function UserProfileForm({ initialProfile, onSave }: UserProfileFormProps) {
  const { toast } = useToast();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialProfile?.name || '',
      monthlyIncome: initialProfile?.monthlyIncome || 0,
    },
  });

  function onSubmit(data: ProfileFormValues) {
    const profileData: UserProfile = {
      name: data.name,
      monthlyIncome: data.monthlyIncome,
    };
    saveUserProfile(profileData);
    onSave(profileData); // Callback to update parent state if needed
    toast({
      title: 'Perfil Salvo!',
      description: 'Suas informações de perfil foram atualizadas com sucesso.',
      variant: 'default',
    });
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle>Seu Perfil</CardTitle>
        <CardDescription>Atualize suas informações pessoais e renda mensal.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    <Input type="number" placeholder="Ex: 3000.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/>
                  </FormControl>
                  <FormDescription>Sua renda mensal líquida.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Salvar Alterações</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
