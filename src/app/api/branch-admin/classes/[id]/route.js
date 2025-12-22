import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Class from '@/backend/models/Class';
import Grade from '@/backend/models/Grade';
import Subject from '@/backend/models/Subject';
import User from '@/backend/models/User';

// GET - Get single class
async function getClass(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const classItem = await Class.findOne({
      _id: id,
      branchId: authenticatedUser.branchId, // Only get class from admin's branch
    })
      .populate('grade', 'name gradeNumber')
      .populate('subjects', 'name code')
      .lean();

    if (!classItem) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: classItem,
    });
  } catch (error) {
    console.error('Get class error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

// PUT - Update class
async function updateClass(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const updates = await request.json();

    // Find class and verify it belongs to admin's branch
    const classItem = await Class.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!classItem) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    // Prevent changing branchId
    delete updates.branchId;

    // Update class
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        classItem[key] = updates[key];
      }
    });

    classItem.updatedBy = authenticatedUser.userId;
    await classItem.save();

    return NextResponse.json({
      success: true,
      data: classItem,
      message: 'Class updated successfully',
    });
  } catch (error) {
    console.error('Update class error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE - Delete class
async function deleteClass(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Find and delete class (only from admin's branch)
    const classItem = await Class.findOneAndDelete({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!classItem) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete class' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getClass);
export const PUT = withAuth(updateClass);
export const DELETE = withAuth(deleteClass);
