import { NextResponse } from 'next/server';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * GET /api/employee-attendance/reports
 * Get attendance reports and analytics
 * Access: Super Admin, Branch Admin
 */
async function reportsHandler(request, user, userDoc) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const month = parseInt(searchParams.get('month'));
    const year = parseInt(searchParams.get('year'));
    const reportType = searchParams.get('type') || 'summary'; // summary, detailed, comparison

    const currentUser = user;

    // Validation
    if (!month || !year) {
      return NextResponse.json(
        { success: false, error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Build query
    let query = {};
    
    if (currentUser.role === 'branch_admin') {
      query.branchId = currentUser.branchId;
    } else if (currentUser.role === 'super_admin') {
      if (branchId && branchId !== 'all') {
        query.branchId = branchId;
      }
    }

    // Date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    query.date = { $gte: startDate, $lte: endDate };

    if (reportType === 'summary') {
      // Overall summary
      const records = await EmployeeAttendance.find(query);

      const summary = {
        totalEmployees: new Set(records.map(r => r.userId.toString())).size,
        totalRecords: records.length,
        presentDays: records.filter(r => r.status === 'present').length,
        absentDays: records.filter(r => r.status === 'absent').length,
        lateDays: records.filter(r => r.status === 'late').length,
        halfDays: records.filter(r => r.status === 'half-day').length,
        leaveDays: records.filter(r => r.status === 'leave').length,
        totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
        totalOvertimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
        averageAttendancePercentage: 0,
      };

      const workingDays = EmployeeAttendance.getWorkingDaysCount(month, year);
      if (summary.totalEmployees > 0 && workingDays > 0) {
        summary.averageAttendancePercentage = (
          (summary.presentDays / (summary.totalEmployees * workingDays)) * 100
        ).toFixed(2);
      }

      return NextResponse.json({
        success: true,
        data: summary,
        reportType,
        month,
        year,
      });
    }

    if (reportType === 'detailed') {
      // Detailed per-employee report
      const records = await EmployeeAttendance.find(query)
        .populate('userId', 'firstName lastName email phone')
        .populate('branchId', 'name code')
        .sort({ userId: 1, date: 1 })
        .lean();

      // Group by user
      const userMap = {};
      records.forEach(record => {
        const userId = record.userId._id.toString();
        if (!userMap[userId]) {
          userMap[userId] = {
            user: record.userId,
            branch: record.branchId,
            records: [],
            summary: {
              totalDays: 0,
              presentDays: 0,
              absentDays: 0,
              lateDays: 0,
              halfDays: 0,
              leaveDays: 0,
              totalWorkingHours: 0,
              totalOvertimeHours: 0,
            },
          };
        }
        userMap[userId].records.push(record);
        userMap[userId].summary.totalDays++;
        userMap[userId].summary[`${record.status}Days`]++;
        userMap[userId].summary.totalWorkingHours += record.workingHours || 0;
        userMap[userId].summary.totalOvertimeHours += record.overtimeHours || 0;
      });

      const detailedReport = Object.values(userMap);

      return NextResponse.json({
        success: true,
        data: detailedReport,
        reportType,
        month,
        year,
      });
    }

    if (reportType === 'comparison') {
      // Month-over-month comparison
      const currentMonthRecords = await EmployeeAttendance.find(query);
      
      // Previous month
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
      const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);
      
      const prevQuery = { ...query, date: { $gte: prevStartDate, $lte: prevEndDate } };
      const prevMonthRecords = await EmployeeAttendance.find(prevQuery);

      const calculateMetrics = (records) => ({
        totalRecords: records.length,
        presentDays: records.filter(r => r.status === 'present').length,
        absentDays: records.filter(r => r.status === 'absent').length,
        lateDays: records.filter(r => r.status === 'late').length,
        avgWorkingHours: records.length > 0 
          ? (records.reduce((sum, r) => sum + (r.workingHours || 0), 0) / records.length).toFixed(2)
          : 0,
      });

      const currentMetrics = calculateMetrics(currentMonthRecords);
      const previousMetrics = calculateMetrics(prevMonthRecords);

      return NextResponse.json({
        success: true,
        data: {
          current: { ...currentMetrics, month, year },
          previous: { ...previousMetrics, month: prevMonth, year: prevYear },
          changes: {
            totalRecords: currentMetrics.totalRecords - previousMetrics.totalRecords,
            presentDays: currentMetrics.presentDays - previousMetrics.presentDays,
            absentDays: currentMetrics.absentDays - previousMetrics.absentDays,
            lateDays: currentMetrics.lateDays - previousMetrics.lateDays,
          },
        },
        reportType,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid report type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(reportsHandler, [requireRole(['super_admin', 'branch_admin'])]);
