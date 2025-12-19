// ease-academy/src/app/api/school/grades/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Level from '@/backend/models/Level';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';


// Helper function to extract ID from URL
function extractIdFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

// GET - Get single level
export const GET = withAuth(async (request, user) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    
    const level = await Level.findById(id).lean();
    
    if (!level) {
      return NextResponse.json({ 
        success: false, 
        message: 'Level not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: level 
    });
    
  } catch (error) {
    console.error('Error fetching level:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch level',
      error: error.message 
    }, { status: 500 });
  }
});

// PUT - Update level
export const PUT = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    const body = await request.json();
    
    const level = await Level.findById(id);
    
    if (!level) {
      return NextResponse.json({ 
        success: false, 
        message: 'Level not found' 
      }, { status: 404 });
    }
    
    // Update fields
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        level[key] = body[key];
      }
    });
    
    level.updatedBy = userDoc._id;
    await level.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Level updated successfully',
      data: level 
    });
    
  } catch (error) {
    console.error('Error updating level:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update level',
      error: error.message 
    }, { status: 500 });
  }
});

// DELETE - Delete level
export const DELETE = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    
    const level = await Level.findByIdAndDelete(id);
    
    if (!level) {
      return NextResponse.json({ 
        success: false, 
        message: 'Level not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Level deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting level:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete level',
      error: error.message 
    }, { status: 500 });
  }
});