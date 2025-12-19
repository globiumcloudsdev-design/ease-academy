import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
import dbConnect from '@/lib/database';

/**
 * GET - List all staff members
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
    const role = searchParams.get('role'); // staff role (not user role)
    const shift = searchParams.get('shift');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    
    // Build query
    const query = { role: 'staff' };
    
    if (branchId) query.branchId = branchId;
    if (departmentId) query['staffProfile.departmentId'] = departmentId;
    if (role) query['staffProfile.role'] = role;
    if (shift) query['staffProfile.shift'] = shift;
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
        { 'staffProfile.employeeId': { $regex: search, $options: 'i' } },
      ];
    }
    
    // Execute query
    const [staff, total] = await Promise.all([
      User.find(query)
        .populate('branchId', 'name code city')
        .populate('staffProfile.departmentId', 'name code')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: staff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch staff', error: error.message },
      { status: 500 }
    );
  }
});

/**
 * POST - Create new staff member
 */
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();

    const body = await request.json();

    // Validation
    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.dateOfBirth || !body.gender) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    if (!body.branchId || !body.staffProfile?.role) {
      return NextResponse.json(
        { success: false, message: 'Branch and Role are required for staff' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await User.findOne({
      $or: [
        { email: body.email.toLowerCase() },
        ...(body.cnic ? [{ cnic: body.cnic }] : []),
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

    // Create staff member
    const defaultPassword = body.password || 'Staff@123';
    
    const staffMember = new User({
      role: 'staff',
      ...body,
      passwordHash: defaultPassword,
      emailVerified: true,
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });

    await staffMember.save();

    // Populate
    await staffMember.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'staffProfile.departmentId', select: 'name code' },
      { path: 'createdBy', select: 'fullName email' },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Staff member created successfully',
        data: staffMember,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create staff member', error: error.message },
      { status: 500 }
    );
  }
});
