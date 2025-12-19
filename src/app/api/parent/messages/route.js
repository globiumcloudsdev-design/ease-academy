import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Message from '@/backend/models/Message';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, authenticatedUser) => {
  try {
    await connectDB();

    const messages = await Message.find({
      $or: [{ sender: authenticatedUser.userId }, { recipient: authenticatedUser.userId }],
    })
      .populate('sender', 'fullName role')
      .populate('recipient', 'fullName role')
      .sort({ createdAt: -1 });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
