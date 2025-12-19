import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Exam from '@/backend/models/Exam';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import Branch from '@/backend/models/Branch';

// GET - Get all exams for branch admin's branch
async function getExams(request, authenticatedUser, userDoc) {
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
    const subjectId = searchParams.get('subjectId');
    const examType = searchParams.get('examType');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build query - only for this branch
    const query = { branchId: authenticatedUser.branchId };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { room: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (classId) {
      query.classId = classId;
    }

    if (subjectId) {
      query.subjectId = subjectId;
    }

    if (examType) {
      query.examType = examType;
    }

    if (fromDate && toDate) {
      query.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    } else if (fromDate) {
      query.date = { $gte: new Date(fromDate) };
    } else if (toDate) {
      query.date = { $lte: new Date(toDate) };
    }

    const skip = (page - 1) * limit;

    const [exams, total] = await Promise.all([
      Exam.find(query)
        .populate('classId', 'name code')
        .populate('subjectId', 'name code')
        .populate('createdBy', 'fullName email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Exam.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        exams,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get exams error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}

// POST - Create new exam
async function createExam(request, authenticatedUser, userDoc) {
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
    
    // Validate class belongs to branch
    const classDoc = await Class.findOne({
      _id: body.classId,
      branchId: authenticatedUser.branchId,
    });

    if (!classDoc) {
      return NextResponse.json(
        { success: false, message: 'Class not found or does not belong to your branch' },
        { status: 404 }
      );
    }

    // Validate subject exists
    const subjectDoc = await Subject.findById(body.subjectId);
    if (!subjectDoc) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    const exam = new Exam({
      ...body,
      branchId: authenticatedUser.branchId,
      createdBy: authenticatedUser.userId,
    });

    await exam.save();

    return NextResponse.json({
      success: true,
      message: 'Exam created successfully',
      data: { exam },
    });
  } catch (error) {
    console.error('Create exam error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create exam' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getExams);
export const POST = withAuth(createExam);
