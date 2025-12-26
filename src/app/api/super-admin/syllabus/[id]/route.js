import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Syllabus from '@/backend/models/Syllabus';
import { withAuth } from '@/backend/middleware/auth';
import Subject from '@/backend/models/Subject';
import Class from '@/backend/models/Class';
import Branch from '@/backend/models/Branch';
import Level from '@/backend/models/Level';
import Grade from '@/backend/models/Grade';
import Stream from '@/backend/models/Stream';

// GET - Get single syllabus
export const GET = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();

    const { id } = await context.params;
    
    const syllabus = await Syllabus.findById(id)
      .populate('subjectId', 'name code grade')
      .populate('classId', 'name code grade')
      .populate('branchId', 'name code')
      .populate('levelId', 'name code order')
      .populate('gradeId', 'name gradeNumber code')
      .populate('streamId', 'name code')
      .populate('preparedBy', 'firstName lastName employeeId email')
      .populate('approvedBy', 'firstName lastName employeeId email')
      .lean();

    if (!syllabus) {
      return NextResponse.json(
        {
          success: false,
          message: 'Syllabus not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: syllabus,
    });
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch syllabus',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// PUT - Update syllabus
export const PUT = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();

    const { id } = await context.params;
    
    // Parse JSON with error handling
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }
    
    const syllabus = await Syllabus.findById(id);
    
    if (!syllabus) {
      return NextResponse.json(
        {
          success: false,
          message: 'Syllabus not found',
        },
        { status: 404 }
      );
    }
    
    // Update syllabus
    Object.assign(syllabus, body);
    syllabus.updatedBy = userDoc._id;
    
    await syllabus.save();
    
    // Populate and return
    await syllabus.populate([
      { path: 'subjectId', select: 'name code grade' },
      { path: 'classId', select: 'name code grade' },
      { path: 'branchId', select: 'name code' },
      { path: 'levelId', select: 'name code order' },
      { path: 'gradeId', select: 'name gradeNumber code' },
      { path: 'streamId', select: 'name code' },
      { path: 'preparedBy', select: 'firstName lastName employeeId' },
      { path: 'approvedBy', select: 'firstName lastName employeeId' },
      { path: 'updatedBy', select: 'fullName email' },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Syllabus updated successfully',
      data: syllabus,
    });
  } catch (error) {
    console.error('Error updating syllabus:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update syllabus',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// DELETE - Archive syllabus
export const DELETE = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();

    const { id } = await context.params;
    
    const syllabus = await Syllabus.findById(id);
    
    if (!syllabus) {
      return NextResponse.json(
        {
          success: false,
          message: 'Syllabus not found',
        },
        { status: 404 }
      );
    }
    
    // Soft delete
    syllabus.status = 'archived';
    syllabus.updatedBy = userDoc._id;
    await syllabus.save();

    return NextResponse.json({
      success: true,
      message: 'Syllabus archived successfully',
    });
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete syllabus',
        error: error.message,
      },
      { status: 500 }
    );
  }
});
