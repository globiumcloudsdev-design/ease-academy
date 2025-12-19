import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Department from '@/backend/models/Department';
import { withAuth } from '@/backend/middleware/auth';

// GET - Get single department
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const id = request.url.split('/').pop();
    
    const department = await Department.findById(id)
      .populate('branchId', 'name code city address')
      .populate('headTeacherId', 'firstName lastName employeeId email phone')
      .populate('teachers', 'firstName lastName employeeId email designation')
      .populate('subjects', 'name code grade')
      .lean();

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message: 'Department not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch department',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// PUT - Update department
export const PUT = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const id = request.url.split('/').pop();
    const body = await request.json();
    
    const department = await Department.findById(id);
    
    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message: 'Department not found',
        },
        { status: 404 }
      );
    }
    
    // If code is being changed, check uniqueness
    if (body.code && body.code !== department.code) {
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
    }
    
    // Update department
    Object.assign(department, body);
    department.updatedBy = userDoc._id;
    
    await department.save();
    
    // Populate and return
    await department.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'headTeacherId', select: 'firstName lastName employeeId' },
      { path: 'teachers', select: 'firstName lastName employeeId' },
      { path: 'subjects', select: 'name code grade' },
      { path: 'updatedBy', select: 'fullName email' },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update department',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// DELETE - Archive department
export const DELETE = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const id = request.url.split('/').pop();
    
    const department = await Department.findById(id);
    
    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message: 'Department not found',
        },
        { status: 404 }
      );
    }
    
    // Check if department has active teachers
    if (department.teachers && department.teachers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete department. It has ${department.teachers.length} teachers assigned.`,
        },
        { status: 400 }
      );
    }
    
    // Soft delete
    department.status = 'archived';
    department.updatedBy = userDoc._id;
    await department.save();

    return NextResponse.json({
      success: true,
      message: 'Department archived successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete department',
        error: error.message,
      },
      { status: 500 }
    );
  }
});
