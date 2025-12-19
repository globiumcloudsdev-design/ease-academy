import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Subject from '@/backend/models/Subject';
import Grade from '@/backend/models/Grade';
import Class from '@/backend/models/Class';
import Department from '@/backend/models/Department';
import User from '@/backend/models/User';

// GET - Get all subjects for branch admin's branch (through classes)
async function getSubjects(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const classId = searchParams.get('classId');

    // First get all classes for this branch
    const branchClasses = await Class.find({ branchId: authenticatedUser.branchId }).select('_id');
    const classIds = branchClasses.map(c => c._id);

    // Build query - only subjects for this branch's classes
    const query = { classId: { $in: classIds } };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (classId) {
      query.classId = classId;
    }

    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      Subject.find(query)
        .populate('classId', 'name code')
        .populate('gradeId', 'name gradeNumber')
        .populate('departmentId', 'name code')
        .populate('headTeacherId', 'firstName lastName email')
        .populate('teachers', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subject.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        subjects,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

// POST - Create new subject (only for branch admin's classes)
async function createSubject(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Validate class belongs to this branch
    if (body.classId) {
      const classDoc = await Class.findById(body.classId);
      if (!classDoc || classDoc.branchId.toString() !== authenticatedUser.branchId.toString()) {
        return NextResponse.json(
          { success: false, message: 'Invalid class for this branch' },
          { status: 400 }
        );
      }
    }

    const subjectData = {
      ...body,
      createdBy: authenticatedUser.userId,
    };

    const subject = new Subject(subjectData);
    await subject.save();

    return NextResponse.json({
      success: true,
      data: subject,
      message: 'Subject created successfully',
    });
  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create subject' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSubjects);
export const POST = withAuth(createSubject);
