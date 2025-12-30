import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Assignment from '@/backend/models/Assignment';
import Submission from '@/backend/models/Submission';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    // Verify parent owns child
    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    // Get child's class
    const child = await User.findById(childId).lean();
    if (!child || !child.studentProfile?.classId) {
      return NextResponse.json({ success: true, assignments: [] });
    }

    // Fetch assignments for child's class and section
    const assignments = await Assignment.find({
      classId: child.studentProfile.classId,
      $or: [
        { sectionId: child.studentProfile.section },
        { sectionId: { $exists: false } },
        { sectionId: null },
        { sectionId: '' }
      ],
      status: { $in: ['published', 'active'] },
    })
      .populate('subjectId', 'name code')
      .populate('teacherId', 'fullName firstName lastName')
      .sort({ dueDate: 1 })
      .lean();

    // Get submissions for this student
    const submissions = await Submission.find({
      studentId: childId,
      assignmentId: { $in: assignments.map(a => a._id) },
    }).lean();

    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.assignmentId.toString()] = sub;
    });

    const assignmentsData = assignments.map(assignment => ({
      id: assignment._id.toString(),
      title: assignment.title,
      description: assignment.description,
      subject: {
        id: assignment.subjectId?._id?.toString(),
        name: assignment.subjectId?.name,
      },
      teacher: {
        id: assignment.teacherId?._id?.toString(),
        name: assignment.teacherId?.fullName || assignment.teacherId?.firstName,
      },
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      allowLateSubmission: assignment.allowLateSubmission,
      attachments: assignment.attachments,
      submission: submissionMap[assignment._id.toString()] ? {
        id: submissionMap[assignment._id.toString()]._id.toString(),
        submittedAt: submissionMap[assignment._id.toString()].submittedAt,
        status: submissionMap[assignment._id.toString()].status,
        marksObtained: submissionMap[assignment._id.toString()].marksObtained,
        feedback: submissionMap[assignment._id.toString()].feedback,
      } : null,
      status: submissionMap[assignment._id.toString()] ? 'submitted' : new Date(assignment.dueDate) < new Date() ? 'overdue' : 'pending',
    }));

    return NextResponse.json({ success: true, assignments: assignmentsData });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch assignments' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
