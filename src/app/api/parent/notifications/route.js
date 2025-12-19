import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/backend/models/Notification';
import User from '@/backend/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parent = await User.findById(session.user.id);
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const childIds = parent.parentProfile.children.map(c => c.id);

    const notifications = await Notification.find({
      $or: [
        { targetUser: session.user.id },
        { childId: { $in: childIds } },
      ],
    })
      .populate('childId', 'fullName studentProfile.registrationNumber')
      .sort({ createdAt: -1 });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
