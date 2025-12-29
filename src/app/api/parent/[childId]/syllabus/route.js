import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Syllabus from '@/backend/models/Syllabus';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const child = await User.findById(childId).lean();
    if (!child || !child.studentProfile?.classId) {
      return NextResponse.json({ success: true, syllabus: [] });
    }

    // Fetch syllabus for child's class
    const syllabusList = await Syllabus.find({
      classId: child.studentProfile.classId,
      status: { $in: ['published', 'approved'] },
    })
      .populate('subjectId', 'name code')
      .populate('preparedBy', 'fullName firstName lastName')
      .lean();

    const syllabusData = syllabusList.map(syl => ({
      id: syl._id.toString(),
      title: syl.title,
      subject: {
        id: syl.subjectId?._id?.toString(),
        name: syl.subjectId?.name,
        code: syl.subjectId?.code,
      },
      academicYear: syl.academicYear,
      overview: syl.overview,
      courseObjectives: syl.courseObjectives,
      learningOutcomes: syl.learningOutcomes,
      chapters: syl.chapters,
      teachingMethods: syl.teachingMethods,
      assessmentPlan: syl.assessmentPlan,
      textbooks: syl.textbooks,
      referenceBooks: syl.referenceBooks,
      onlineResources: syl.onlineResources,
      preparedBy: syl.preparedBy?.fullName || syl.preparedBy?.firstName,
      attachments: syl.attachments,
    }));

    return NextResponse.json({ success: true, syllabus: syllabusData });
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch syllabus' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
