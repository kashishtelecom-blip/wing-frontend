import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { SocketProvider } from '@/lib/socket-context';
import { InteractionsProvider } from '@/lib/user-interactions';
import { ThemeProvider } from '@/lib/theme';
import { Footer } from '@/components/Footer';
import { PwaProvider } from '@/components/PwaProvider';


const inter = Inter({ subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wing-frontend.vercel.app';
const SITE_NAME = 'Wing';
const SITE_TAGLINE = 'A new home for your ideas';
const SITE_DESCRIPTION =
  'Post, connect, and build your community. Wing is a modern social platform for sharing ideas, chatting with friends, and growing your audience.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Wing',
    'social media',
    'community',
    'posts',
    'chat',
    'twitter alternative',
    'threads alternative',
    'social platform',
  ],
  authors: [{ name: 'Wing' }],
  creator: 'Wing',
  publisher: 'Wing',
  category: 'Social',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    creator: '@wing',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/wing-logo-v2.png',
    shortcut: '/wing-logo-v2.png',
    apple: '/wing-logo-v2.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#030712' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try { if (localStorage.getItem('wing_theme') === 'dark') document.documentElement.classList.add('dark'); } catch(e) {}",
          }}
        />
      </head>
      <body className={inter.className + ' bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100'}>
        <PwaProvider />  
         <ThemeProvider>
          <AuthProvider>
             <SocketProvider>
            <InteractionsProvider>
              <div className="min-h-screen flex flex-col">
                <div className="flex-1">{children}</div>
                <Footer />
              </div>
            </InteractionsProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}