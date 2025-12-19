import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/backend/models/User';
import Subject from '@/backend/models/Subject';
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

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    const parent = await User.findById(session.user.id);
    if (!parent || !parent.parentProfile.children.some(c => c.id.toString() === childId)) {
      return NextResponse.json({ error: 'Unauthorized access to child' }, { status: 403 });
    }

    const child = await User.findById(childId);
    if (!child || child.role !== 'student') {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const subjects = await Subject.find({
      classId: child.studentProfile.classId,
    }).select('name resources');

    return NextResponse.json({ resources: subjects });
  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
