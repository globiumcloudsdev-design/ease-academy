import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/backend/controllers/authController';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    const result = await requestPasswordReset(email);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
