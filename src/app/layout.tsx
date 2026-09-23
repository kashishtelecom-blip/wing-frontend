import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { InteractionsProvider } from '@/lib/user-interactions';
import { ThemeProvider } from '@/lib/theme';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wing',
  description: 'A social platform built for everyone',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try { if (localStorage.getItem('wing_theme') === 'dark') document.documentElement.classList.add('dark'); } catch(e) {}",
          }}
        />
      </head>
      <body className={inter.className + ' bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100'}>
        <ThemeProvider>
          <AuthProvider>
            <InteractionsProvider>
              <div className="min-h-screen flex flex-col">
                <div className="flex-1">{children}</div>
                <Footer />
              </div>
            </InteractionsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}