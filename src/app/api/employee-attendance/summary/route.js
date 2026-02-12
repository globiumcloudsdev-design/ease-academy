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
    let targetUserId = userId || (currentUser._id ? currentUser._id.toString() : null);

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Permission check
    const currentUserId = currentUser._id ? currentUser._id.toString() : null;
    if (userId && currentUserId && userId !== currentUserId) {
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
        const currentBranchId = currentUser.branchId ? currentUser.branchId.toString() : null;
        const targetBranchId = targetUser?.branchId ? targetUser.branchId.toString() : null;
        
        if (!targetUser || (targetBranchId && currentBranchId && targetBranchId !== currentBranchId)) {
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
        totalEmployees: 1,
        presentCount: summary.presentDays || 0,
        absentCount: summary.absentDays || 0,
        lateCount: summary.lateDays || 0,
        leaveCount: summary.leaveDays || 0,
        attendanceRate: parseFloat(attendancePercentage) || 0,
        totalWorkingHours: summary.totalWorkingHours || 0,
        averageWorkingHours: parseFloat(summary.averageWorkingHours) || 0,
        workingDays,
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
