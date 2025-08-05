import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseInitialized } from '@/lib/database';
import { authenticateUser, initializeDeveloperAccounts } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Ensure DB ready and dev accounts exist (idempotent)
    await ensureDatabaseInitialized();
    await initializeDeveloperAccounts();

    // Try DB-backed authentication first
    let auth = await authenticateUser(email, password);

    // Fallback to simple hardcoded auth (kept for dev resilience)
    if (!auth.success) {
      if (
        (email === 'whitepointer2016@gmail.com' || email === 'michaelalanwilson@gmail.com') &&
        password === 'Tr@ders84'
      ) {
        auth = {
          success: true,
          user: {
            // create stable dev ids matching seed for consistency if present
            id: email === 'whitepointer2016@gmail.com' ? 'user_admin_david' : 'user_admin_michael',
            email,
            role: 'developer',
            status: 'active',
            first_login: false,
            remember_login: true,
          } as any,
        };
      } else if ((email === 'admin' || email === 'admin@whitepointer.com') && password === 'admin') {
        auth = {
          success: true,
          user: {
            id: `admin-${Date.now()}`,
            email,
            role: 'admin',
            status: 'active',
            first_login: false,
            remember_login: true,
          } as any,
        };
      }
    }

    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Issue httpOnly cookie for middleware-based SSR gating
    const res = NextResponse.json({
      success: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        role: (auth.user as any).role,
        name: (auth.user as any).name ?? 'User',
      },
    });

    const cookiePayload = JSON.stringify({
      id: auth.user.id,
      email: auth.user.email,
      role: (auth.user as any).role,
    });

    res.cookies.set('wpa_auth', cookiePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return res;
  } catch (error) {
    console.error('Simple login error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}