import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
import dbConnect from '@/lib/database';

// GET - List users with filters
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const role = searchParams.get('role');
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    const filter = {};

    // Filter by role (supports multiple roles separated by comma)
    if (role) {
      const roles = role.split(',');
      filter.role = { $in: roles };
    }

    // Filter by branch
    if (branchId) {
      filter.branchId = branchId;
    }

    // Filter by active status
    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('branchId', 'name code address')
        .select('-passwordHash -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch users',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// POST - Create new user
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();
    const body = await request.json();
    const { fullName, firstName, lastName, email, phone, password, role, branchId, permissions, isActive, dateOfBirth, gender, nationality, cnic, religion, bloodGroup, address } = body;

    console.log('Creating user with data:', { fullName, email, role, branchId, isActive , password});

    // Validation
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name, email, password, and role are required',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists',
        },
        { status: 400 }
      );
    }

    // Create user - password will be hashed by pre-save hook
    const computedFullName = fullName || `${firstName || ''} ${lastName || ''}`.trim();
    const user = await User.create({
      fullName: computedFullName,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email.toLowerCase(),
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || undefined,
      nationality: nationality || undefined,
      cnic: cnic || undefined,
      religion: religion || undefined,
      bloodGroup: bloodGroup || undefined,
      address: address || undefined,
      passwordHash: password, // Will be hashed by pre-save hook
      role,
      branchId: role === 'super_admin' ? null : branchId,
      permissions: permissions || [],
      isActive: isActive !== false,
      emailVerified: true, // Auto-verify for admin-created accounts
    });

    console.log('User created successfully:', user._id);

    // Fetch the created user with populated branch
    const createdUser = await User.findById(user._id)
      .populate('branchId', 'name code address')
      .select('-passwordHash -refreshToken');

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        data: { user: createdUser },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create user',
        error: error.message,
      },
      { status: 500 }
    );
  }
});
