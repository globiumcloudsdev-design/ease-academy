import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Event from '@/backend/models/Event';
// Note: Using events as notifications for now. A dedicated Notification model can be created later.

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const child = await User.findById(childId).lean();
    if (!child) return NextResponse.json({ success: true, notifications: [] });

    // Return upcoming events as notifications
    const events = await Event.find({
      $or: [
        { branchId: child.branchId },
        { branchId: null },
      ],
      targetAudience: { $in: ['parents', 'all'] },
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    const notifications = events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      message: event.description,
      type: event.eventType,
      date: event.startDate,
      isRead: false,
    }));

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch notifications' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
