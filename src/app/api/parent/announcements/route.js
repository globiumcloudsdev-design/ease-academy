import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Event from '@/backend/models/Event';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const parent = await User.findById(authenticatedUser.userId);
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // Assuming announcements are stored as Events with type 'announcement'
    const announcements = await Event.find({
      type: 'announcement',
      branchId: parent.branchId, // Assuming parent has branchId
    }).sort({ createdAt: -1 });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
