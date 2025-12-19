import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Department from '@/backend/models/Department';

// GET - Get all departments for branch admin's branch
async function getDepartments(request, authenticatedUser, userDoc) {
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

    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      Department.find(query)
        .populate('headTeacherId', 'firstName lastName email')
        .populate('teachers', 'firstName lastName email')
        .populate('subjects', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Department.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        departments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get departments error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST - Create new department (only for branch admin's branch)
async function createDepartment(request, authenticatedUser, userDoc) {
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

    // Ensure department is created for admin's branch only
    const departmentData = {
      ...body,
      branchId: authenticatedUser.branchId, // Force branch to admin's branch
      createdBy: authenticatedUser.userId,
    };

    const department = new Department(departmentData);
    await department.save();

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Department created successfully',
    });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create department' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDepartments);
export const POST = withAuth(createDepartment);
