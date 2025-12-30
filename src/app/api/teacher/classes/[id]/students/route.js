import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';

const getClassStudents = async (req, user, userDoc, context) => {
  try {
    await connectDB();
    const { id } = await context.params;

    // Find students in this class
    const query = {
      role: 'student',
      'studentProfile.classId': id,
      isActive: true
    };

    // Branch lock
    if (user.role !== 'super_admin') {
      query.branchId = userDoc.branchId;
    }

    const students = await User.find(query)
      .select('firstName lastName fullName email profilePhoto studentProfile.rollNumber studentProfile.registrationNumber')
      .sort({ 'studentProfile.rollNumber': 1 });

    return NextResponse.json({ 
      success: true, 
      data: { students } 
    });
  } catch (error) {
    console.error('Error fetching class students:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch students' }, { status: 500 });
  }
};

export const GET = withAuth(getClassStudents, [requireRole(['teacher', 'branch_admin', 'super_admin'])]);
