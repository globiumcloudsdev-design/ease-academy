import { NextResponse } from 'next/server';
import { refreshAccessToken } from '@/backend/controllers/authController';

export async function POST(request) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token not found' },
        { status: 401 }
      );
    }
    
    const result = await refreshAccessToken(refreshToken);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to refresh token' },
      { status: 401 }
    );
  }
}
