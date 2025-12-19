import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Syllabus from '@/backend/models/Syllabus';

// GET - Get single syllabus
async function getSyllabus(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    const syllabus = await Syllabus.findOne({
      _id: id,
      $or: [
        { branchId: authenticatedUser.branchId },
        { branchId: null }
      ]
    })
      .populate('subjectId', 'name code')
      .populate('classId', 'name code')
      .populate('gradeId', 'name gradeNumber')
      .populate('streamId', 'name code')
      .populate('preparedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .lean();

    if (!syllabus) {
      return NextResponse.json(
        { success: false, message: 'Syllabus not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: syllabus,
    });
  } catch (error) {
    console.error('Get syllabus error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch syllabus' },
      { status: 500 }
    );
  }
}

// PUT - Update syllabus
async function updateSyllabus(request, authenticatedUser, userDoc, { params }) {
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

    // Find syllabus and verify it belongs to admin's branch (can't update school-wide)
    const syllabus = await Syllabus.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!syllabus) {
      return NextResponse.json(
        { success: false, message: 'Syllabus not found or cannot be modified' },
        { status: 404 }
      );
    }

    // Prevent changing branchId
    delete updates.branchId;

    // Update syllabus
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        syllabus[key] = updates[key];
      }
    });

    syllabus.updatedBy = authenticatedUser.userId;
    await syllabus.save();

    return NextResponse.json({
      success: true,
      data: syllabus,
      message: 'Syllabus updated successfully',
    });
  } catch (error) {
    console.error('Update syllabus error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update syllabus' },
      { status: 500 }
    );
  }
}

// DELETE - Delete syllabus
async function deleteSyllabus(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find and delete syllabus (only from admin's branch)
    const syllabus = await Syllabus.findOneAndDelete({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!syllabus) {
      return NextResponse.json(
        { success: false, message: 'Syllabus not found or cannot be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Syllabus deleted successfully',
    });
  } catch (error) {
    console.error('Delete syllabus error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete syllabus' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSyllabus);
export const PUT = withAuth(updateSyllabus);
export const DELETE = withAuth(deleteSyllabus);
