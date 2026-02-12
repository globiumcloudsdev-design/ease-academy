import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import Exam from '@/backend/models/Exam';

// GET - List all exams across all branches (Super Admin only)
export const GET = withAuth(async (request, user, userDoc) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const examType = searchParams.get('examType');
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    let query = {};

    // Add filters
    if (status) query.status = status;
    if (examType) query.examType = examType;
    if (branchId) query.branchId = branchId;
    if (classId) query.classId = classId;

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const exams = await Exam.find(query)
      .populate('branchId', 'name code')
      .populate('classId', 'name grade section')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Exam.countDocuments(query);

    return NextResponse.json({
      success: true,
      exams,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalExams: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}, [requireRole(ROLES.SUPER_ADMIN)]);

// POST - Create new exam (Super Admin only)
export const POST = withAuth(async (request, user, userDoc) => {
  try {
    const body = await request.json();
    const { title, examType, branchId, classId, section, subjects, status } = body;

    // Validate required fields
    if (!title || !examType || !classId || !subjects || subjects.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate subjects array
    for (const subject of subjects) {
      if (!subject.subjectId || !subject.date || !subject.startTime || !subject.endTime || !subject.duration || !subject.totalMarks || !subject.passingMarks) {
        return NextResponse.json(
          { success: false, message: 'Invalid subject data. All subjects must have subjectId, date, startTime, endTime, duration, totalMarks, and passingMarks' },
          { status: 400 }
        );
      }
    }

    const exam = await Exam.create({
      title,
      examType,
      branchId,
      classId,
      section,
      subjects,
      status: status || 'scheduled',
      createdBy: userDoc._id
    });

    await exam.populate(['branchId', 'classId', 'createdBy']);

    return NextResponse.json({
      success: true,
      message: 'Exam created successfully',
      exam
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create exam' },
      { status: 400 }
    );
  }
}, [requireRole(ROLES.SUPER_ADMIN)]);
