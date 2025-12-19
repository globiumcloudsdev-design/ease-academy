import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/backend/models/Attendance';
import User from '@/backend/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: childId } = params;

    const parent = await User.findById(session.user.id);
    if (!parent || !parent.parentProfile.children.some(c => c.id.toString() === childId)) {
      return NextResponse.json({ error: 'Unauthorized access to child' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange'); // e.g., 'last30days'

    let query = { 'records.studentId': childId };
    if (dateRange === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo };
    }

    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('classId', 'name')
      .populate('subjectId', 'name');

    // Extract the child's record from each attendance
    const attendance = attendanceRecords.map(att => {
      const record = att.records.find(r => r.studentId.toString() === childId);
      return {
        date: att.date,
        status: record.status,
        remarks: record.remarks,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        class: att.classId?.name,
        subject: att.subjectId?.name,
        attendanceType: att.attendanceType,
      };
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Get child attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
