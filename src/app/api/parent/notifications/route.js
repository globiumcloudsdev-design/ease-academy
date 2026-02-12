import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Notification from '@/backend/models/Notification';
import Event from '@/backend/models/Event';

// GET: Fetch notifications
async function getNotifications(request, user) {
  try {
    await connectDB();
    const parentId = user.userId;

    const dbNotifications = await Notification.find({
      targetUser: parentId,
      $or: [
        { childId: { $exists: false } },
        { childId: null }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const events = await Event.find({
        targetAudience: { $in: ['parents', 'all'] },
        branchId: null,
        startDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) },
    })
      .sort({ startDate: 1 })
      .limit(5)
      .lean();

    const eventNotifications = events.map(event => ({
      _id: event._id.toString(),
      id: event._id.toString(),
      title: event.title,
      message: event.description,
      type: 'event',
      date: event.startDate,
      createdAt: event.createdAt,
      isRead: false,
      isEvent: true,
      sender: 'School Admin'
    }));

    const formattedNotifications = [
      ...dbNotifications.map(n => ({
        ...n,
        _id: n._id.toString(),
        id: n._id.toString(),
        date: n.createdAt,
        isEvent: false
      })),
      ...eventNotifications
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({ success: true, notifications: formattedNotifications });

  } catch (error) {
    console.error('Error fetching parent notifications:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH: Mark notifications as read
async function markAsRead(request, user) {
  try {
    await connectDB();
    const parentId = user.userId;
    const body = await request.json();
    const { notificationId, markAll } = body;

    let result;
    if (markAll) {
      result = await Notification.updateMany(
        { 
          targetUser: parentId, 
          $or: [{ childId: { $exists: false } }, { childId: null }],
          isRead: false 
        },
        { $set: { isRead: true } }
      );
    } else if (notificationId) {
      result = await Notification.updateOne(
        { _id: notificationId, targetUser: parentId },
        { $set: { isRead: true } }
      );
    } else {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { modifiedCount: result.modifiedCount }
    });

  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
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
