import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Syllabus from '@/backend/models/Syllabus';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, authenticatedUser) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    const parent = await User.findById(authenticatedUser.userId);
    if (!parent || !parent.parentProfile.children.some(c => c.id.toString() === childId)) {
      return NextResponse.json({ error: 'Unauthorized access to child' }, { status: 403 });
    }

    const child = await User.findById(childId);
    if (!child || child.role !== 'student') {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const syllabus = await Syllabus.find({
      classId: child.studentProfile.classId,
    }).populate('subjectId', 'name');

    return NextResponse.json({ syllabus });
  } catch (error) {
    console.error('Get syllabus error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
