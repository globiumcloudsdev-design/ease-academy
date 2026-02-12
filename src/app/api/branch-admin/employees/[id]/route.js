import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Department from '@/backend/models/Department';
import Subject from '@/backend/models/Subject';

async function getSingleEmployeeHandler(request, user, userDoc, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Check if user is branch_admin
    if (user.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Fetch employee (teacher, staff, or branch_admin) from the branch_admin's branch only
    const employee = await User.findOne({
      _id: id,
      role: { $in: ['teacher', 'staff', 'branch_admin'] },
      branchId: user.branchId,
      isActive: true
    })
    .populate('branchId', 'name code')
    .populate('teacherProfile.subjects', 'name code')
    .populate('teacherProfile.departmentId', 'name')
    .populate('staffProfile.departmentId', 'name')
    .select('firstName lastName fullName email phone role branchId teacherProfile staffProfile');
    
    if (!employee) {
        return NextResponse.json(
            { success: false, message: 'Employee not found or not in your branch' },
            { status: 404 }
        );
    }

    return NextResponse.json({
      success: true,
      data: employee
    });
    
  } catch (error) {
    console.error('Error fetching single employee for branch-admin:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSingleEmployeeHandler);
