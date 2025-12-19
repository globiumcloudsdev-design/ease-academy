// ease-academy/src/app/api/school/grade-stream-subjects/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import GradeStreamSubject from '@/backend/models/GradeStreamSubject';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Grade from '@/backend/models/Grade';
import Stream from '@/backend/models/Stream';
import Subjects from '@/backend/models/Subject';

function extractIdFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

export const GET = withAuth(async (request) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    
    const item = await GradeStreamSubject.findById(id)
      .populate('subjectId', 'name code')
      .populate('gradeId', 'name gradeNumber')
      .populate('streamId', 'name')
      .lean();

    if (!item) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mapping not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: item 
    });
    
  } catch (error) {
    console.error('Error fetching grade-stream-subject:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch mapping',
      error: error.message 
    }, { status: 500 });
  }
});

export const PUT = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    const body = await request.json();
    
    console.log('Updating GSS:', id, 'with data:', body);
    
    const item = await GradeStreamSubject.findById(id);
    
    if (!item) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mapping not found' 
      }, { status: 404 });
    }
    
    // Update fields
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        item[key] = body[key];
      }
    });
    
    item.updatedBy = userDoc._id;
    await item.save();
    
    // Populate before returning
    await item.populate([
      { path: 'subjectId', select: 'name code' },
      { path: 'gradeId', select: 'name gradeNumber' },
      { path: 'streamId', select: 'name' },
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Mapping updated successfully',
      data: item 
    });
    
  } catch (error) {
    console.error('Error updating grade-stream-subject:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update mapping',
      error: error.message 
    }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    
    const item = await GradeStreamSubject.findByIdAndDelete(id);
    
    if (!item) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mapping not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Mapping deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting grade-stream-subject:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete mapping',
      error: error.message 
    }, { status: 500 });
  }
});