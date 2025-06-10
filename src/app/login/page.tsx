
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/general/logo';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// SVG for Google Icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);


export default function LoginPage() {
  const { user, signInWithGoogle, loading, dbUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && dbUser) {
      router.push('/');
    }
  }, [user, dbUser, loading, router]);

  if (loading || (user && dbUser)) { // Show loader if loading or if user is logged in and we are waiting for redirect
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <Logo size={60} className="mx-auto mb-3"/>
          <CardTitle className="text-3xl font-bold text-primary">Bem-vindo(a) ao Lebarone Finanças!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Faça login com sua conta Google para gerenciar suas finanças.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full text-lg py-6"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon className="mr-3" />
            )}
            Entrar com Google
          </Button>
          <p className="text-xs text-center text-muted-foreground px-4">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade (não implementados).
          </p>
        </CardContent>
      </Card>
       <footer className="py-8 text-center text-sm text-muted-foreground/80">
          © {new Date().getFullYear()} Delta Telecom TI. Todos os direitos reservados.
      </footer>
    </div>
  );
}
