import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import Department from '@/backend/models/Department';
import Subject from '@/backend/models/Subject';

async function getEmployeesHandler(request, user, userDoc) {
  try {
    await connectDB();
    
    // Check if user is branch_admin
    if (user.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Fetch employees (teachers and staff) from the branch_admin's branch only
    const employees = await User.find({
      role: { $in: ['teacher', 'staff'] },
      branchId: user.branchId,
      isActive: true
    })
    .populate('branchId', 'name code')
    .populate('teacherProfile.subjects', 'name code')
    .populate('teacherProfile.departmentId', 'name')
    .populate('staffProfile.departmentId', 'name')
    .select('firstName lastName fullName email phone role branchId teacherProfile staffProfile')
    .sort({ fullName: 1 });
    
    return NextResponse.json({
      success: true,
      data: employees
    });
    
  } catch (error) {
    console.error('Error fetching employees for branch-admin:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getEmployeesHandler);