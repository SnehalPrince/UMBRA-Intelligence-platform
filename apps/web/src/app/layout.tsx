import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { SmoothScrollProvider } from '../providers/SmoothScrollProvider';
import { QueryProvider } from '../providers/QueryProvider';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'UMBRA | Shadow Intelligence Platform',
  description: 'Advanced Computational System for Multi-layered Dark Web Analysis and Credential Breach Detection',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans selection:bg-white/20">
        <QueryProvider>
          <NuqsAdapter>
            <SmoothScrollProvider>
              {children}
            </SmoothScrollProvider>
          </NuqsAdapter>
        </QueryProvider>
        <Toaster theme="dark" position="bottom-right" richColors toastOptions={{
          style: { background: '#18181b', border: '1px solid #27272a', color: '#fafafa' },
        }} />
      </body>
    </html>
  );
}
