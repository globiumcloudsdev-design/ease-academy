import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Exam from '@/backend/models/Exam';
import Timetable from '@/backend/models/Timetable';
import User from '@/backend/models/User';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import { uploadToCloudinary } from '@/lib/cloudinary';

// GET - List exams for teacher's classes
export const GET = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const examType = searchParams.get('examType');

    // Build query
    const query = { branchId: userDoc.branchId };
    
    // If teacher, only show exams for their classes and subjects
    if (userDoc.role === 'teacher') {
      const teacherId = userDoc._id;
      const timetables = await Timetable.find({
        'periods.teacherId': teacherId,
        status: 'active'
      });

      const teacherAssignments = timetables.reduce((acc, tt) => {
        const classId = tt.classId.toString();
        if (!acc[classId]) acc[classId] = new Set();
        
        tt.periods.forEach(p => {
          if (p.teacherId?.toString() === teacherId.toString() && p.subjectId) {
            acc[classId].add(p.subjectId.toString());
          }
        });
        return acc;
      }, {});

      const teacherClasses = Object.keys(teacherAssignments);

      if (classId) {
        if (!teacherClasses.includes(classId)) {
          return NextResponse.json({ success: false, message: 'Access denied to this class' }, { status: 403 });
        }
        query.classId = classId;
        // Filter by subjects the teacher teaches in this class
        query['subjects.subjectId'] = { $in: Array.from(teacherAssignments[classId]) };
      } else {
        // Filter by any class and subject the teacher teaches
        const subjectFilters = [];
        for (const [cId, sIds] of Object.entries(teacherAssignments)) {
          subjectFilters.push({
            classId: cId,
            'subjects.subjectId': { $in: Array.from(sIds) }
          });
        }
        
        if (subjectFilters.length > 0) {
          query.$or = subjectFilters;
        } else {
          // Teacher has no assignments
          return NextResponse.json({ success: true, exams: [] });
        }
      }
    } else if (classId) {
      query.classId = classId;
    }

    if (status) query.status = status;
    if (examType) query.examType = examType;

    const exams = await Exam.find(query)
      .populate('classId', 'name grade section')
      .populate('subjects.subjectId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch exams' }, { status: 500 });
  }
});

// POST - Create new exam
export const POST = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();
    const body = await request.json();

    const { title, examType, classId, subjects, status } = body;

    if (!title || !examType || !classId || !subjects || subjects.length === 0) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Verify teacher has access to this class
    if (userDoc.role === 'teacher') {
      const teacherClasses = userDoc.teacherProfile?.classes?.map(c => c.classId.toString()) || [];
      if (!teacherClasses.includes(classId)) {
        return NextResponse.json({ success: false, message: 'Access denied to this class' }, { status: 403 });
      }
    }

    const exam = await Exam.create({
      title,
      examType,
      classId,
      branchId: userDoc.branchId,
      subjects,
      status: status || 'scheduled',
      createdBy: userDoc._id,
    });

    return NextResponse.json({ success: true, message: 'Exam created successfully', exam });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ success: false, message: 'Failed to create exam' }, { status: 500 });
  }
});
