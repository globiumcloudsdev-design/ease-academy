import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Exam from '@/backend/models/Exam';
import Timetable from '@/backend/models/Timetable';
import User from '@/backend/models/User';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import { uploadToCloudinary } from '@/lib/cloudinary';

// GET - Get single exam details
export const GET = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params || {};
    await connectDB();

    const exam = await Exam.findById(id)
      .populate('classId', 'name grade section')
      .populate('subjects.subjectId', 'name code')
      .populate('results.studentId', 'fullName firstName lastName rollNumber profilePhoto')
      .lean();

    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    // Verify access
    if (userDoc.role === 'teacher') {
      const teacherClasses = userDoc.teacherProfile?.classes?.map(c => c.classId.toString()) || [];
      if (!teacherClasses.includes(exam.classId._id.toString())) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch exam' }, { status: 500 });
  }
});

// PUT - Update exam
export const PUT = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params || {};
    await connectDB();
    const body = await request.json();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    // Verify access
    if (userDoc.role === 'teacher') {
      const teacherClasses = userDoc.teacherProfile?.classes?.map(c => c.classId.toString()) || [];
      if (!teacherClasses.includes(exam.classId.toString())) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }
    }

    // Update fields
    const allowedUpdates = ['title', 'examType', 'section', 'subjects', 'status'];
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        exam[field] = body[field];
      }
    });

    await exam.save();

    return NextResponse.json({ success: true, message: 'Exam updated successfully', exam });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json({ success: false, message: 'Failed to update exam' }, { status: 500 });
  }
});

// PATCH - Update status (Active/Deactive/etc)
export const PATCH = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params || {};
    await connectDB();
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ success: false, message: 'Status is required' }, { status: 400 });
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    // Verify access
    if (userDoc.role === 'teacher') {
      const teacherClasses = userDoc.teacherProfile?.classes?.map(c => c.classId.toString()) || [];
      if (!teacherClasses.includes(exam.classId.toString())) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }
    }

    exam.status = status;
    await exam.save();

    return NextResponse.json({ success: true, message: `Exam status updated to ${status}`, exam });
  } catch (error) {
    console.error('Error updating exam status:', error);
    return NextResponse.json({ success: false, message: 'Failed to update exam status' }, { status: 500 });
  }
});

// DELETE - Delete exam
export const DELETE = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params || {};
    await connectDB();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    // Verify access
    if (userDoc.role === 'teacher') {
      const teacherClasses = userDoc.teacherProfile?.classes?.map(c => c.classId.toString()) || [];
      if (!teacherClasses.includes(exam.classId.toString())) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }
    }

    await Exam.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete exam' }, { status: 500 });
  }
});
