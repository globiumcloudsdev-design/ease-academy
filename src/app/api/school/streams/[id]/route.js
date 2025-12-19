// ease-academy/src/app/api/school/grades/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Stream from '@/backend/models/Stream';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Grade from '@/backend/models/Grade';
import Stream from '@/backend/models/Stream';
import Subject from '@/backend/models/Subject';
import Level from '@/backend/models/Level';

function extractIdFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

export const GET = withAuth(async (request) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    
    const stream = await Stream.findById(id).lean();
    
    if (!stream) {
      return NextResponse.json({ 
        success: false, 
        message: 'Stream not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: stream 
    });
    
  } catch (error) {
    console.error('Error fetching stream:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch stream',
      error: error.message 
    }, { status: 500 });
  }
});

export const PUT = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    const body = await request.json();
    
    console.log('Updating stream:', id, 'with data:', body);
    
    const stream = await Stream.findById(id);
    
    if (!stream) {
      return NextResponse.json({ 
        success: false, 
        message: 'Stream not found' 
      }, { status: 404 });
    }
    
    // Update fields
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        stream[key] = body[key];
      }
    });
    
    stream.updatedBy = userDoc._id;
    await stream.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stream updated successfully',
      data: stream 
    });
    
  } catch (error) {
    console.error('Error updating stream:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update stream',
      error: error.message 
    }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    
    const stream = await Stream.findByIdAndDelete(id);
    
    if (!stream) {
      return NextResponse.json({ 
        success: false, 
        message: 'Stream not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stream deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting stream:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete stream',
      error: error.message 
    }, { status: 500 });
  }
});