import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = [
  'en', // English
  'hi', // Hindi
  'mr', // Marathi
  'ta', // Tamil
  'te', // Telugu
  'bn', // Bengali
  'gu', // Gujarati
  'kn', // Kannada
  'ml', // Malayalam
  'pa', // Punjabi
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value as Locale | undefined;
  const locale: Locale = raw && locales.includes(raw) ? raw : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});