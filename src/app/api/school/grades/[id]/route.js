//src/app/api/school/grades/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Grade from '@/backend/models/Grade';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
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
    
    const grade = await Grade.findById(id)
      .populate('levelId', 'name code')
      .lean();
      
    if (!grade) {
      return NextResponse.json({ 
        success: false, 
        message: 'Grade not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: grade 
    });
    
  } catch (error) {
    console.error('Error fetching grade:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch grade',
      error: error.message 
    }, { status: 500 });
  }
});

export const PUT = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    const body = await request.json();
    
    console.log('Updating grade:', id, 'with data:', body);
    
    const grade = await Grade.findById(id);
    
    if (!grade) {
      return NextResponse.json({ 
        success: false, 
        message: 'Grade not found' 
      }, { status: 404 });
    }
    
    // Update only provided fields
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        grade[key] = body[key];
      }
    });
    
    grade.updatedBy = userDoc._id;
    await grade.save();
    
    // Populate before returning
    await grade.populate('levelId', 'name code');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Grade updated successfully',
      data: grade 
    });
    
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update grade',
      error: error.message 
    }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    
    const grade = await Grade.findByIdAndDelete(id);
    
    if (!grade) {
      return NextResponse.json({ 
        success: false, 
        message: 'Grade not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Grade deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting grade:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete grade',
      error: error.message 
    }, { status: 500 });
  }
});