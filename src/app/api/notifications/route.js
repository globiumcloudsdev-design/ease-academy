import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Notification from '@/backend/models/Notification';
import Event from '@/backend/models/Event';

// GET: Fetch notifications for the current user
async function getNotifications(request, user) {
  try {
    await connectDB();
    const userId = user.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    // 1. Fetch DB notifications
    const dbNotifications = await Notification.find({ targetUser: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUnread = await Notification.countDocuments({ 
      targetUser: userId, 
      isRead: false 
    });

    // 2. Fetch Events (Broadcasts) if it's the first page
    // Teachers/Staff/Admins see events for their branch + global events
    let eventNotifications = [];
    if (page === 1) {
      const branchId = user.branchId;
      
      let audienceFilter = ['all'];
      if (user.role === 'teacher') audienceFilter.push('teachers');
      if (user.role === 'staff') audienceFilter.push('staff');
      if (user.role === 'parent') audienceFilter.push('parents');
      if (user.role === 'student') audienceFilter.push('students');

      const events = await Event.find({
        $or: [
          { branchId: branchId },
          { branchId: null },
        ],
        targetAudience: { $in: audienceFilter },
        startDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) },
      })
      .sort({ startDate: 1 })
      .limit(5)
      .lean();

      eventNotifications = events.map(event => ({
        _id: event._id.toString(),
        id: event._id.toString(),
        title: event.title,
        message: event.description,
        type: 'event',
        date: event.startDate,
        createdAt: event.createdAt,
        isRead: false, // Events don't have per-user read state usually, or handled differently
        isEvent: true,
        data: event
      }));
    }

    // Merge and sort
    const merged = [
      ...dbNotifications.map(n => ({ ...n, id: n._id.toString(), date: n.createdAt, isEvent: false })),
      ...eventNotifications
    ].sort((a, b) => new Date(b.date) - new Date(a.date));


    return NextResponse.json({
      success: true,
      data: {
        notifications: merged,
        unreadCount: totalUnread
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH: Mark notifications as read
async function markAsRead(request, user) {
  try {
    await connectDB();
    const userId = user.userId;
    const body = await request.json();
    const { notificationId, markAll } = body;

    let result;

    if (markAll) {
      // Mark all unread notifications for this user as read
      result = await Notification.updateMany(
        { targetUser: userId, isRead: false },
        { $set: { isRead: true } }
      );
    } else if (notificationId) {
      // Mark specific notification
      result = await Notification.updateOne(
        { _id: notificationId, targetUser: userId },
        { $set: { isRead: true } }
      );
    } else {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

const handler = withAuth(async (req, user) => {
  if (req.method === 'GET') {
    return getNotifications(req, user);
  } else if (req.method === 'PATCH') {
    return markAsRead(req, user);
  } else {
    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }
});

export const GET = handler;
export const PATCH = handler;
