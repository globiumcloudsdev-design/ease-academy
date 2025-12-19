import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Class from '@/backend/models/Class';
import Grade from '@/backend/models/Grade';
import User from '@/backend/models/User';
import Subject from '@/backend/models/Subject';

// GET - Get all classes for branch admin's branch
async function getClasses(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const gradeId = searchParams.get('gradeId');

    // Build query - only for this branch
    const query = { branchId: authenticatedUser.branchId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (gradeId) {
      query.grade = gradeId;
    }

    const skip = (page - 1) * limit;

    const [classes, total] = await Promise.all([
      Class.find(query)
        .populate('grade', 'name gradeNumber')
        .populate('subjects', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Class.countDocuments(query),
    ]);

    // Get student counts for each class
    const classesWithCounts = await Promise.all(
      classes.map(async (classItem) => {
        const studentCount = await User.countDocuments({
          role: 'student',
          'studentProfile.classId': classItem._id,
          status: 'active',
        });
        return {
          ...classItem,
          studentCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        classes: classesWithCounts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST - Create new class (only for branch admin's branch)
async function createClass(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Ensure class is created for admin's branch only
    const classData = {
      ...body,
      branchId: authenticatedUser.branchId, // Force branch to admin's branch
      createdBy: authenticatedUser.userId,
    };

    const newClass = new Class(classData);
    await newClass.save();

    return NextResponse.json({
      success: true,
      data: newClass,
      message: 'Class created successfully',
    });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create class' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getClasses);
export const POST = withAuth(createClass);
