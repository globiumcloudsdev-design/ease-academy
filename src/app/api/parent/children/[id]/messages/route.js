import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Message from '@/backend/models/Message';
import User from '@/backend/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: childId } = params;

    const parent = await User.findById(session.user.id);
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
}
