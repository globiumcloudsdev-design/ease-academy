import { NextResponse } from 'next/server';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import User from '@/backend/models/User';
import Notification from '@/backend/models/Notification';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * POST /api/employee-attendance/check-in
 * Mark employee check-in with location
 * Access: All authenticated users
 */
async function checkInHandler(request, user, userDoc) {
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

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await EmployeeAttendance.findOne({
      userId: currentUser._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingAttendance) {
      if (existingAttendance.checkIn?.time) {
        return NextResponse.json(
          { success: false, error: 'Already checked in today', data: existingAttendance },
          { status: 400 }
        );
      }
      
      // Update existing record with check-in
      await existingAttendance.markCheckIn(
        { latitude, longitude, address },
        device,
        ipAddress
      );

      return NextResponse.json({
        success: true,
        message: 'Check-in successful',
        data: existingAttendance,
      });
    }

    // Create new attendance record
    const attendance = new EmployeeAttendance({
      userId: currentUser._id,
      branchId: currentUser.branchId,
      date: today,
      type: 'check-in',
      status: 'present',
      checkIn: {
        time: new Date(),
        location: { latitude, longitude, address },
        device,
        ipAddress,
      },
      markedBy: currentUser._id,
    });

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      data: attendance,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(checkInHandler);
