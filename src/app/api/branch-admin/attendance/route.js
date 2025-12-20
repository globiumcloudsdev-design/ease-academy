import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Attendance from '@/backend/models/Attendance';
import Class from '@/backend/models/Class';
import User from '@/backend/models/User';
import Subject from '@/backend/models/Subject';
import Branch from '@/backend/models/Branch';

// GET - Get all attendance records for branch admin's branch
async function getAttendance(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const classId = searchParams.get('classId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const attendanceType = searchParams.get('attendanceType');

    // Build query - only for this branch
    const query = { branchId: authenticatedUser.branchId };
    
    if (classId) {
      query.classId = classId;
    }

    if (attendanceType) {
      query.attendanceType = attendanceType;
    }

    if (fromDate && toDate) {
      query.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    } else if (fromDate) {
      query.date = { $gte: new Date(fromDate) };
    } else if (toDate) {
      query.date = { $lte: new Date(toDate) };
    }

    const skip = (page - 1) * limit;

    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('classId', 'name code')
        .populate('subjectId', 'name code')
        .populate('markedBy', 'fullName email')
        .populate({
          path: 'records.studentId',
          model: 'User',
          select: 'fullName firstName lastName email phone studentProfile branchId',
          populate: {
            path: 'branchId',
            model: 'Branch',
            select: 'name'
          }
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(query),
    ]);

    // Calculate statistics for each attendance
    const attendanceWithStats = attendance.map((att) => {
      const totalStudents = att.records.length;
      const presentCount = att.records.filter((r) => r.status === 'present').length;
      const absentCount = att.records.filter((r) => r.status === 'absent').length;
      const lateCount = att.records.filter((r) => r.status === 'late').length;
      const attendancePercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : 0;

      return {
        ...att,
        statistics: {
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          attendancePercentage,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        attendance: attendanceWithStats,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST - Mark attendance
async function markAttendance(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
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
    
    // Validate class belongs to branch
    const classDoc = await Class.findOne({
      _id: body.classId,
      branchId: authenticatedUser.branchId,
    });

    if (!classDoc) {
      return NextResponse.json(
        { success: false, message: 'Class not found or does not belong to your branch' },
        { status: 404 }
      );
    }

    // Check if attendance already exists for this date and class
    const existingAttendance = await Attendance.findOne({
      branchId: authenticatedUser.branchId,
      classId: body.classId,
      date: new Date(body.date),
    });

    if (existingAttendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance already marked for this date and class' },
        { status: 400 }
      );
    }

    const attendance = new Attendance({
      ...body,
      branchId: authenticatedUser.branchId,
      markedBy: authenticatedUser.userId,
    });

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance },
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAttendance);
export const POST = withAuth(markAttendance);
