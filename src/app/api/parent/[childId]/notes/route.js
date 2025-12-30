import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
// Note: A Notes model doesn't exist yet. This returns assignments' attachments as notes for now.
import Assignment from '@/backend/models/Assignment';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const child = await User.findById(childId).lean();
    if (!child || !child.studentProfile?.classId) {
      return NextResponse.json({ success: true, notes: [] });
    }

    // For now, return assignment attachments as notes (filtered by class and section)
    const assignments = await Assignment.find({
      classId: child.studentProfile.classId,
      $or: [
        { sectionId: child.studentProfile.section },
        { sectionId: { $exists: false } },
        { sectionId: null },
        { sectionId: '' }
      ],
      attachments: { $exists: true, $ne: [] },
    })
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const notes = [];
    assignments.forEach(assignment => {
      assignment.attachments?.forEach(attachment => {
        notes.push({
          id: attachment._id?.toString() || Math.random().toString(),
          title: attachment.name || 'Untitled',
          subject: assignment.subjectId?.name,
          fileType: attachment.fileType,
          url: attachment.url,
          uploadedAt: assignment.createdAt,
        });
      });
    });

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch notes' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
