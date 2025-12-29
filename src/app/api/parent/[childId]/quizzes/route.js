import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Exam from '@/backend/models/Exam';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const child = await User.findById(childId).lean();
    if (!child || !child.studentProfile?.classId) {
      return NextResponse.json({ success: true, quizzes: [] });
    }

    // Fetch quizzes/exams for child's class
    const quizzes = await Exam.find({
      classId: child.studentProfile.classId,
      examType: { $in: ['quiz', 'surprise', 'unit_test'] },
    })
      .populate('subjects.subjectId', 'name code')
      .sort({ 'subjects.date': -1 })
      .lean();

    const quizzesData = [];
    quizzes.forEach(quiz => {
      quiz.subjects.forEach(subject => {
        const studentResult = quiz.results?.find(r => r.studentId.toString() === childId);
        quizzesData.push({
          id: quiz._id.toString(),
          title: quiz.title,
          examType: quiz.examType,
          subject: {
            id: subject.subjectId?._id?.toString(),
            name: subject.subjectId?.name,
          },
          date: subject.date,
          startTime: subject.startTime,
          endTime: subject.endTime,
          duration: subject.duration,
          totalMarks: subject.totalMarks,
          passingMarks: subject.passingMarks,
          room: subject.room,
          status: quiz.status,
          result: studentResult ? {
            marksObtained: studentResult.marksObtained,
            grade: studentResult.grade,
            remarks: studentResult.remarks,
            isAbsent: studentResult.isAbsent,
          } : null,
        });
      });
    });

    return NextResponse.json({ success: true, quizzes: quizzesData });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch quizzes' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
