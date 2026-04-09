import { NextResponse } from 'next/server'; 
import type { NextRequest } from 'next/server';

const locales = ['en', 'ru'];
const defaultLocale = 'en';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;


  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/.well-known') ||
    pathname.includes('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get('locale')?.value;
  const acceptLang = request.headers.get('accept-language')?.split(',')[0].split('-')[0] || '';
  const browserLocale = ['ru', 'kk', 'be', 'uk'].includes(acceptLang) ? 'ru' : 'en';

  const locale = cookieLocale || browserLocale || defaultLocale;



  const pathnameHasLocale = locales.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );

  if (!pathnameHasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|\\.well-known).*)'],
};