import { NextResponse } from 'next/server';
import { resetPassword } from '@/backend/controllers/authController';

export async function POST(request) {
  try {
    const body = await request.json();
    const { resetToken, newPassword } = body;
    
    // Validate required fields
    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Reset token and new password are required' },
        { status: 400 }
      );
    }
    
    const result = await resetPassword(resetToken, newPassword);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reset password' },
      { status: 400 }
    );
  }
}
