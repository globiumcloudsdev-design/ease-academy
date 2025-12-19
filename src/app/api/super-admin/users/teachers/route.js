import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
import dbConnect from '@/lib/database';

/**
 * GET - List all teachers
 */
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;
    
    // Filters
    const branchId = searchParams.get('branchId');
    const departmentId = searchParams.get('departmentId');
    const designation = searchParams.get('designation');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    
    // Build query
    const query = { role: 'teacher' };
    
    if (branchId) query.branchId = branchId;
    if (departmentId) query['teacherProfile.departmentId'] = departmentId;
    if (designation) query['teacherProfile.designation'] = designation;
    if (status) query.status = status;
    
    // Search
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { 'teacherProfile.employeeId': { $regex: search, $options: 'i' } },
      ];
    }
    
    // Execute query
    const [teachers, total] = await Promise.all([
      User.find(query)
        .populate('branchId', 'name code city')
        .populate('teacherProfile.departmentId', 'name code')
        .populate('teacherProfile.subjects', 'name code')
        .populate('teacherProfile.classes.classId', 'name grade')
        .populate('teacherProfile.classes.subjectId', 'name code')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch teachers', error: error.message },
      { status: 500 }
    );
  }
});

/**
 * POST - Create new teacher
 */
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();

    const body = await request.json();

    // Validation
    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.dateOfBirth || !body.gender || !body.cnic) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    if (!body.branchId || !body.teacherProfile?.designation) {
      return NextResponse.json(
        { success: false, message: 'Branch and Designation are required for teachers' },
        { status: 400 }
      );
    }

    // Check if email or CNIC already exists
    const existing = await User.findOne({
      $or: [
        { email: body.email.toLowerCase() },
        { cnic: body.cnic },
      ],
    });

    if (existing) {
      const field = existing.email === body.email.toLowerCase() ? 'Email' : 'CNIC';
      return NextResponse.json(
        { success: false, message: `${field} already exists` },
        { status: 400 }
      );
    }

    // Verify branch
    const Branch = (await import('@/backend/models/Branch')).default;
    const branch = await Branch.findById(body.branchId);

    if (!branch) {
      return NextResponse.json(
        { success: false, message: 'Branch not found' },
        { status: 404 }
      );
    }

    // Create teacher
    const defaultPassword = body.password || 'Teacher@123';
    
    const teacher = new User({
      role: 'teacher',
      ...body,
      passwordHash: defaultPassword,
      emailVerified: true,
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });

    await teacher.save();

    // Populate
    await teacher.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'teacherProfile.departmentId', select: 'name code' },
      { path: 'teacherProfile.subjects', select: 'name code' },
      { path: 'createdBy', select: 'fullName email' },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Teacher created successfully',
        data: teacher,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create teacher', error: error.message },
      { status: 500 }
    );
  }
});
