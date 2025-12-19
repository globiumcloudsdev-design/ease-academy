import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Event from '@/backend/models/Event';
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

    const child = await User.findById(childId);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Get announcements for the child's branch or global announcements
    const announcements = await Event.find({
      eventType: 'announcement',
      $or: [{ branchId: child.branchId }, { branchId: null }],
    })
      .populate('organizer', 'fullName')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Get child announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);