import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/backend/models/Event';
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
}
