import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Department from '@/backend/models/Department';

// GET - Get single department
async function getDepartment(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    const department = await Department.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    })
      .populate('headTeacherId', 'firstName lastName email')
      .populate('teachers', 'firstName lastName email')
      .populate('subjects', 'name code')
      .lean();

    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Get department error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

// PUT - Update department
async function updateDepartment(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;
    const updates = await request.json();

    // Find department and verify it belongs to admin's branch
    const department = await Department.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    // Prevent changing branchId
    delete updates.branchId;

    // Update department
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        department[key] = updates[key];
      }
    });

    department.updatedBy = authenticatedUser.userId;
    await department.save();

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Department updated successfully',
    });
  } catch (error) {
    console.error('Update department error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update department' },
      { status: 500 }
    );
  }
}

// DELETE - Delete department
async function deleteDepartment(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find and delete department (only from admin's branch)
    const department = await Department.findOneAndDelete({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete department' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDepartment);
export const PUT = withAuth(updateDepartment);
export const DELETE = withAuth(deleteDepartment);
