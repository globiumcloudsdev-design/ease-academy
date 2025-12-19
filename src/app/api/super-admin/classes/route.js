// ease-academy/src/app/api/super-admin/classes/route.js
import { NextResponse } from 'next/server';
import Class from '@/backend/models/Class';
import User from '@/backend/models/User';
import Subject from '@/backend/models/Subject';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Grade from '@/backend/models/Grade';
import connectDB from '@/lib/database';

// GET - List all classes
async function getClasses(request, authenticatedUser) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId') || '';
    const status = searchParams.get('status') || '';
    const academicYear = searchParams.get('academicYear') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 100;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }
    if (branchId) query.branchId = branchId;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    // Get total count
    const total = await Class.countDocuments(query);

    // Get classes with pagination
      const classes = await Class.find(query)
        .populate('branchId', 'name code city')
        .populate('grade', 'name gradeNumber')
        .populate('subjects', 'name code')
        .populate('sections.classTeacherId', 'name email')
        .sort({ grade: 1, name: 1 })
        .limit(limit)
        .skip((page - 1) * limit);

    // Get student count for each class
    const classesWithStats = await Promise.all(
      classes.map(async (classDoc) => {
        const studentCount = await User.countDocuments({
          role: 'student',
          'studentProfile.classId': classDoc._id,
          status: 'active',
        });

        return {
          ...classDoc.toObject(),
          studentCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: classesWithStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch classes', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new class
async function createClass(request, authenticatedUser, userDoc) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, code, grade, branchId, academicYear, sections, description, status } = body;

    // Validation
    if (!name || !code || !grade || !branchId || !academicYear) {
      return NextResponse.json(
        { success: false, message: 'Name, code, grade, branch, and academic year are required' },
        { status: 400 }
      );
    }

    // Check if class code already exists
    const existingClass = await Class.findOne({ code: code.toUpperCase() });
    if (existingClass) {
      return NextResponse.json(
        { success: false, message: 'Class with this code already exists' },
        { status: 400 }
      );
    }

    // Create class
    const classDoc = await Class.create({
      name,
      code: code.toUpperCase(),
      grade,
      branchId,
      academicYear,
      sections: sections || [{ name: 'A', capacity: 40 }],
      description,
      status: status || 'active',
      createdBy: userDoc._id,
    });

    const populatedClass = await Class.findById(classDoc._id)
      .populate('branchId', 'name code city')
      .populate('grade', 'name gradeNumber')
      .populate('sections.classTeacherId', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Class created successfully',
      data: populatedClass,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create class', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getClasses);
export const POST = withAuth(createClass);
