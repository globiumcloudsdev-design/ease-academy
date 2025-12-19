import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Attendance from '@/backend/models/Attendance';
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

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const dateRange = searchParams.get('dateRange'); // e.g., 'last30days'

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    const parent = await User.findById(session.user.id);
    if (!parent || !parent.parentProfile.children.some(c => c.id.toString() === childId)) {
      return NextResponse.json({ error: 'Unauthorized access to child' }, { status: 403 });
    }

    let query = { studentId: childId };
    if (dateRange === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('studentId', 'fullName');

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
