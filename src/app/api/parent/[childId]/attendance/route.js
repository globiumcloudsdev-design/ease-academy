import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Attendance from '@/backend/models/Attendance';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const child = await User.findById(childId).lean();
    if (!child || !child.studentProfile?.classId) {
      return NextResponse.json({ success: true, attendance: [] });
    }

    // Fetch attendance records for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await Attendance.find({
      classId: child.studentProfile.classId,
      date: { $gte: thirtyDaysAgo },
      'records.studentId': childId,
    })
      .populate('subjectId', 'name')
      .sort({ date: -1 })
      .lean();

    const attendanceData = [];
    attendanceRecords.forEach(record => {
      const studentRecord = record.records.find(r => r.studentId.toString() === childId);
      if (studentRecord) {
        attendanceData.push({
          date: record.date,
          status: studentRecord.status,
          attendanceType: record.attendanceType,
          subject: record.subjectId?.name,
          checkInTime: studentRecord.checkInTime,
          remarks: studentRecord.remarks,
        });
      }
    });

    // Calculate summary
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(a => a.status === 'present').length;
    const absentDays = attendanceData.filter(a => a.status === 'absent').length;
    const lateDays = attendanceData.filter(a => a.status === 'late').length;
    const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    return NextResponse.json({ 
      success: true, 
      attendance: attendanceData,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch attendance' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
