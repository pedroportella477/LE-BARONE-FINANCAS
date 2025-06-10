
'use client'; // Required for AuthProvider and usePathname

import type { Metadata } from 'next'; // Metadata can still be used but generated in a different way if needed client-side
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Home, User, Combine, FileText, Settings, PanelLeft, Repeat, AreaChart, PiggyBank, Target, LogOut, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'; // Corrected import for usePathname
import React, { useEffect } from 'react';


import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Logo from '@/components/general/logo';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'; 
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// export const metadata: Metadata = { // Static metadata is fine for client components, or can be dynamic
//   title: 'Lebarone Finanças',
//   description: 'Gerenciamento financeiro pessoal simplificado.',
// };

const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string; }) => {
  const currentPath = usePathname();
  const isActive = currentPath === href || (href !== '/' && currentPath.startsWith(href) && href !== '/login');
  
  return (
    <SidebarMenuItem>
      <Link href={href} legacyBehavior passHref>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={{ children: label, side: "right", align: "center", className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
        >
          <a>
            <Icon />
            <span>{label}</span>
          </a>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
};

const AppSidebarNavigation = () => {
  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/bills', icon: Combine, label: 'Transações' },
    { href: '/recurring-transactions', icon: Repeat, label: 'Recorrentes' },
    { href: '/budgets', icon: PiggyBank, label: 'Orçamentos' },
    { href: '/financial-goals', icon: Target, label: 'Metas Financeiras' },
    { href: '/reports/monthly', icon: AreaChart, label: 'Relatórios' },
    { href: '/attachment-parser', icon: FileText, label: 'Analisar Anexo' },
    // { href: '/profile', icon: User, label: 'Perfil' }, // Perfil será acessado pelo dropdown do usuário
  ];

  return (
     <SidebarMenu>
      {navItems.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </SidebarMenu>
  );
}

const UserNav = () => {
  const { user, dbUser, dbUserProfile, signOut, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
  }

  if (!user || !dbUser) {
    return null; // ou um botão de login se preferir, mas o AuthProvider já redireciona
  }
  
  const userDisplayName = user.displayName || dbUser.name || 'Usuário';
  const userPhotoURL = user.photoURL || dbUserProfile?.photoUrl || undefined;


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={userPhotoURL} alt={userDisplayName} />
            <AvatarFallback>{userDisplayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDisplayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil & Config.</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')} disabled>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações App (desabilitado)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, dbUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && document.title !== 'Lebarone Finanças') {
        document.title = 'Lebarone Finanças';
    }
  }, []);


  if (loading) {
     return (
      <div className="flex justify-center items-center h-screen w-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    // AuthProvider já faz o redirect, mas este é um fallback ou para UI antes do redirect
    return (
         <div className="flex justify-center items-center h-screen w-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Redirecionando para o login...</p>
        </div>
    );
  }
  
  if (pathname === '/login') {
    return <>{children}</>; // Renderiza apenas o conteúdo da página de login
  }


  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-4 items-center">
          <Link href="/" className="flex items-center gap-2 group/logo">
            <Logo size={32}/>
            <span className="font-semibold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Lebarone Finanças
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
           <AppSidebarNavigation/>
        </SidebarContent>
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-sidebar-foreground/70">
            © {new Date().getFullYear()} Delta Telecom TI
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 justify-between">
           <SidebarTrigger className="md:hidden" />
           <div className="flex-1"></div> {/* Espaçador para empurrar UserNav para a direita */}
           <UserNav />
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        <footer className="border-t p-6 text-center text-sm text-muted-foreground">
          Direitos reservados a Delta Telecom TI
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
         {/* Metadata pode ser definida aqui se for estática ou via useEffect/Helmet para dinâmica */}
        <title>Lebarone Finanças</title>
        <meta name="description" content="Gerenciamento financeiro pessoal simplificado." />
      </head>
      <body className="antialiased font-inter">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
