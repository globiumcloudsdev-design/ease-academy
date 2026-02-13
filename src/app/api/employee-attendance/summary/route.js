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
    const branchId = searchParams.get('branchId');
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

    const currentUserId = currentUser._id ? currentUser._id.toString() : null;

    // For super_admin with branch filter, get summary for all employees in branch
    if (currentUser.role === 'super_admin' && branchId && branchId !== 'all' && !userId) {
      // Import User model
      const User = (await import('@/backend/models/User')).default;
      
      // Get all employees in the branch (teachers and staff)
      const employees = await User.find({
        role: { $in: ['teacher', 'staff'] },
        branchId: branchId,
        isActive: true,
      }).select('_id');

      const employeeIds = employees.map(emp => emp._id);

      if (employeeIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            totalEmployees: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            leaveCount: 0,
            attendanceRate: 0,
            totalWorkingHours: 0,
            averageWorkingHours: 0,
            workingDays: EmployeeAttendance.getWorkingDaysCount(month, year),
            month,
            year,
          },
        });
      }

      // Get date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get all attendance records for employees in this branch for the month
      const attendanceRecords = await EmployeeAttendance.find({
        userId: { $in: employeeIds },
        date: { $gte: startDate, $lte: endDate },
      });

      // Calculate working days
      const workingDays = EmployeeAttendance.getWorkingDaysCount(month, year);

      // Get unique employees who have attendance records
      const employeesWithRecords = new Set(attendanceRecords.map(r => r.userId.toString()));

      // Calculate stats
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
      const leaveCount = attendanceRecords.filter(r => r.status === 'leave').length;
      const halfDayCount = attendanceRecords.filter(r => r.status === 'half-day').length;

      const totalWorkingHours = attendanceRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
      const totalEmployees = employees.length;

      const attendancePercentage = totalEmployees > 0 && workingDays > 0
        ? ((presentCount + (halfDayCount * 0.5)) / (totalEmployees * workingDays) * 100).toFixed(2)
        : 0;

      return NextResponse.json({
        success: true,
        data: {
          totalEmployees,
          presentCount,
          absentCount,
          lateCount,
          leaveCount: leaveCount + halfDayCount,
          attendanceRate: parseFloat(attendancePercentage) || 0,
          totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
          averageWorkingHours: totalEmployees > 0 ? parseFloat((totalWorkingHours / totalEmployees).toFixed(2)) : 0,
          workingDays,
          month,
          year,
        },
      });
    }

    // For single user summary (existing behavior)
    let targetUserId = userId || currentUserId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Permission check
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
