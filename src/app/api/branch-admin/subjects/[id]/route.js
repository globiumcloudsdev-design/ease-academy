import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Subject from '@/backend/models/Subject';
import Grade from '@/backend/models/Grade';
import Class from '@/backend/models/Class';
import Department from '@/backend/models/Department';
import User from '@/backend/models/User';

// GET - Get single subject
async function getSubject(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    const subject = await Subject.findById(id)
      .populate('classId', 'name code branchId')
      .populate('gradeId', 'name gradeNumber')
      .populate('departmentId', 'name code')
      .populate('headTeacherId', 'firstName lastName email')
      .populate('teachers', 'firstName lastName email')
      .lean();

    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    // Verify subject belongs to admin's branch (through class)
    if (subject.classId && subject.classId.branchId.toString() !== authenticatedUser.branchId.toString()) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error('Get subject error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch subject' },
      { status: 500 }
    );
  }
}

// PUT - Update subject
async function updateSubject(request, authenticatedUser, userDoc, { params }) {
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

    // Find subject and verify it belongs to admin's branch
    const subject = await Subject.findById(id).populate('classId', 'branchId');

    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    // Verify through class
    if (subject.classId && subject.classId.branchId.toString() !== authenticatedUser.branchId.toString()) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    // If updating classId, verify new class belongs to branch
    if (updates.classId && updates.classId !== subject.classId.toString()) {
      const newClass = await Class.findById(updates.classId);
      if (!newClass || newClass.branchId.toString() !== authenticatedUser.branchId.toString()) {
        return NextResponse.json(
          { success: false, message: 'Invalid class for this branch' },
          { status: 400 }
        );
      }
    }

    // Update subject
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        subject[key] = updates[key];
      }
    });

    subject.updatedBy = authenticatedUser.userId;
    await subject.save();

    return NextResponse.json({
      success: true,
      data: subject,
      message: 'Subject updated successfully',
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update subject' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subject
async function deleteSubject(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find subject and verify through class
    const subject = await Subject.findById(id).populate('classId', 'branchId');

    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    if (subject.classId && subject.classId.branchId.toString() !== authenticatedUser.branchId.toString()) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    await subject.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete subject' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSubject);
export const PUT = withAuth(updateSubject);
export const DELETE = withAuth(deleteSubject);
