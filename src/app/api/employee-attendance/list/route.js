import { NextResponse } from 'next/server';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import User from '@/backend/models/User';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * GET /api/employee-attendance/list
 * Get employee attendance records with filters
 * Access: All authenticated users (see own), Admins (see all)
 */
async function listAttendanceHandler(request, user, userDoc) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;

    const currentUser = user;

    // Build query
    let query = {};

    // Role-based access
    if (currentUser.role === 'teacher' || currentUser.role === 'student') {
      // Users can only see their own attendance
      query.userId = currentUser._id;
    } else if (currentUser.role === 'branch_admin') {
      // Branch admin can see their branch
      query.branchId = currentUser.branchId;
      if (userId) query.userId = userId;
    } else if (currentUser.role === 'super_admin') {
      // Super admin can see all
      if (userId) query.userId = userId;
      if (branchId && branchId !== 'all') query.branchId = branchId;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date filters
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const start = new Date(yearNum, monthNum - 1, 1);
      const end = new Date(yearNum, monthNum, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get total count
    const total = await EmployeeAttendance.countDocuments(query);

    // Get attendance records
    const attendanceRecords = await EmployeeAttendance.find(query)
      .populate('userId', 'firstName lastName email phone profilePicture')
      .populate('branchId', 'name code')
      .populate('markedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: attendanceRecords,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('List attendance error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(listAttendanceHandler);
