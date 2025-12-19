import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Message from '@/backend/models/Message';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await Message.find({
      $or: [{ sender: session.user.id }, { recipient: session.user.id }],
    })
      .populate('sender', 'fullName role')
      .populate('recipient', 'fullName role')
      .sort({ createdAt: -1 });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
