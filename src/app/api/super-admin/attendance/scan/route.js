import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Attendance from '@/backend/models/Attendance';
import User from '@/backend/models/User';

async function scanAttendance(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const qr = body.qr || body;

    if (!qr || (!qr.id && !qr.registrationNumber)) {
      return NextResponse.json({ success: false, message: 'Invalid QR payload' }, { status: 400 });
    }

    // find student by id or registration number
    const student = await User.findOne({
      role: 'student',
      $or: [
        { _id: qr.id },
        { 'studentProfile.registrationNumber': qr.registrationNumber }
      ]
    }).lean();

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const classId = qr.classId || student.studentProfile?.classId;
    const branchId = qr.branchId || student.branchId;
    if (!classId || !branchId) {
      return NextResponse.json({ success: false, message: 'Class or branch information missing' }, { status: 400 });
    }

    const date = body.date ? new Date(body.date) : new Date();
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Build query for attendance respecting attendanceType/subject/event
    const query = { branchId, classId, date: day };
    const requestedType = body.attendanceType || 'daily';
    if (requestedType === 'event') {
      if (!body.eventId) {
        return NextResponse.json({ success: false, message: 'eventId is required for event attendance' }, { status: 400 });
      }
      query.attendanceType = 'event';
      query.eventId = body.eventId;
    } else if (requestedType === 'subject') {
      if (!body.subjectId) {
        return NextResponse.json({ success: false, message: 'subjectId is required for subject attendance' }, { status: 400 });
      }
      query.attendanceType = 'subject';
      query.subjectId = body.subjectId;
    } else {
      query.attendanceType = 'daily';
    }

    // Find or create (atomic upsert)
    let attendance = await Attendance.findOne(query);
    if (!attendance) {
      attendance = await Attendance.findOneAndUpdate(
        query,
        {
          $setOnInsert: {
            branchId,
            classId,
            date: day,
            attendanceType: query.attendanceType,
            subjectId: query.subjectId || undefined,
            eventId: query.eventId || undefined,
            records: [],
            markedBy: authenticatedUser.userId,
          },
        },
        { new: true, upsert: true }
      );
    }

    const studentId = student._id.toString();
    const existingIndex = attendance.records.findIndex(r => r.studentId.toString() === studentId);
    if (existingIndex >= 0) {
      attendance.records[existingIndex].status = 'present';
      attendance.records[existingIndex].checkInTime = new Date().toISOString();
    } else {
      attendance.records.push({ studentId: student._id, status: 'present', checkInTime: new Date().toISOString() });
    }

    await attendance.save();

    // Get fee payment status for current month
    const FeeVoucher = (await import('@/backend/models/FeeVoucher')).default;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const feeVoucher = await FeeVoucher.findOne({
      studentId: student._id,
      month: currentMonth,
      year: currentYear,
      status: { $in: ['paid', 'partial'] }
    }).lean();
    
    const hasPaidFees = !!feeVoucher;
    const feeStatus = feeVoucher ? feeVoucher.status : 'unpaid';
    
    // Populate full student details
    const studentDetails = {
      _id: student._id,
      fullName: student.fullName,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      registrationNumber: student.studentProfile?.registrationNumber,
      rollNumber: student.studentProfile?.rollNumber,
      section: student.studentProfile?.section,
      hasPaidFees,
      feeStatus
    };

    return NextResponse.json({ success: true, message: 'Attendance recorded', data: { attendance, student: studentDetails } });
  } catch (error) {
    console.error('Super scan attendance error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to record attendance' }, { status: 500 });
  }
}

export const POST = withAuth(scanAttendance);
