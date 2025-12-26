import { NextResponse } from 'next/server';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * GET /api/employee-attendance/today
 * Get today's attendance status for current user
 * Access: All authenticated users
 */
async function todayAttendanceHandler(request, user, userDoc) {
  try {
    await connectDB();

    const currentUser = user;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance
    const attendance = await EmployeeAttendance.findOne({
      userId: currentUser._id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate('markedBy', 'firstName lastName')
      .lean();

    if (!attendance) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No attendance record for today',
      });
    }

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Today attendance error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(todayAttendanceHandler);
