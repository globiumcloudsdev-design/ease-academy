import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Notification from '@/backend/models/Notification';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const parent = await User.findById(authenticatedUser.userId);
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const childIds = parent.parentProfile.children.map(c => c.id);

    const notifications = await Notification.find({
      $or: [
        { targetUser: authenticatedUser.userId },
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
}, [requireRole('parent')]);
