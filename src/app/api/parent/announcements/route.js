import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/backend/models/Event';
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
}
