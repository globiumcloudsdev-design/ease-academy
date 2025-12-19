// ease-academy/src/app/api/super-admin/subjects/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Subject from '@/backend/models/Subject';
import { withAuth } from '@/backend/middleware/auth';
import Subjects from '@/backend/models/Subject';
import Class from '@/backend/models/Class';
import Department from '@/backend/models/Department';
import Grade from '@/backend/models/Grade';
import Branch from '@/backend/models/Branch';

// GET - Get single subject
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const id = request.url.split('/').pop();
    
    const subject = await Subject.findById(id)
      .populate('classId', 'name code grade')
      .populate('departmentId', 'name code')
      .populate('headTeacherId', 'firstName lastName employeeId email phone')
      .populate('teachers', 'firstName lastName employeeId email')
      .lean();

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message: 'Subject not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error('Error fetching subject:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch subject',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// PUT - Update subject
export const PUT = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const id = request.url.split('/').pop();
    const body = await request.json();
    
    // Check if subject exists
    const subject = await Subject.findById(id);
    
    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message: 'Subject not found',
        },
        { status: 404 }
      );
    }
    
    // If code is being changed, check uniqueness
    if (body.code && body.code !== subject.code) {
      const existingSubject = await Subject.findOne({ code: body.code });
      if (existingSubject) {
        return NextResponse.json(
          {
            success: false,
            message: 'Subject code already exists',
          },
          { status: 400 }
        );
      }
    }
    
    // Update subject
    Object.assign(subject, body);
    subject.updatedBy = userDoc._id;
    
    await subject.save();
    
    // Populate and return
    await subject.populate([
      { path: 'classId', select: 'name code grade' },
      { path: 'departmentId', select: 'name code' },
      { path: 'headTeacherId', select: 'firstName lastName employeeId' },
      { path: 'teachers', select: 'firstName lastName employeeId' },
      { path: 'updatedBy', select: 'fullName email' },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update subject',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// DELETE - Delete/Archive subject
export const DELETE = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const id = request.url.split('/').pop();
    
    const subject = await Subject.findById(id);
    
    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message: 'Subject not found',
        },
        { status: 404 }
      );
    }
    
    // Check if subject is used in any syllabus
    const Syllabus = (await import('@/backend/models/Syllabus')).default;
    const syllabusCount = await Syllabus.countDocuments({ subjectId: id });
    
    if (syllabusCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete subject. It is used in ${syllabusCount} syllabus(es).`,
        },
        { status: 400 }
      );
    }
    
    // Soft delete
    subject.status = 'archived';
    subject.updatedBy = userDoc._id;
    await subject.save();

    return NextResponse.json({
      success: true,
      message: 'Subject archived successfully',
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete subject',
        error: error.message,
      },
      { status: 500 }
    );
  }
});
