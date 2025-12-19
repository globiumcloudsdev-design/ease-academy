import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/backend/models/Message';
import User from '@/backend/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const conversationId = [session.user.id, recipientId].sort().join('-');

    const message = new Message({
      sender: session.user.id,
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
}
