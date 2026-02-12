import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/backend/utils/emailService';
import { getAdminEmailTemplate } from '@/backend/templates/adminEmail';
import Branch from '@/backend/models/Branch';
import Department from '@/backend/models/Department';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import connectDB from '@/lib/database';
/**
 * GET - List all users with role-based filtering
 * Query params: role, branchId, departmentId, classId, status, search, page, limit
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
    const role = searchParams.get('role');
    const branchId = searchParams.get('branchId');
    const departmentId = searchParams.get('departmentId');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    
    // Build query
    const query = {};
    
    if (role) {
      if (role.includes(',')) {
        query.role = { $in: role.split(',') };
      } else {
        query.role = role;
      }
    }
    if (branchId) query.branchId = branchId;
    if (status) query.status = status;
    
    // Role-specific filters
    if (role === 'student') {
      if (departmentId) query['studentProfile.departmentId'] = departmentId;
      if (classId) query['studentProfile.classId'] = classId;
    } else if (role === 'teacher') {
      if (departmentId) query['teacherProfile.departmentId'] = departmentId;
    } else if (role === 'staff') {
      if (departmentId) query['staffProfile.departmentId'] = departmentId;
    }
    
    // Search across multiple fields
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'studentProfile.registrationNumber': { $regex: search, $options: 'i' } },
        { 'teacherProfile.employeeId': { $regex: search, $options: 'i' } },
        { 'staffProfile.employeeId': { $regex: search, $options: 'i' } },
      ];
    }
    
    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .populate('branchId', 'name code city')
        .populate('studentProfile.classId', 'name grade sections')
        .populate('studentProfile.departmentId', 'name code')
        .populate('teacherProfile.departmentId', 'name code')
        .populate('teacherProfile.subjects', 'name code')
        .populate('teacherProfile.classes.classId', 'name grade')
        .populate('teacherProfile.classes.subjectId', 'name code')
        .populate('staffProfile.departmentId', 'name code')
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users', error: error.message },
      { status: 500 }
    );
  }
});

/**
 * POST - Create new user (Student, Teacher, Staff, Admin, Parent)
 */
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const body = await request.json();
    const { role, password, ...userData } = body;


    // Validation
    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role is required' },
        { status: 400 }
      );
    }

    if (!userData.firstName || !userData.lastName || !userData.email || !userData.phone || !userData.dateOfBirth || !userData.gender) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing (firstName, lastName, email, phone, dateOfBirth, gender)' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 400 }
      );
    }

    // Verify branch exists (except for super_admin)
    if (role !== 'super_admin') {
      if (!userData.branchId) {
        return NextResponse.json(
          { success: false, message: 'Branch is required for this role' },
          { status: 400 }
        );
      }

      const Branch = (await import('@/backend/models/Branch')).default;
      const branch = await Branch.findById(userData.branchId);
      if (!branch) {
        return NextResponse.json(
          { success: false, message: 'Branch not found' },
          { status: 404 }
        );
      }
    }

    // Role-specific validation
    if (role === 'student') {
      if (!userData.studentProfile?.classId) {
        return NextResponse.json(
          { success: false, message: 'Class is required for students' },
          { status: 400 }
        );
      }
    }

    // Create user with hashed password
    const defaultPassword = password;
    
    const newUser = new User({
      role,
      ...userData,
      passwordHash: defaultPassword, // Will be hashed by pre-save middleware
      emailVerified: true, // Auto-verify for admin-created accounts
      status: role === 'parent' ? 'pending' : 'active', // Parents start as pending
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });

    console.log('New User', newUser);
    
    await newUser.save();

    // Populate fields before returning
    await newUser.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'studentProfile.classId', select: 'name grade' },
      { path: 'studentProfile.departmentId', select: 'name code' },
      { path: 'teacherProfile.departmentId', select: 'name code' },
      { path: 'teacherProfile.subjects', select: 'name code' },
      { path: 'staffProfile.departmentId', select: 'name code' },
      { path: 'createdBy', select: 'fullName email' },
    ]);

    console.log('Created User', newUser);
    

    // Send welcome email for admin roles (non-blocking for the API response)
    try {
      const schoolName = process.env.SCHOOL_NAME || 'Ease Academy';
      const adminRoles = ['branch_admin', 'super_admin', 'admin'];
      if (adminRoles.includes(role)) {
        const adminForEmail = newUser.toObject ? newUser.toObject() : newUser;
        adminForEmail.tempPassword = defaultPassword;
        const html = getAdminEmailTemplate('ADMIN_CREATED', adminForEmail, schoolName);
        await sendEmail(newUser.email, `${schoolName} - Administrator Account Created`, html);
      }
    } catch (emailErr) {
      console.error('Failed to send admin welcome email:', emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create user', error: error.message },
      { status: 500 }
    );
  }
});
