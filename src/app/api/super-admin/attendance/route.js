import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Attendance from '@/backend/models/Attendance';
import Class from '@/backend/models/Class';
import User from '@/backend/models/User';
import Subject from '@/backend/models/Subject';
import Branch from '@/backend/models/Branch';
import Exam from '@/backend/models/Exam';
import Event from '@/backend/models/Event';
import Timetable from '@/backend/models/Timetable';

// GET - Get all attendance records for super admin (all branches)
async function getAttendance(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const attendanceType = searchParams.get('attendanceType');

    console.log('API Route - Received parameters:');
    console.log('  date:', date);
    console.log('  limit:', limit, 'page:', page);
    console.log('  branchId:', branchId, 'classId:', classId);

    // Build query - can filter by branch or show all
    const query = {};

    if (branchId) {
      query.branchId = branchId;
    }

    if (classId) {
      query.classId = classId;
    }

    if (attendanceType) {
      query.attendanceType = attendanceType;
    }

    // Handle date filtering
    if (date) {
      // Specific date
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
      query.date = { $gte: startOfDay, $lt: endOfDay };

      console.log('API Route - Date filtering applied:');
      console.log('  targetDate:', targetDate.toISOString());
      console.log('  startOfDay:', startOfDay.toISOString());
      console.log('  endOfDay:', endOfDay.toISOString());
      console.log('  query.date:', query.date);
    } else if (fromDate && toDate) {
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
        .populate('branchId', 'name code')
        .populate('classId', 'name code')
        .populate('subjectId', 'name code')
        .populate('eventId', 'title startDate')
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

    console.log('API Route - Query results:');
    console.log('  Total records found:', total);
    console.log('  Records returned:', attendance.length);
    console.log('  Query used:', JSON.stringify(query, null, 2));

    if (attendance.length > 0) {
      console.log('  Sample record date:', attendance[0].date);
      console.log('  Sample record records count:', attendance[0].records?.length || 0);
    }

    // Calculate statistics for each attendance
    const attendanceWithStats = attendance.map((att) => {
      const totalStudents = att.records.length;
      const presentCount = att.records.filter((r) => r.status === 'present').length;
      const absentCount = att.records.filter((r) => r.status === 'absent').length;
      const lateCount = att.records.filter((r) => r.status === 'late').length;
      const excusedCount = att.records.filter((r) => r.status === 'excused').length;
      const attendancePercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : 0;

      return {
        ...att,
        statistics: {
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendancePercentage,
        },
      };
    });

    console.log('Returning attendance data:', {
      total,
      attendanceCount: attendanceWithStats.length,
      sampleRecord: attendanceWithStats[0] ? {
        _id: attendanceWithStats[0]._id,
        date: attendanceWithStats[0].date,
        recordsCount: attendanceWithStats[0].records?.length || 0,
        firstRecord: attendanceWithStats[0].records?.[0] ? {
          studentId: attendanceWithStats[0].records[0].studentId?._id,
          studentName: attendanceWithStats[0].records[0].studentId?.fullName,
          status: attendanceWithStats[0].records[0].status
        } : null
      } : null
    });

    return NextResponse.json({
      success: true,
      data: {
        attendance: attendanceWithStats,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST - Create new attendance record
async function createAttendance(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      branchId,
      classId,
      subjectId,
      eventId,
      date,
      attendanceType = 'daily',
      records
    } = body;

    // Validate required fields
    if (!branchId || !classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate attendance type specific requirements
    if (attendanceType === 'subject' && !subjectId) {
      return NextResponse.json(
        { success: false, message: 'Subject ID required for subject attendance' },
        { status: 400 }
      );
    }

    if (attendanceType === 'event' && !eventId) {
      return NextResponse.json(
        { success: false, message: 'Event ID required for event attendance' },
        { status: 400 }
      );
    }

    // Check if attendance already exists for this date/class/type
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    const existingQuery = {
      branchId,
      classId,
      date: { $gte: startOfDay, $lt: endOfDay },
      attendanceType
    };

    if (attendanceType === 'subject') {
      existingQuery.subjectId = subjectId;
    }

    if (attendanceType === 'event') {
      existingQuery.eventId = eventId;
    }

    const existingAttendance = await Attendance.findOne(existingQuery);
    
    if (existingAttendance) {
      // Update existing attendance records
      existingAttendance.records = records;
      existingAttendance.markedBy = authenticatedUser.userId;
      await existingAttendance.save();

      await existingAttendance.populate([
        { path: 'branchId', select: 'name code' },
        { path: 'classId', select: 'name code' },
        { path: 'subjectId', select: 'name code' },
        { path: 'eventId', select: 'title startDate' },
        { path: 'markedBy', select: 'fullName email' }
      ]);

      return NextResponse.json({
        success: true,
        message: 'Attendance updated successfully',
        data: existingAttendance
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      branchId,
      classId,
      subjectId: attendanceType === 'subject' ? subjectId : null,
      eventId: attendanceType === 'event' ? eventId : null,
      date: startOfDay,
      attendanceType,
      records,
      markedBy: authenticatedUser.userId,
    });

    await attendance.save();

    // Populate the saved record for response
    await attendance.populate([
      { path: 'branchId', select: 'name code' },
      { path: 'classId', select: 'name code' },
      { path: 'subjectId', select: 'name code' },
      { path: 'eventId', select: 'title startDate' },
      { path: 'markedBy', select: 'fullName email' }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Attendance created successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create attendance' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAttendance);
export const POST = withAuth(createAttendance);