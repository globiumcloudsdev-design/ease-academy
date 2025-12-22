import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Attendance from '@/backend/models/Attendance';
import User from '@/backend/models/User';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import Branch from '@/backend/models/Branch';

// GET - Get single attendance record
async function getAttendanceRecord(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const attendance = await Attendance.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    })
      .populate('classId', 'name code')
      .populate('subjectId', 'name code')
      .populate('records.studentId', 'firstName lastName admissionNumber')
      .populate('markedBy', 'fullName email')
      .lean();

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { attendance },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// PUT - Update attendance
async function updateAttendance(request, authenticatedUser, userDoc, { params }) {
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

    const attendance = await Attendance.findOneAndUpdate(
      { _id: id, branchId: authenticatedUser.branchId },
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate('classId', 'name code')
      .populate('records.studentId', 'firstName lastName admissionNumber')
      .lean();

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance updated successfully',
      data: { attendance },
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update attendance' },
      { status: 500 }
    );
  }
}

// DELETE - Delete attendance
async function deleteAttendance(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const attendance = await Attendance.findOneAndDelete({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance deleted successfully',
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAttendanceRecord);
export const PUT = withAuth(updateAttendance);
export const DELETE = withAuth(deleteAttendance);
