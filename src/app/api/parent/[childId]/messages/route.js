import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Message from '@/backend/models/Message';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    // Fetch messages sent to parent about this child
    const messages = await Message.find({
      recipient: userDoc._id,
    })
      .populate('sender', 'fullName firstName lastName role profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const messagesData = messages.map(msg => ({
      id: msg._id.toString(),
      from: {
        id: msg.sender?._id?.toString(),
        name: msg.sender?.fullName || msg.sender?.firstName,
        role: msg.sender?.role,
        photo: msg.sender?.profilePhoto?.url,
      },
      subject: msg.subject,
      content: msg.content,
      isRead: msg.isRead,
      priority: msg.priority,
      attachments: msg.attachments,
      sentAt: msg.createdAt,
    }));

    return NextResponse.json({ success: true, messages: messagesData });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch messages' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
