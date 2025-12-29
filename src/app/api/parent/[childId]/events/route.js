import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Event from '@/backend/models/Event';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const child = await User.findById(childId).lean();
    if (!child) return NextResponse.json({ success: true, events: [] });

    // Fetch events for child's branch and global events
    const events = await Event.find({
      $or: [
        { branchId: child.branchId },
        { branchId: null }, // Global events
      ],
      targetAudience: { $in: ['parents', 'all'] },
      status: { $in: ['scheduled', 'ongoing'] },
      startDate: { $gte: new Date(Date.now() - 86400000 * 30) }, // Last 30 days and future
    })
      .populate('createdBy', 'fullName firstName lastName')
      .sort({ startDate: 1 })
      .lean();

    const eventsData = events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      targetAudience: event.targetAudience,
      status: event.status,
      color: event.color,
      attachments: event.attachments,
      organizer: event.createdBy?.fullName || event.createdBy?.firstName,
    }));

    return NextResponse.json({ success: true, events: eventsData });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch events' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
