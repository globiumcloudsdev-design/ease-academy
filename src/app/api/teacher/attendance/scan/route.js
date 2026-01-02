import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Attendance from '@/backend/models/Attendance';
import User from '@/backend/models/User';
import FeeVoucher from '@/backend/models/FeeVoucher';
import Timetable from '@/backend/models/Timetable';

// POST - Teacher scans QR code for student attendance
async function scanAttendance(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Teachers only.' },
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
    const { qr, date, subjectId, attendanceType } = body;

    console.log('📋 Scan Request:', { qr: typeof qr === 'object' ? JSON.stringify(qr).substring(0, 100) : qr, date, attendanceType });

    if (!qr) {
      console.log('❌ No QR data provided');
      return NextResponse.json(
        { success: false, message: 'QR data is required' },
        { status: 400 }
      );
    }

    // Parse QR data - could be JSON or plain text (registration number)
    let qrData;
    try {
      qrData = typeof qr === 'string' ? JSON.parse(qr) : qr;
    } catch (e) {
      // If not JSON, treat as registration number
      qrData = { registrationNumber: qr };
    }

    console.log('🔍 Parsed QR Data:', qrData);

    // Find student by registration number or ID
    const student = await User.findOne({
      $or: [
        { 'studentProfile.registrationNumber': qrData.registrationNumber },
        { _id: qrData.id || qrData.studentId }
      ],
      role: 'student',
      branchId: authenticatedUser.branchId,
    });

    if (!student) {
      console.log('❌ Student not found with:', { 
        registrationNumber: qrData.registrationNumber, 
        id: qrData.id || qrData.studentId,
        branchId: authenticatedUser.branchId 
      });
      return NextResponse.json(
        { success: false, message: `Student not found in your branch. Reg: ${qrData.registrationNumber || 'N/A'}` },
        { status: 404 }
      );
    }

    console.log('✅ Student found:', student.fullName, student.studentProfile?.registrationNumber);

    const classId = student.studentProfile?.classId;
    const section = student.studentProfile?.section;

    if (!classId) {
      console.log('❌ Student has no class assigned');
      return NextResponse.json(
        { success: false, message: 'Student has no class assigned' },
        { status: 400 }
      );
    }

    // Verify teacher teaches this class/section
    const teacherTimetable = await Timetable.findOne({
      branchId: authenticatedUser.branchId,
      classId: classId,
      ...(section && { section: section }),
      'periods.teacherId': userDoc._id,
      status: 'active'
    });

    if (!teacherTimetable) {
      console.log('❌ Teacher not assigned to this class/section:', { classId, section, teacherId: userDoc._id });
      return NextResponse.json(
        { success: false, message: `You are not assigned to teach this student's class${section ? `/section ${section}` : ''}` },
        { status: 403 }
      );
    }

    console.log('✅ Teacher verified for class/section');

    const attendanceDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate());

    // Determine attendance type and subject
    const type = attendanceType || (subjectId ? 'subject' : 'daily');
    
    // Find or create attendance record
    const query = {
      branchId: authenticatedUser.branchId,
      classId: classId,
      date: startOfDay,
      attendanceType: type,
      ...(section && { section: section }),
      ...(subjectId && { subjectId }),
    };

    let attendance = await Attendance.findOne(query);

    if (!attendance) {
      // Create new attendance record
      attendance = new Attendance({
        ...query,
        markedBy: authenticatedUser.userId,
        records: [],
      });
    }

    // Check if student already marked
    const existingRecordIndex = attendance.records.findIndex(
      r => r.studentId.toString() === student._id.toString()
    );

    if (existingRecordIndex >= 0) {
      // Update existing record
      attendance.records[existingRecordIndex].status = 'present';
      attendance.records[existingRecordIndex].checkInTime = new Date().toISOString();
      attendance.records[existingRecordIndex].markedAt = new Date();
    } else {
      // Add new record
      attendance.records.push({
        studentId: student._id,
        status: 'present',
        checkInTime: new Date().toISOString(),
        markedAt: new Date(),
      });
    }

    await attendance.save();

    console.log('✅ Attendance saved successfully for:', student.fullName);

    // Get fee payment status for current month
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
      profilePhoto: student.profilePhoto,
      hasPaidFees,
      feeStatus
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Attendance recorded successfully', 
      data: { 
        attendance, 
        student: studentDetails,
        alreadyMarked: existingRecordIndex >= 0
      } 
    });
  } catch (error) {
    console.error('Teacher scan attendance error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to record attendance' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(scanAttendance);
