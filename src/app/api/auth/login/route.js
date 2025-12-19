import { NextResponse } from 'next/server';
import { loginUser } from '@/backend/controllers/authController';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const { email, password } = body;
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const result = await loginUser(email, password);
    
    // Set refresh token as httpOnly cookie
    const response = NextResponse.json(result, { status: 200 });
    
    response.cookies.set('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 401 }
    );
  }
}
