// ease-academy/src/app/api/super-admin/syllabus/route.js
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

// GET - List all syllabus with filters
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;
    
    const search = searchParams.get('search') || '';
    const subjectId = searchParams.get('subjectId');
    const classId = searchParams.get('classId');
    const branchId = searchParams.get('branchId');
    const levelId = searchParams.get('levelId');
    const gradeId = searchParams.get('gradeId');
    const streamId = searchParams.get('streamId');
    const academicYear = searchParams.get('academicYear');
    const status = searchParams.get('status');
    
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { academicYear: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (subjectId) query.subjectId = subjectId;
    if (classId) query.classId = classId;
    if (branchId) query.branchId = branchId;
    if (levelId) query.levelId = levelId;
    if (gradeId) query.gradeId = gradeId;
    if (streamId) query.streamId = streamId;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;
    
    const [syllabus, total] = await Promise.all([
      Syllabus.find(query)
        .populate('subjectId', 'name code grade')
        .populate('classId', 'name code grade')
        .populate('branchId', 'name code')
        .populate('levelId', 'name code order')
        .populate('gradeId', 'name gradeNumber code')
        .populate('streamId', 'name code')
        .populate('preparedBy', 'firstName lastName employeeId')
        .populate('approvedBy', 'firstName lastName employeeId')
        .sort({ academicYear: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Syllabus.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: syllabus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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

// POST - Create new syllabus
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'subjectId', 'academicYear', 'gradeId'];
    
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }
    
    // Verify subject exists
    const Subject = (await import('@/backend/models/Subject')).default;
    const subjectExists = await Subject.findById(body.subjectId);
    
    if (!subjectExists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Subject not found',
        },
        { status: 404 }
      );
    }
    
    // Verify class exists (if provided)
    if (body.classId) {
      const Class = (await import('@/backend/models/Class')).default;
      const classExists = await Class.findById(body.classId);
      
      if (!classExists) {
        return NextResponse.json(
          {
            success: false,
            message: 'Class not found',
          },
          { status: 404 }
        );
      }
    }
    
    // Verify branch exists (if provided)
    if (body.branchId) {
      const Branch = (await import('@/backend/models/Branch')).default;
      const branchExists = await Branch.findById(body.branchId);
      
      if (!branchExists) {
        return NextResponse.json(
          {
            success: false,
            message: 'Branch not found',
          },
          { status: 404 }
        );
      }
    }
    
    // Verify Level/Grade/Stream if provided
    if (body.levelId) {
      const Level = (await import('@/backend/models/Level')).default;
      const levelExists = await Level.findById(body.levelId);
      if (!levelExists) {
        return NextResponse.json(
          { success: false, message: 'Level not found' },
          { status: 404 }
        );
      }
    }
    
    if (body.gradeId) {
      const Grade = (await import('@/backend/models/Grade')).default;
      const gradeExists = await Grade.findById(body.gradeId);
      if (!gradeExists) {
        return NextResponse.json(
          { success: false, message: 'Grade not found' },
          { status: 404 }
        );
      }
    }
    
    if (body.streamId) {
      const Stream = (await import('@/backend/models/Stream')).default;
      const streamExists = await Stream.findById(body.streamId);
      if (!streamExists) {
        return NextResponse.json(
          { success: false, message: 'Stream not found' },
          { status: 404 }
        );
      }
    }
    
    // Create syllabus
    const newSyllabus = new Syllabus({
      ...body,
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });
    
    await newSyllabus.save();
    
    // Populate and return
    await newSyllabus.populate([
      { path: 'subjectId', select: 'name code grade' },
      { path: 'classId', select: 'name code grade' },
      { path: 'branchId', select: 'name code' },
      { path: 'levelId', select: 'name code order' },
      { path: 'gradeId', select: 'name gradeNumber code' },
      { path: 'streamId', select: 'name code' },
      { path: 'preparedBy', select: 'firstName lastName employeeId' },
      { path: 'createdBy', select: 'fullName email' },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Syllabus created successfully',
        data: newSyllabus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating syllabus:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create syllabus',
        error: error.message,
      },
      { status: 500 }
    );
  }
});
