import { NextResponse } from 'next/server';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * POST /api/employee-attendance/mark
 * Mark employee attendance (for admins)
 * Access: Super Admin, Branch Admin
 */
async function markAttendanceHandler(request, user, userDoc) {
  try {
    await connectDB();

    const {
      userId,
      date,
      status,
      leaveType,
      leaveReason,
      remarks,
      checkInTime,
      checkOutTime,
      checkInLocation,
      checkOutLocation,
    } = await request.json();

    const currentUser = user;

    // Validation
    if (!userId || !date || !status) {
      return NextResponse.json(
        { success: false, error: 'User ID, date, and status are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Branch admin can only mark attendance for their branch
    if (currentUser.role === 'branch_admin' && targetUser.branchId.toString() !== currentUser.branchId.toString()) {
      return NextResponse.json(
        { success: false, error: 'You can only mark attendance for users in your branch' },
        { status: 403 }
      );
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existingAttendance = await EmployeeAttendance.findOne({
      userId,
      date: attendanceDate,
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.leaveType = leaveType;
      existingAttendance.leaveReason = leaveReason;
      existingAttendance.remarks = remarks;
      existingAttendance.isManualEntry = true;
      existingAttendance.markedBy = currentUser._id;
      existingAttendance.isEdited = true;
      
      if (checkInTime) {
        existingAttendance.checkIn = {
          ...existingAttendance.checkIn,
          time: new Date(checkInTime),
          location: checkInLocation || existingAttendance.checkIn?.location,
        };
      }

      if (checkOutTime) {
        existingAttendance.checkOut = {
          ...existingAttendance.checkOut,
          time: new Date(checkOutTime),
          location: checkOutLocation || existingAttendance.checkOut?.location,
        };
      }

      existingAttendance.editHistory.push({
        editedBy: currentUser._id,
        editedAt: new Date(),
        changes: `Status changed to ${status}. ${remarks || ''}`,
      });

      await existingAttendance.save();

      return NextResponse.json({
        success: true,
        message: 'Attendance updated successfully',
        data: existingAttendance,
      });
    }

    // Create new attendance record
    const attendance = new EmployeeAttendance({
      userId,
      branchId: user.branchId,
      date: attendanceDate,
      status,
      leaveType,
      leaveReason,
      remarks,
      markedBy: currentUser._id,
      isManualEntry: true,
    });

    if (checkInTime) {
      attendance.checkIn = {
        time: new Date(checkInTime),
        location: checkInLocation,
      };
    }

    if (checkOutTime) {
      attendance.checkOut = {
        time: new Date(checkOutTime),
        location: checkOutLocation,
      };
    }

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(markAttendanceHandler, [requireRole(['super_admin', 'branch_admin'])]);
