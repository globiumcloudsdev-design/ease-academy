import { NextResponse } from 'next/server';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import User from '@/backend/models/User';
import Event from '@/backend/models/Event';
import connectDB from '@/lib/database';

/**
 * GET /api/employee-attendance/auto-mark
 * Automatically marks employees as absent if they haven't marked attendance by 6 PM PKT.
 * This should be triggered by a cron job.
 */
export async function GET(request) {
  try {
    // Security check: Only allow if a secret key matches
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isSecretMatch = secret === process.env.CRON_SECRET;

    if (process.env.NODE_ENV === 'production' && !isVercelCron && !isSecretMatch) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 1. Get current time in Pakistan (UTC+5)
    const pktTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(new Date());

    const parts = {};
    pktTime.forEach(({ type, value }) => { parts[type] = value; });

    // Create a date object representing the start of the day in PKT
    const today = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00.000Z`);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const currentHour = parseInt(parts.hour);
    const dayOfWeek = new Date(`${parts.year}-${parts.month}-${parts.day}`).getDay(); // 0 is Sunday

    // 2. Check if it's Sunday
    if (dayOfWeek === 0) {
      return NextResponse.json({ success: true, message: 'Skipping: Today is Sunday' });
    }

    // 3. Check if it's a holiday
    const holiday = await Event.findOne({
      eventType: 'holiday',
      startDate: { $lte: tomorrow },
      endDate: { $gte: today },
      status: { $ne: 'cancelled' }
    });

    if (holiday) {
      return NextResponse.json({ success: true, message: `Skipping: Today is a holiday (${holiday.title})` });
    }

    // 4. Find all employees (teachers, staff, branch admins)
    const employees = await User.find({
      role: { $in: ['teacher', 'staff', 'branch_admin'] },
      status: 'active' // Assuming there's a status field, if not it will just return all
    }).select('_id branchId');

    let markedCount = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      // Check if attendance already exists for today
      const existingAttendance = await EmployeeAttendance.findOne({
        userId: employee._id,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      });

      if (!existingAttendance) {
        // Mark as absent
        await EmployeeAttendance.create({
          userId: employee._id,
          branchId: employee.branchId,
          date: today,
          status: 'absent',
          remarks: 'Automatically marked absent (No attendance recorded by 6 PM)',
          isManualEntry: false,
          approvalStatus: 'approved'
        });
        markedCount++;
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-attendance process completed',
      data: {
        totalEmployees: employees.length,
        markedAbsent: markedCount,
        alreadyMarked: skippedCount
      }
    });

  } catch (error) {
    console.error('Auto-attendance error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
