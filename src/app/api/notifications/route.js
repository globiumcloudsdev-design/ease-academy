

import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Notification from '@/backend/models/Notification';
import ReadReceipt from '@/backend/models/ReadReceipt';
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

    // 🔥 1. Pehle wo Event IDs nikalein jo user ne hide (delete) kar di hain
    // Hum Notification model mein hi metadata.eventId mein ID save kar rahe hain
    const hiddenEventRecords = await Notification.find({
      targetUser: userId,
      isHidden: true,
      type: 'event'
    }).select('metadata.eventId').lean();

    const hiddenEventIds = hiddenEventRecords.map(r => r.metadata?.eventId?.toString());

    // 🔥 2. Fetch Personal DB notifications (Jo hide nahi hain)
    const dbNotifications = await Notification.find({
      targetUser: userId,
      isHidden: { $ne: true } // Jo hidden nahi hain (ya field exist nahi karti)
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Unread count bhi sirf unka jo hidden nahi hain
    const totalUnread = await Notification.countDocuments({
      targetUser: userId,
      isRead: false,
      isHidden: { $ne: true }
    });

    // 3. Fetch Events (Broadcasts) if it's the first page
    let eventNotifications = [];
    if (page === 1) {
      const branchId = user.branchId;

      let audienceFilter = ['all'];
      if (user.role === 'teacher') audienceFilter.push('teachers');
      if (user.role === 'staff') audienceFilter.push('staff');
      if (user.role === 'parent') audienceFilter.push('parents');
      if (user.role === 'student') audienceFilter.push('students');

      const readReceipts = await ReadReceipt.find({ userId }).select('eventId').lean();
      const readEventIdStrings = readReceipts.map(r => r.eventId.toString());

      const events = await Event.find({
        $or: [
          { branchId: branchId },
          { branchId: null },
        ],
        _id: { $nin: hiddenEventIds }, // 🔥 CHANGE: Wo events mat dikhao jo hide hain
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
        isRead: readEventIdStrings.includes(event._id.toString()),
        isEvent: true,
        data: event
      }));
    }

    // Merge and sort
    const merged = [
      ...dbNotifications.map(n => ({
        ...n,
        id: n._id.toString(),
        date: n.createdAt,
        isEvent: false
      })),
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
    const { notificationId, isEvent, markAll } = body;

    // 🔥 MARK ALL AS READ
    if (markAll) {
      // 1. Mark all personal notifications as read
      await Notification.updateMany(
        { targetUser: userId, isRead: false },
        { $set: { isRead: true } }
      );

      // 2. Create ReadReceipts for all broadcast events
      let audienceFilter = ['all'];
      if (user.role === 'teacher') audienceFilter.push('teachers');
      if (user.role === 'staff') audienceFilter.push('staff');
      if (user.role === 'parent') audienceFilter.push('parents');
      if (user.role === 'student') audienceFilter.push('students');

      const currentEvents = await Event.find({
        $or: [
          { branchId: user.branchId },
          { branchId: null },
        ],
        targetAudience: { $in: audienceFilter },
        startDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
      }).select('_id');

      // Bulk insert ReadReceipts
      const receiptOps = currentEvents.map(event => ({
        updateOne: {
          filter: { userId, eventId: event._id },
          update: { userId, eventId: event._id },
          upsert: true
        }
      }));

      if (receiptOps.length > 0) {
        await ReadReceipt.bulkWrite(receiptOps);
      }

      return NextResponse.json({ success: true, message: 'All marked as read' });
    }

    // 🔥 SINGLE NOTIFICATION MARK AS READ
    else if (notificationId) {
      if (isEvent) {
        // Event: Create ReadReceipt
        await ReadReceipt.findOneAndUpdate(
          { userId, eventId: notificationId },
          { userId, eventId: notificationId },
          { upsert: true }
        );
      } else {
        // Normal Notification: Update isRead
        await Notification.updateOne(
          { _id: notificationId, targetUser: userId },
          { $set: { isRead: true } }
        );
      }

      return NextResponse.json({ success: true });
    }

    else {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function hideNotification(request, user) {
  try {
    await connectDB();
    const userId = user.userId;
    const { notificationId, isEvent } = await request.json();

    console.log('🗑️ DELETE Request received:', { userId, notificationId, isEvent });

    if (isEvent) {
      // 🔥 1. Agar EVENT (Broadcast) hai:
      // Isi model mein user ke liye ek hidden entry dalo
      const result = await Notification.create({
        type: 'event', // type event hi rakhein
        title: 'hidden_event', // Pehchan ke liye
        message: 'hidden',
        targetUser: userId,
        isHidden: true, // User ke liye hide kar do
        metadata: { eventId: notificationId } // Asal event ki ID yahan rakhein
      });
      console.log('✅ Event notification hidden (created hidden entry):', result._id);
    } else {
      // 🔥 2. Agar NORMAL notification hai:
      // Bas isHidden ko true kar do
      const result = await Notification.updateOne(
        { _id: notificationId, targetUser: userId },
        { $set: { isHidden: true } }
      );
      console.log('✅ Normal notification hidden:', { matched: result.matchedCount, modified: result.modifiedCount });

      if (result.matchedCount === 0) {
        console.warn('⚠️ No notification found with ID:', notificationId);
      }
    }

    console.log('✅ Notification deleted successfully for user:', userId);
    return NextResponse.json({ success: true, message: 'Deleted for user' });
  } catch (error) {
    console.error('❌ Hide notification error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

const handler = withAuth(async (req, user) => {
  if (req.method === 'GET') {
    return getNotifications(req, user);
  } else if (req.method === 'PATCH') {
    return markAsRead(req, user);
  } else if (req.method === 'DELETE') {  // 🔥 ADD THIS LINE
    return hideNotification(req, user);   // 🔥 ADD THIS LINE
  } else {
    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }
});

export const GET = handler;
export const PATCH = handler;
export const DELETE = handler;  // 🔥 ADD THIS LINE