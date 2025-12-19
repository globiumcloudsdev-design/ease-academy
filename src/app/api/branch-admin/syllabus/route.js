import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Syllabus from '@/backend/models/Syllabus';
import Class from '@/backend/models/Class';

// GET - Get all syllabus for branch admin's branch
async function getSyllabuses(request, authenticatedUser, userDoc) {
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
    const academicYear = searchParams.get('academicYear');

    // Build query - only for this branch or school-wide (null branchId)
    const query = {
      $or: [
        { branchId: authenticatedUser.branchId },
        { branchId: null }
      ]
    };
    
    if (search) {
      query.$and = [
        { ...query },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
          ]
        }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (academicYear) {
      query.academicYear = academicYear;
    }

    const skip = (page - 1) * limit;

    const [syllabuses, total] = await Promise.all([
      Syllabus.find(query)
        .populate('subjectId', 'name code')
        .populate('classId', 'name code')
        .populate('gradeId', 'name gradeNumber')
        .populate('streamId', 'name code')
        .populate('preparedBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Syllabus.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        syllabuses,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get syllabuses error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch syllabuses' },
      { status: 500 }
    );
  }
}

// POST - Create new syllabus (only for branch admin's branch)
async function createSyllabus(request, authenticatedUser, userDoc) {
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

    // If classId provided, validate it belongs to this branch
    if (body.classId) {
      const classDoc = await Class.findById(body.classId);
      if (!classDoc || classDoc.branchId.toString() !== authenticatedUser.branchId.toString()) {
        return NextResponse.json(
          { success: false, message: 'Invalid class for this branch' },
          { status: 400 }
        );
      }
    }

    const syllabusData = {
      ...body,
      branchId: authenticatedUser.branchId, // Force branch to admin's branch
      createdBy: authenticatedUser.userId,
      preparedBy: authenticatedUser.userId,
    };

    const syllabus = new Syllabus(syllabusData);
    await syllabus.save();

    return NextResponse.json({
      success: true,
      data: syllabus,
      message: 'Syllabus created successfully',
    });
  } catch (error) {
    console.error('Create syllabus error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create syllabus' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSyllabuses);
export const POST = withAuth(createSyllabus);
