import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

export const middleware = async (request: NextRequest) => {
    const authRes = await auth0.middleware(request);

    if (request.nextUrl.pathname.startsWith('/auth')) {
        return authRes;
    }

    const { origin } = new URL(request.url);
    const session = await auth0.getSession();

    // Redirect to login if user don't have a session.
    if (!session) {
        return NextResponse.redirect(`${origin}/auth/login`);
    }

    return authRes;
};

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image, images (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - $ (root)
         */
        '/((?!_next/static|_next/image|images|favicon.[ico|png]|sitemap.xml|robots.txt|$).*)',
    ],
};
