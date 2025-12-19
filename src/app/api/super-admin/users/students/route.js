import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
import connectDB from '@/lib/database';
import Branch from '@/backend/models/Branch';
import Department from '@/backend/models/Department';
import Class from '@/backend/models/Class';

/**
 * GET - List all students
 * This is a shortcut endpoint that filters users by role='student'
 */
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;
    
    // Filters
    const branchId = searchParams.get('branchId');
    const departmentId = searchParams.get('departmentId');
    const classId = searchParams.get('classId');
    const section = searchParams.get('section');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    
    // Build query
    const query = { role: 'student' };
    
    if (branchId) query.branchId = branchId;
    if (departmentId) query['studentProfile.departmentId'] = departmentId;
    if (classId) query['studentProfile.classId'] = classId;
    if (section) query['studentProfile.section'] = section;
    if (status) query.status = status;
    
    // Search
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'studentProfile.registrationNumber': { $regex: search, $options: 'i' } },
        { 'studentProfile.father.name': { $regex: search, $options: 'i' } },
        { 'studentProfile.father.phone': { $regex: search, $options: 'i' } },
      ];
    }
    
    // Execute query
    const [students, total] = await Promise.all([
      User.find(query)
        .populate('branchId', 'name code city')
        .populate('studentProfile.classId', 'name grade sections')
        .populate('studentProfile.departmentId', 'name code')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch students', error: error.message },
      { status: 500 }
    );
  }
});

/**
 * POST - Create new student
 * This is a shortcut endpoint that creates a user with role='student'
 */
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validation
    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.dateOfBirth || !body.gender) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    if (!body.branchId || !body.studentProfile?.classId) {
      return NextResponse.json(
        { success: false, message: 'Branch and Class are required for students' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: body.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 400 }
      );
    }

    // Check if registration number exists (if provided)
    if (body.studentProfile?.registrationNumber) {
      const existingReg = await User.findOne({
        'studentProfile.registrationNumber': body.studentProfile.registrationNumber.toUpperCase(),
      });
      if (existingReg) {
        return NextResponse.json(
          { success: false, message: 'Registration number already exists' },
          { status: 400 }
        );
      }
    }

    // Verify branch and class
    const Branch = (await import('@/backend/models/Branch')).default;
    const Class = (await import('@/backend/models/Class')).default;
    
    const [branch, classDoc] = await Promise.all([
      Branch.findById(body.branchId),
      Class.findById(body.studentProfile.classId),
    ]);

    if (!branch) {
      return NextResponse.json(
        { success: false, message: 'Branch not found' },
        { status: 404 }
      );
    }

    if (!classDoc) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    // Create student
    const defaultPassword = body.password || 'Student@123';
    
    const student = new User({
      role: 'student',
      ...body,
      passwordHash: defaultPassword,
      emailVerified: true,
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });

    await student.save();

    // Populate
    await student.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'studentProfile.classId', select: 'name grade sections' },
      { path: 'studentProfile.departmentId', select: 'name code' },
      { path: 'createdBy', select: 'fullName email' },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Student created successfully',
        data: student,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create student', error: error.message },
      { status: 500 }
    );
  }
});
