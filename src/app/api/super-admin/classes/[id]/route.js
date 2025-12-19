// ease-academy/src/app/api/super-admin/classes/%5Bid%5D/route.js
import { NextResponse } from 'next/server';
import Class from '@/backend/models/Class';
import User from '@/backend/models/User';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import connectDB from '@/lib/database';

// Helper function to extract ID from URL
function extractIdFromUrl(urlString) {
  try {
    const url = new URL(urlString);
    const pathParts = url.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

// GET - Get single class
async function getClass(request) {
  try {
    await connectDB();

    // Extract ID from URL
    const id = extractIdFromUrl(request.url);
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Invalid class ID' },
        { status: 400 }
      );
    }

    // Populate all related data
    const classDoc = await Class.findById(id)
      .populate('branchId', 'name code city')
      .populate('grade', 'name gradeNumber')
      .populate('subjects', 'name code')
      .populate({
        path: 'sections.classTeacherId',
        select: 'name email'
      })
      .populate('feeTemplates')
      .lean(); // Use lean() for better performance

    if (!classDoc) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    // Get student count
    const studentCount = await User.countDocuments({
      role: 'student',
      'studentProfile.classId': classDoc._id,
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      data: {
        ...classDoc,
        studentCount,
      },
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch class', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Update class
async function updateClass(request, authenticatedUser, userDoc) {
  try {
    await connectDB();

    // Extract ID from URL
    const id = extractIdFromUrl(request.url);
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Invalid class ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Log for debugging
    console.log('Updating class:', id, 'with data:', body);

    // Find class first to check if it exists
    const existingClass = await Class.findById(id);
    if (!existingClass) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    // Update class with user who updated
    const updateData = {
      ...body,
      updatedBy: userDoc._id,
      updatedAt: new Date()
    };

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    )
      .populate('branchId', 'name code city')
      .populate('grade', 'name gradeNumber')
      .populate('subjects', 'name code')
      .populate({
        path: 'sections.classTeacherId',
        select: 'name email'
      });

    return NextResponse.json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass,
    });
  } catch (error) {
    console.error('Error updating class:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update class', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete class
async function deleteClass(request, authenticatedUser, userDoc) {
  try {
    await connectDB();

    // Extract ID from URL
    const id = extractIdFromUrl(request.url);
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Invalid class ID' },
        { status: 400 }
      );
    }

    // Find class
    const classDoc = await Class.findById(id);
    if (!classDoc) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if class has active students
    const studentCount = await Student.countDocuments({ 
      classId: id, 
      status: 'active' 
    });
    
    if (studentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete class. It has ${studentCount} active student(s).`,
        },
        { status: 400 }
      );
    }

    // Archive instead of delete
    await Class.findByIdAndUpdate(
      id, 
      { 
        status: 'archived',
        updatedBy: userDoc._id,
        updatedAt: new Date()
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Class archived successfully',
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete class', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getClass);
export const PUT = withAuth(updateClass);
export const DELETE = withAuth(deleteClass);