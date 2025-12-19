import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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

    const { id } = params;

    const parent = await User.findById(session.user.id);
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const child = parent.parentProfile.children.find(c => c.id.toString() === id);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const student = await User.findById(id).populate('studentProfile.classId', 'name');
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ child: { ...child.toObject(), studentProfile: student.studentProfile } });
  } catch (error) {
    console.error('Get child details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
