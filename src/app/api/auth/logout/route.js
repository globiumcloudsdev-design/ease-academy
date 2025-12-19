import { NextResponse } from 'next/server';
import { logoutUser } from '@/backend/controllers/authController';
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
    
    const result = await logoutUser(authResult.user._id);
    
    // Clear refresh token cookie
    const response = NextResponse.json(result, { status: 200 });
    
    response.cookies.delete('refreshToken');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
