import { NextResponse } from 'next/server';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * POST /api/employee-attendance/check-out
 * Mark employee check-out with location
 * Access: All authenticated users
 */
async function checkOutHandler(request, user, userDoc) {
  try {
    await connectDB();

    const { latitude, longitude, address, device } = await request.json();
    const currentUser = user;

    // Get user's IP address
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Validation
    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'Location (latitude and longitude) is required' },
        { status: 400 }
      );
    }

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await EmployeeAttendance.findOne({
      userId: currentUser._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: 'No check-in record found for today. Please check in first.' },
        { status: 404 }
      );
    }

    if (!attendance.checkIn?.time) {
      return NextResponse.json(
        { success: false, error: 'Please check in first before checking out.' },
        { status: 400 }
      );
    }

    if (attendance.checkOut?.time) {
      return NextResponse.json(
        { success: false, error: 'Already checked out today', data: attendance },
        { status: 400 }
      );
    }

    // Mark check-out
    await attendance.markCheckOut(
      { latitude, longitude, address },
      device,
      ipAddress
    );

    return NextResponse.json({
      success: true,
      message: 'Check-out successful',
      data: attendance,
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(checkOutHandler);
