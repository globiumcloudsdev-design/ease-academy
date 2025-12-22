import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Branch from '@/backend/models/Branch';
import Exam from '@/backend/models/Exam';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';


// GET - Get single exam
async function getExam(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const exam = await Exam.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    })
      .populate('classId', 'name code')
      .populate('subjects.subjectId', 'name code')
      .populate('results.studentId', 'firstName lastName admissionNumber')
      .populate('createdBy', 'fullName email')
      .lean();

    if (!exam) {
      return NextResponse.json(
        { success: false, message: 'Exam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { exam },
    });
  } catch (error) {
    console.error('Get exam error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

// PUT - Update exam
async function updateExam(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const body = await request.json();

    const exam = await Exam.findOneAndUpdate(
      { _id: id, branchId: authenticatedUser.branchId },
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate('classId', 'name code')
      .populate('subjects.subjectId', 'name code')
      .lean();

    if (!exam) {
      return NextResponse.json(
        { success: false, message: 'Exam not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exam updated successfully',
      data: { exam },
    });
  } catch (error) {
    console.error('Update exam error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update exam' },
      { status: 500 }
    );
  }
}

// DELETE - Delete exam
async function deleteExam(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const exam = await Exam.findOneAndDelete({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, message: 'Exam not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete exam' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getExam);
export const PUT = withAuth(updateExam);
export const DELETE = withAuth(deleteExam);
