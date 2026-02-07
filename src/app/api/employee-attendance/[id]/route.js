import { NextResponse } from 'next/server';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * PUT /api/employee-attendance/[id]
 * Update an employee attendance record
 * Access: Admins (Branch Admin, Super Admin)
 */
async function updateAttendanceHandler(request, user, userDoc, { params }) {
  try {
      await connectDB();
      const { id } = await params;
      const updateData = await request.json();
      
      // Validate permissions
      // Branch admin can only update attendance for their branch
      // Super admin can update any
      
      const record = await EmployeeAttendance.findById(id);
      
      if (!record) {
          return NextResponse.json(
              { success: false, message: 'Attendance record not found' },
              { status: 404 }
          );
      }
      
      // Access Logic
      if (user.role === 'branch_admin') {
          if (record.branchId.toString() !== user.branchId.toString()) {
              return NextResponse.json(
                  { success: false, message: 'Unauthorized execution' },
                  { status: 403 }
              );
          }
      } else if (user.role !== 'super_admin') {
          // Typically teachers/staff shouldn't update their own past attendance via this route without workflow
          return NextResponse.json(
              { success: false, message: 'Unauthorized access' },
              { status: 403 }
          );
      }
      
      // Update fields
      // Allowing updates to status, times, details, etc.
      if (updateData.status) record.status = updateData.status;
      if (updateData.checkInTime) {
          // If pure time string "HH:MM", might need to combine with date
          // Assuming the frontend sends full ISO string or we parse it
          // Based on frontend modal, it sends "HH:MM". We need to combine with record.date
          
          if(updateData.checkInTime.includes(':') && updateData.checkInTime.length === 5) {
               const [hours, minutes] = updateData.checkInTime.split(':');
               const newCheckIn = new Date(record.date);
               newCheckIn.setHours(parseInt(hours), parseInt(minutes));
               
               // Ensure we keep existing metadata properties to avoid validation errors
               const existingCheckIn = record.checkIn ? record.checkIn.toObject() : {};
               record.checkIn = { ...existingCheckIn, time: newCheckIn };
          }
      }
      
      if (updateData.checkOutTime) {
          if(updateData.checkOutTime.includes(':') && updateData.checkOutTime.length === 5) {
               const [hours, minutes] = updateData.checkOutTime.split(':');
               const newCheckOut = new Date(record.date);
               newCheckOut.setHours(parseInt(hours), parseInt(minutes));
               
               // Ensure we keep existing metadata properties to avoid validation errors
               const existingCheckOut = record.checkOut ? record.checkOut.toObject() : {};
               record.checkOut = { ...existingCheckOut, time: newCheckOut };
          }
      }
      
      if (updateData.remarks !== undefined) record.remarks = updateData.remarks;
      if (updateData.leaveType !== undefined) record.leaveType = updateData.leaveType;
      if (updateData.leaveReason !== undefined) record.leaveReason = updateData.leaveReason;

      // Recalculate working hours if both times present
      if (record.checkIn?.time && record.checkOut?.time) {
          const start = new Date(record.checkIn.time);
          const end = new Date(record.checkOut.time);
          const diffMs = end - start;
          if (diffMs > 0) {
              record.workingHours = diffMs / (1000 * 60 * 60);
          } else {
            record.workingHours = 0;
          }
      }
      
      await record.save();
      
      return NextResponse.json({
          success: true,
          data: record,
          message: 'Attendance updated successfully'
      });

  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateAttendanceHandler);
