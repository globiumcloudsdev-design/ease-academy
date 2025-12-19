// ease-academy/src/app/api/school/grades/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Grade from '@/backend/models/Grade';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Stream from '@/backend/models/Stream';
import Subjects from '@/backend/models/Subject';

export const GET = withAuth(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const levelId = searchParams.get('levelId');

    const query = {};
    if (levelId) query.levelId = levelId;

    const grades = await Grade.find(query).sort({ gradeNumber: 1, name: 1 }).lean();
    return NextResponse.json({ success: true, data: grades });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch grades', error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    if (!body.levelId) return NextResponse.json({ success: false, message: 'levelId is required' }, { status: 400 });

    const Grade = (await import('@/backend/models/Grade')).default;
    const grade = new Grade({
      name: body.name,
      gradeNumber: body.gradeNumber || undefined,
      levelId: body.levelId,
      code: body.code || undefined,
      academicYear: body.academicYear || undefined,
      description: body.description || '',
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });

    await grade.save();
    return NextResponse.json({ success: true, message: 'Grade created', data: grade }, { status: 201 });
  } catch (error) {
    console.error('Error creating grade:', error);
    return NextResponse.json({ success: false, message: 'Failed to create grade', error: error.message }, { status: 500 });
  }
});
