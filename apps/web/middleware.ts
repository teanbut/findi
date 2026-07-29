import { NextRequest, NextResponse } from 'next/server';

/**
 * One Next.js codebase serving both subdomains (technical plan §2's
 * "same Next.js codebase, portal.findi.co.za as a separate route group").
 * Host-based rewrite: portal.findi.co.za -> /portal/*, everything else
 * (www.findi.co.za, localhost for dev) -> /site/*.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const isPortal = host.startsWith('portal.') || host.startsWith('portal-');
  const prefix = isPortal ? '/portal' : '/site';

  if (req.nextUrl.pathname.startsWith(prefix)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `${prefix}${req.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
