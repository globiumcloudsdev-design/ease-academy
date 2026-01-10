import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Notification from '@/backend/models/Notification';
import Event from '@/backend/models/Event';

// Helper to check ownership
const checkOwnership = async (user, childId) => {
  const parent = await User.findById(user.userId).lean();
  const ownsChild = parent?.parentProfile?.children?.some(c => {
    const storedId = c.id?._id || c.id;
    return storedId?.toString() === childId;
  });
  return { parent, ownsChild };
};

// GET: Fetch notifications
async function getNotifications(request, user, context) {
  try {
    const params = await context.params;
    const { childId } = params;
    await connectDB();

    const { parent, ownsChild } = await checkOwnership(user, childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const child = await User.findById(childId).lean();
    if (!child) return NextResponse.json({ success: true, notifications: [] });

    // 1. Fetch specific notifications
    const dbNotifications = await Notification.find({
      $or: [
        { targetUser: childId },
        { targetUser: parent._id, childId: childId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // 2. Fetch Events
    const events = await Event.find({
      $or: [
        { branchId: child.branchId },
        { branchId: null },
      ],
      targetAudience: { $in: ['parents', 'students', 'all'] },
      startDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) },
    })
      .sort({ startDate: 1 })
      .limit(10)
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

    const allNotifications = [
      ...dbNotifications.map(n => ({
        ...n, 
        _id: n._id.toString(), 
        id: n._id.toString(),
        date: n.createdAt,
        isEvent: false 
      })),
      ...eventNotifications
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({ success: true, notifications: allNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH: Mark notifications as read
async function markAsRead(request, user, context) {
  try {
    const params = await context.params;
    const { childId } = params;
    await connectDB();

    const { parent, ownsChild } = await checkOwnership(user, childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const body = await request.json();
    const { notificationId, markAll } = body;

    let result;
    if (markAll) {
      // Mark all unread notifications for this child OR parent-child context
      result = await Notification.updateMany(
        {
          $or: [
            { targetUser: childId },
            { targetUser: parent._id, childId: childId }
          ],
          isRead: false
        },
        { $set: { isRead: true } }
      );
    } else if (notificationId) {
      // Mark specific notification 
      // We allow parent to mark if it belongs to child OR parent-child context
      result = await Notification.updateOne(
        {
          _id: notificationId,
          $or: [
            { targetUser: childId },
            { targetUser: parent._id, childId: childId }
          ]
        },
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

const handler = withAuth(async (req, user, userDoc, context) => {
  if (req.method === 'GET') {
    return getNotifications(req, user, context);
  } else if (req.method === 'PATCH') {
    return markAsRead(req, user, context);
  } else {
    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }
});

export const GET = handler;
export const PATCH = handler;

