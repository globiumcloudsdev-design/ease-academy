import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Grade from '@/backend/models/Grade';

// GET - Get all grades (school-wide, read-only for branch admin)
async function getGrades(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const search = searchParams.get('search') || '';

    // Build query - school-wide data
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [grades, total] = await Promise.all([
      Grade.find(query)
        .populate('levelId', 'name code')
        .sort({ gradeNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Grade.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        grades,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get grades error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getGrades);
