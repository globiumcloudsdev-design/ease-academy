import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Level from '@/backend/models/Level';

// GET - Get all levels (school-wide, read-only for branch admin)
async function getLevels(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Build query - school-wide data
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const levels = await Level.find(query)
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: levels,
    });
  } catch (error) {
    console.error('Get levels error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch levels' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getLevels);
