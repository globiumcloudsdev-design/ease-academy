import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Exam from '@/backend/models/Exam';
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
    const search = searchParams.get('search') || '';

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

    // Build search query for assignments
    const searchQuery = {
      classId: child.studentProfile.classId,
      type: 'assignment',
    };

    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Assuming assignments are stored as Exams with type 'assignment'
    const assignments = await Exam.find(searchQuery)
      .populate('subjectId', 'name')
      .sort({ dueDate: 1 });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
