import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Attendance from '@/backend/models/Attendance';
import User from '@/backend/models/User';

async function scanAttendance(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json({ success: false, message: 'No branch assigned' }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const qr = body.qr || body;

    console.log('Scanned QR payload:', qr);

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

    // ensure student belongs to this branch
    if (!student.branchId || student.branchId.toString() !== authenticatedUser.branchId.toString()) {
      return NextResponse.json({ success: false, message: 'Student does not belong to your branch' }, { status: 400 });
    }

    const classId = qr.classId || student.studentProfile?.classId;
    if (!classId) {
      return NextResponse.json({ success: false, message: 'Class information missing' }, { status: 400 });
    }

    const date = body.date ? new Date(body.date) : new Date();
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    // Build query for existing attendance respecting attendanceType/subject/event
    const query = {
      branchId: authenticatedUser.branchId,
      classId,
      date: day,
    };

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

    // Find or create attendance for this branch/class/date and requested type
    let attendance = await Attendance.findOne(query);
    if (!attendance) {
      // Use atomic upsert to avoid race/duplicate key issues
      attendance = await Attendance.findOneAndUpdate(
        query,
        {
          $setOnInsert: {
            branchId: authenticatedUser.branchId,
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

    return NextResponse.json({ success: true, message: 'Attendance recorded', data: { attendance, student } });
  } catch (error) {
    console.error('Scan attendance error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to record attendance' }, { status: 500 });
  }
}

export const POST = withAuth(scanAttendance);
