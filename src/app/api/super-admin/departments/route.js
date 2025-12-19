import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Department from '@/backend/models/Department';
import User from '@/backend/models/User';
import Subject from '@/backend/models/Subject';
import { withAuth } from '@/backend/middleware/auth';

// GET - List all departments with filters
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;
    
    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (branchId) query.branchId = branchId;
    if (status) query.status = status;
    
    const [departments, total] = await Promise.all([
      Department.find(query)
        .populate('branchId', 'name code city')
        .populate('headTeacherId', 'firstName lastName employeeId email')
        .populate('teachers', 'firstName lastName employeeId')
        .populate('subjects', 'name code grade')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Department.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: departments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch departments',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// POST - Create new department
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'code', 'branchId'];
    
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }
    
    // Check if code already exists
    const existingDept = await Department.findOne({ code: body.code });
    if (existingDept) {
      return NextResponse.json(
        {
          success: false,
          message: 'Department code already exists',
        },
        { status: 400 }
      );
    }
    
    // Verify branch exists
    const Branch = (await import('@/backend/models/Branch')).default;
    const branchExists = await Branch.findById(body.branchId);
    
    if (!branchExists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Branch not found',
        },
        { status: 404 }
      );
    }
    
    // Create department
    const department = new Department({
      ...body,
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });
    
    await department.save();
    
    // Populate and return
    await department.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'headTeacherId', select: 'firstName lastName employeeId' },
      { path: 'createdBy', select: 'fullName email' },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Department created successfully',
        data: department,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create department',
        error: error.message,
      },
      { status: 500 }
    );
  }
});
