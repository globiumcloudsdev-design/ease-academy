// ease-academy/src/app/api/school/levels/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Level from '@/backend/models/Level';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';

function extractIdFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

export const GET = withAuth(async (request) => {
  try {
    await connectDB();
    const levels = await Level.find().sort({ order: 1, name: 1 }).lean();
    return NextResponse.json({ success: true, data: levels });
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch levels', error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const level = new Level({
      name: body.name,
      code: body.code || undefined,
      order: body.order || 0,
      description: body.description || '',
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });

    await level.save();
    return NextResponse.json({ success: true, message: 'Level created', data: level }, { status: 201 });
  } catch (error) {
    console.error('Error creating level:', error);
    return NextResponse.json({ success: false, message: 'Failed to create level', error: error.message }, { status: 500 });
  }
});
