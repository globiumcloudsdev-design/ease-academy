import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Message from '@/backend/models/Message';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();

    const paramsObj = (context && await context.params) || {};
    const childId = paramsObj?.id || (request.nextUrl && request.nextUrl.pathname.split('/').pop());

    const parent = await User.findById(authenticatedUser.userId);
    if (!parent || !parent.parentProfile.children.some(c => c.id.toString() === childId)) {
      return NextResponse.json({ error: 'Unauthorized access to child' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Get messages where the child is the recipient or sender
    const messages = await Message.find({
      $or: [{ sender: childId }, { recipient: childId }],
    })
      .populate('sender', 'fullName role')
      .populate('recipient', 'fullName role')
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get child messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
