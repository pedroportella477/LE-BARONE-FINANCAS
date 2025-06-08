
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Home, User, Combine, FileText, Settings, PanelLeft, Repeat, AreaChart, PiggyBank } from 'lucide-react'; // Added PiggyBank

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

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Lebarone Finanças',
  description: 'Gerenciamento financeiro pessoal simplificado.',
};

const NavItem = ({ href, icon: Icon, label, currentPath }: { href: string; icon: React.ElementType; label: string; currentPath: string }) => {
  const isActive = currentPath === href || (href !== '/' && currentPath.startsWith(href));
  
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
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/bills', icon: Combine, label: 'Transações' },
    { href: '/recurring-transactions', icon: Repeat, label: 'Recorrentes' },
    { href: '/budgets', icon: PiggyBank, label: 'Orçamentos' }, // Added Budgets link
    { href: '/reports/monthly', icon: AreaChart, label: 'Relatórios' },
    { href: '/attachment-parser', icon: FileText, label: 'Analisar Anexo' },
    { href: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
     <SidebarMenu>
      {navItems.map((item) => (
        <NavItem key={item.href} {...item} currentPath={currentPath} />
      ))}
    </SidebarMenu>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="antialiased font-inter">
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
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
               <SidebarTrigger className="md:hidden" />
            </header>
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
            <footer className="border-t p-6 text-center text-sm text-muted-foreground">
              Direitos reservados a Delta Telecom TI
            </footer>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
