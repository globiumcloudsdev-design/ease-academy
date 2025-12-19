// ease-academy/src/app/api/school/grade-stream-subjects/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import GradeStreamSubject from '@/backend/models/GradeStreamSubject';
import { withAuth } from '@/backend/middleware/auth';
import Grade from '@/backend/models/Grade';
import Subject from '@/backend/models/Subject';
import Stream from '@/backend/models/Stream';
import Branch from '@/backend/models/Branch';

function extractIdFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

// GET - List all grade-stream-subject mappings with filters
export const GET = withAuth(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');
    const streamId = searchParams.get('streamId');

    const query = {};
    if (gradeId) query.gradeId = gradeId;
    if (streamId) query.streamId = streamId;

    const items = await GradeStreamSubject.find(query)
      .populate('subjectId', 'name code')
      .populate('gradeId', 'name gradeNumber')
      .populate('streamId', 'name')
      .lean();

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching grade-stream-subjects:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch mappings', error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    const body = await request.json();
    
    // Validate required fields
    if (!body.gradeId || !body.subjectId) {
      return NextResponse.json({ success: false, message: 'Grade and Subject are required' }, { status: 400 });
    }
    
    // Check for duplicate mapping
    const existing = await GradeStreamSubject.findOne({
      gradeId: body.gradeId,
      streamId: body.streamId || null,
      subjectId: body.subjectId,
    });
    
    if (existing) {
      return NextResponse.json({ success: false, message: 'This subject mapping already exists for the selected grade/stream' }, { status: 409 });
    }
    
    const newItem = new GradeStreamSubject({
      gradeId: body.gradeId,
      streamId: body.streamId || null,
      subjectId: body.subjectId,
      isCompulsory: body.isCompulsory || false,
      notes: body.notes || '',
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });
    
    await newItem.save();
    
    await newItem.populate([
      { path: 'subjectId', select: 'name code' },
      { path: 'gradeId', select: 'name gradeNumber' },
      { path: 'streamId', select: 'name' },
    ]);

    return NextResponse.json({ success: true, message: 'Mapping created successfully', data: newItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating grade-stream-subject:', error);
    return NextResponse.json({ success: false, message: 'Failed to create mapping', error: error.message }, { status: 500 });
  }
});
