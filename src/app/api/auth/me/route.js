import { NextResponse } from 'next/server';
import { getCurrentUser, updateUserProfile } from '@/backend/controllers/authController';
import { authenticate } from '@/backend/middleware/auth';

export async function GET(request) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status || 401 }
      );
    }
    
    const result = await getCurrentUser(authResult.user.userId);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status || 401 }
      );
    }
    
    const body = await request.json();
    
    const result = await updateUserProfile(authResult.user.userId, body);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile' },
      { status: 400 }
    );
  }
}
