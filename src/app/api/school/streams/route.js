// ease-academy/src/app/api/school/streams/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Stream from '@/backend/models/Stream';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Grade from '@/backend/models/Grade';
import Subject from '@/backend/models/Subject';
import Level from '@/backend/models/Level';

export const GET = withAuth(async (request) => {
  try {
    await connectDB();
    const streams = await Stream.find().sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: streams });
  } catch (error) {
    console.error('Error fetching streams:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch streams', error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    const Stream = (await import('@/backend/models/Stream')).default;
    const stream = new Stream({
      name: body.name,
      code: body.code || undefined,
      description: body.description || '',
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });
    await stream.save();
    return NextResponse.json({ success: true, message: 'Stream created', data: stream }, { status: 201 });
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json({ success: false, message: 'Failed to create stream', error: error.message }, { status: 500 });
  }
});
