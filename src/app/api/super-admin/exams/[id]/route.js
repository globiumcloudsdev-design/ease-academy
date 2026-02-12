import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import Exam from '@/backend/models/Exam';

// GET - Get single exam details
export const GET = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params;

    const exam = await Exam.findById(id)
      .populate('branchId', 'name code')
      .populate('classId', 'name grade section')
      .populate('createdBy', 'name email')
      .populate('subjects.subjectId', 'name code');

    if (!exam) {
      return NextResponse.json(
        { success: false, message: 'Exam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}, [requireRole(ROLES.SUPER_ADMIN)]);

// PUT - Update exam
export const PUT = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json(
        { success: false, message: 'Exam not found' },
        { status: 404 }
      );
    }

    const allowedUpdates = ['title', 'examType', 'branchId', 'classId', 'section', 'subjects', 'status'];
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        exam[field] = body[field];
      }
    });

    await exam.save();
    await exam.populate(['branchId', 'classId', 'createdBy', 'subjects.subjectId']);

    return NextResponse.json({
      success: true,
      message: 'Exam updated successfully',
      exam
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update exam' },
      { status: 500 }
    );
  }
}, [requireRole(ROLES.SUPER_ADMIN)]);

// DELETE - Delete exam
export const DELETE = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params;

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json(
        { success: false, message: 'Exam not found' },
        { status: 404 }
      );
    }

    await Exam.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}, [requireRole(ROLES.SUPER_ADMIN)]);
