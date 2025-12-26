import { NextResponse } from 'next/server';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * GET /api/employee-attendance/summary
 * Get attendance summary for a user
 * Access: All authenticated users (own), Admins (all users)
 */
async function summaryHandler(request, user, userDoc) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = parseInt(searchParams.get('month'));
    const year = parseInt(searchParams.get('year'));

    const currentUser = user;

    // Validation
    if (!month || !year) {
      return NextResponse.json(
        { success: false, error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Determine which user's summary to fetch
    let targetUserId = userId || currentUser._id;

    // Permission check
    if (userId && userId !== currentUser._id.toString()) {
      if (currentUser.role === 'teacher' || currentUser.role === 'student') {
        return NextResponse.json(
          { success: false, error: 'You can only view your own attendance summary' },
          { status: 403 }
        );
      }
      
      if (currentUser.role === 'branch_admin') {
        // Verify user belongs to same branch
        const User = (await import('@/backend/models/User')).default;
        const targetUser = await User.findById(userId);
        if (!targetUser || targetUser.branchId.toString() !== currentUser.branchId.toString()) {
          return NextResponse.json(
            { success: false, error: 'You can only view attendance for users in your branch' },
            { status: 403 }
          );
        }
      }
    }

    // Get monthly summary using static method
    const summary = await EmployeeAttendance.getMonthlySummary(targetUserId, month, year);

    // Get working days in month
    const workingDays = EmployeeAttendance.getWorkingDaysCount(month, year);

    // Calculate attendance percentage
    const attendancePercentage = workingDays > 0 
      ? ((summary.presentDays / workingDays) * 100).toFixed(2)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        workingDays,
        attendancePercentage: parseFloat(attendancePercentage),
        month,
        year,
      },
    });
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(summaryHandler);
