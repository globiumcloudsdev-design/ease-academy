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
      .populate('results.studentId', 'fullName firstName lastName studentProfile profilePhoto')
      .lean();

    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    // Verify access and filter results for teachers
    if (userDoc.role === 'teacher') {
      const teacherId = userDoc._id;
      const timetables = await Timetable.find({
        'periods.teacherId': teacherId,
        classId: exam.classId._id,
        status: 'active'
      });

      const teacherSubjects = new Set();
      const teacherSections = new Set();
      timetables.forEach(tt => {
        // If exam is for a specific section, teacher must teach in that section
        if (exam.section && tt.section && tt.section !== exam.section) return;
        
        if (tt.section) teacherSections.add(tt.section);

        tt.periods.forEach(p => {
          if (p.teacherId?.toString() === teacherId.toString() && p.subjectId) {
            teacherSubjects.add(p.subjectId.toString());
          }
        });
      });

      const examSubjectIds = exam.subjects.map(s => s.subjectId._id.toString());
      const hasAccess = examSubjectIds.some(id => teacherSubjects.has(id));

      if (!hasAccess) {
        return NextResponse.json({ success: false, message: 'Access denied to this exam' }, { status: 403 });
      }

      // Filter subjects: Only show subjects the teacher teaches
      exam.subjects = exam.subjects.filter(s => teacherSubjects.has(s.subjectId._id.toString()));

      // Filter results:
      // 1. Only show results for subjects the teacher teaches
      // 2. If exam is for all sections, only show results for students in teacher's sections
      exam.results = exam.results.filter(r => {
        const isTeacherSubject = teacherSubjects.has(r.subjectId.toString());
        if (!isTeacherSubject) return false;

        if (!exam.section && teacherSections.size > 0) {
          const studentSection = r.studentId?.studentProfile?.section;
          return teacherSections.has(studentSection);
        }
        return true;
      });
    }

    return NextResponse.json({ success: true, exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch exam' }, { status: 500 });
  }
});

// PUT - Update exam (Restricted to Admins)
export const PUT = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params || {};
    await connectDB();
    const body = await request.json();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
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
}, [requireRole(['super_admin', 'branch_admin'])]);

// PATCH - Update status (Restricted to Admins)
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

    exam.status = status;
    await exam.save();

    return NextResponse.json({ success: true, message: `Exam status updated to ${status}`, exam });
  } catch (error) {
    console.error('Error updating exam status:', error);
    return NextResponse.json({ success: false, message: 'Failed to update exam status' }, { status: 500 });
  }
}, [requireRole(['super_admin', 'branch_admin'])]);

// DELETE - Delete exam (Restricted to Admins)
export const DELETE = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params || {};
    await connectDB();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    await Exam.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete exam' }, { status: 500 });
  }
}, [requireRole(['super_admin', 'branch_admin'])]);

