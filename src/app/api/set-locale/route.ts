import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED = ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'pa'];

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') || 'en';
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';
  const locale = SUPPORTED.includes(code) ? code : 'en';

  // Redirect back to where the user was, now with the cookie set by the server
  const url = new URL(returnTo, request.url);
  const response = NextResponse.redirect(url);

  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    httpOnly: false,
  });

  return response;
}