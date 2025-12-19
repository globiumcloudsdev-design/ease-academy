import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/backend/models/Event';
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
}
