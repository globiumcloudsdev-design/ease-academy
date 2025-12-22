import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Exam from '@/backend/models/Exam';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import Branch from '@/backend/models/Branch';
import User from '@/backend/models/User';
import Notification from '@/backend/models/Notification';
import { sendEmail } from '@/backend/utils/emailService';
import { getStudentEmailTemplate } from '@/backend/templates/studentEmail';
import { getParentEmailTemplate } from '@/backend/templates/parentEmail';

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
      query['subjects.subjectId'] = subjectId;
    }

    if (examType) {
      query.examType = examType;
    }

    if (fromDate && toDate) {
      query['subjects.date'] = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    } else if (fromDate) {
      query['subjects.date'] = { $gte: new Date(fromDate) };
    } else if (toDate) {
      query['subjects.date'] = { $lte: new Date(toDate) };
    }

    const skip = (page - 1) * limit;

    const [exams, total] = await Promise.all([
      Exam.find(query)
        .populate('classId', 'name code')
        .populate('subjects.subjectId', 'name code')
        .populate('createdBy', 'fullName email')
        .sort({ 'subjects.0.date': -1 })
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

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'examType', 'classId', 'subjects'];
    const missingFields = requiredFields.filter(field => !body[field] || (Array.isArray(body[field]) && body[field].length === 0));

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate subjects array
    if (!Array.isArray(body.subjects) || body.subjects.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one subject must be selected' },
        { status: 400 }
      );
    }

    // Validate each subject
    for (let i = 0; i < body.subjects.length; i++) {
      const subject = body.subjects[i];
      const subjectRequiredFields = ['subjectId', 'date', 'startTime', 'endTime', 'duration', 'totalMarks', 'passingMarks'];
      const missingSubjectFields = subjectRequiredFields.filter(field => !subject[field] || subject[field] === '');

      if (missingSubjectFields.length > 0) {
        return NextResponse.json(
          { success: false, message: `Subject ${i + 1}: Missing required fields: ${missingSubjectFields.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate subject exists
      const subjectDoc = await Subject.findById(subject.subjectId);
      if (!subjectDoc) {
        return NextResponse.json(
          { success: false, message: `Subject ${i + 1}: Subject not found` },
          { status: 404 }
        );
      }

      // Validate date
      const examDate = new Date(subject.date);
      if (isNaN(examDate.getTime())) {
        return NextResponse.json(
          { success: false, message: `Subject ${i + 1}: Invalid exam date` },
          { status: 400 }
        );
      }

      // Optional: Check if date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (examDate < today) {
        return NextResponse.json(
          { success: false, message: `Subject ${i + 1}: Exam date cannot be in the past` },
          { status: 400 }
        );
      }
    }
    
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

    const exam = new Exam({
      title: body.title,
      examType: body.examType,
      branchId: authenticatedUser.branchId,
      classId: body.classId,
      subjects: body.subjects,
      status: body.status || 'scheduled',
      createdBy: authenticatedUser.userId,
    });

    await exam.save();

    // Get all students in the class
    const students = await User.find({
      'studentProfile.classId': body.classId,
      role: 'student',
      status: 'active'
    }).populate('studentProfile.classId', 'name code');

    // Get subject names for the email
    const subjectIds = body.subjects.map(s => s.subjectId);
    const subjects = await Subject.find({ _id: { $in: subjectIds } }).select('name');
    const subjectNames = body.subjects.map(s => {
      const subject = subjects.find(sub => sub._id.toString() === s.subjectId.toString());
      return subject ? subject.name : 'Subject';
    }).join(', ');

    // Create notifications and send emails for each student
    const notificationPromises = students.map(async (student) => {
      const studentName = `${student.firstName} ${student.lastName}`;
      const examDate = new Date(body.subjects[0].date).toLocaleDateString();

      // Create notification for student
      await Notification.create({
        type: 'exam',
        title: 'New Exam Scheduled',
        message: `A new ${body.examType} exam "${body.title}" has been scheduled for ${examDate}. Subjects: ${subjectNames}`,
        targetUser: student._id,
        metadata: {
          examId: exam._id,
          examTitle: body.title,
          examType: body.examType,
          examDate: body.subjects[0].date,
          subjects: body.subjects,
          classId: body.classId
        }
      });

      // Send email to student
      if (student.email) {
        const studentEmailHtml = getStudentEmailTemplate('exam_scheduled', {
          studentName,
          examTitle: body.title,
          examType: body.examType,
          examDate,
          subjectNames,
          className: classDoc.name,
          schoolName: 'Ease Academy'
        });
        await sendEmail(student.email, `New Exam Scheduled - ${body.title}`, studentEmailHtml);
      }

      // Send email to parent/guardian
      const parentEmail = student.studentProfile?.father?.email ||
                         student.studentProfile?.mother?.email ||
                         student.studentProfile?.guardian?.email;
      const parentName = student.studentProfile?.father?.name ||
                        student.studentProfile?.mother?.name ||
                        student.studentProfile?.guardian?.name;

      if (parentEmail) {
        const parentEmailHtml = getParentEmailTemplate('CHILD_EXAM_SCHEDULED', {
          firstName: parentName || 'Parent',
          childName: studentName,
          examTitle: body.title,
          examType: body.examType,
          examDate,
          subjectNames,
          className: classDoc.name,
          schoolName: 'Ease Academy'
        });
        await sendEmail(parentEmail, `Exam Scheduled for ${studentName} - ${body.title}`, parentEmailHtml);

        // Create notification for parent if they have account
        const parentUser = await User.findOne({ email: parentEmail, role: 'parent' });
        if (parentUser) {
          await Notification.create({
            type: 'exam',
            title: `Exam Scheduled - ${studentName}`,
            message: `A new ${body.examType} exam "${body.title}" has been scheduled for your child ${studentName} on ${examDate}. Subjects: ${subjectNames}`,
            targetUser: parentUser._id,
            childId: student._id,
            metadata: {
              examId: exam._id,
              examTitle: body.title,
              examType: body.examType,
              examDate: body.subjects[0].date,
              subjects: body.subjects,
              classId: body.classId
            }
          });
        }
      }
    });

    // Execute all notification and email promises
    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      message: 'Exam created successfully. Notifications sent to students and parents.',
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
