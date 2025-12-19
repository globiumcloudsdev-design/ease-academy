import { NextResponse } from 'next/server';
import { changePassword } from '@/backend/controllers/authController';
import { authenticate } from '@/backend/middleware/auth';

export async function POST(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    const result = await changePassword(
      authResult.user._id,
      currentPassword,
      newPassword
    );
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to change password' },
      { status: 400 }
    );
  }
}
