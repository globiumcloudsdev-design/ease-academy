import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Message from '@/backend/models/Message';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const POST = withAuth(async (request, authenticatedUser) => {
  try {
    await connectDB();

    const body = await request.json();
    const { recipientId, subject, content, priority } = body;

    if (!recipientId || !subject || !content) {
      return NextResponse.json({ error: 'Recipient, subject, and content are required' }, { status: 400 });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient || (recipient.role !== 'teacher' && recipient.role !== 'branch_admin')) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
    }

    // Generate conversationId based on sender and recipient
    const conversationId = [authenticatedUser.userId, recipientId].sort().join('-');

    const message = new Message({
      sender: authenticatedUser.userId,
      recipient: recipientId,
      subject,
      content,
      priority: priority || 'normal',
      conversationId,
    });

    await message.save();

    return NextResponse.json({ message: 'Message sent successfully', messageId: message._id });
  } catch (error) {
    console.error('Compose message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
