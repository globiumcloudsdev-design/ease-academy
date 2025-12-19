import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Stream from '@/backend/models/Stream';

// GET - Get all streams (school-wide, read-only for branch admin)
async function getStreams(request, authenticatedUser, userDoc) {
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

    const streams = await Stream.find(query)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: streams,
    });
  } catch (error) {
    console.error('Get streams error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch streams' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStreams);
