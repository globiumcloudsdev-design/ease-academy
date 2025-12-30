import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Exam from '@/backend/models/Exam';
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
    if (!ownsChild) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Get child's class
    const child = await User.findById(childId).lean();
    if (!child || !child.studentProfile?.classId) {
      return NextResponse.json({ success: true, exams: [] });
    }

    // Fetch exams for child's class
    const exams = await Exam.find({
      classId: child.studentProfile.classId,
      status: { $ne: 'cancelled' }
    })
      .populate('subjects.subjectId', 'name code')
      .sort({ 'subjects.date': -1 })
      .lean();

    // Filter results to only include this child's result
    const examsData = exams.map(exam => {
      const studentResult = exam.results?.find(r => r.studentId.toString() === childId);
      
      // Remove full results array for privacy/security
      const { results, ...examInfo } = exam;
      
      return {
        ...examInfo,
        id: exam._id.toString(),
        result: studentResult ? {
          marksObtained: studentResult.marksObtained,
          grade: studentResult.grade,
          remarks: studentResult.remarks,
          isAbsent: studentResult.isAbsent,
          attachments: studentResult.attachments || []
        } : null
      };
    });

    return NextResponse.json({ success: true, exams: examsData });
  } catch (error) {
    console.error('Error fetching child exams:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch exams' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
