import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Event from '@/backend/models/Event';
// Note: Using Event model for announcements. A dedicated Announcement model can be created later.

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const child = await User.findById(childId).lean();
    if (!child) return NextResponse.json({ success: true, announcements: [] });

    // Fetch recent events/announcements
    const announcements = await Event.find({
      $or: [
        { branchId: child.branchId },
        { branchId: null },
      ],
      isPublic: true,
      targetAudience: { $in: ['parents', 'all'] },
    })
      .populate('createdBy', 'fullName firstName lastName')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const announcementsData = announcements.map(ann => ({
      id: ann._id.toString(),
      title: ann.title,
      body: ann.description,
      type: ann.eventType,
      createdBy: ann.createdBy?.fullName || ann.createdBy?.firstName,
      createdAt: ann.createdAt,
      attachments: ann.attachments,
    }));

    return NextResponse.json({ success: true, announcements: announcementsData });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch announcements' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
