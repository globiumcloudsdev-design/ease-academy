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

    // Get upcoming events for the parent's branch or global events
    const events = await Event.findUpcoming(parent.branchId)
      .populate('organizer', 'fullName')
      .populate('createdBy', 'fullName')
      .sort({ startDate: 1 });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
