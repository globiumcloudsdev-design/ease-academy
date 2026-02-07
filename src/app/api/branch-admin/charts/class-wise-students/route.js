import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Class from '@/backend/models/Class';
import User from '@/backend/models/User';

async function getClassWiseStudents(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Branch admin role required.' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned to this admin.' },
        { status: 400 }
      );
    }

    await connectDB();
    const branchId = authenticatedUser.branchId;

    // Get all classes with student count
    const classData = await Class.aggregate([
      { $match: { branchId: branchId } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'studentProfile.classId',
          as: 'students',
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          studentCount: { $size: '$students' },
        },
      },
      { $sort: { name: 1 } },
    ]);

    const data = classData.map(cls => ({
      class: cls.name,
      students: cls.studentCount
    }));

    // If no data found, return mock data
    if (!data || data.length === 0 || data.every(item => item.students === 0)) {
      const mockData = [
        { class: 'Class 1', students: 35 },
        { class: 'Class 2', students: 42 },
        { class: 'Class 3', students: 38 },
        { class: 'Class 4', students: 45 },
        { class: 'Class 5', students: 40 },
        { class: 'Class 6', students: 37 }
      ];
      return NextResponse.json({
        success: true,
        data: mockData,
        message: 'Mock class-wise students data retrieved successfully',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Class-wise students data retrieved successfully',
    });
  } catch (error) {
    console.error('Class-wise students error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch class-wise students data',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getClassWiseStudents);
