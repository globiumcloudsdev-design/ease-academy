import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import FeeVoucher from '@/backend/models/FeeVoucher';
import Class from '@/backend/models/Class';

// GET /api/branch-admin/students/search - Search students in branch admin's branch
export const GET = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // Build search query - only for this branch
    const searchQuery = {
      role: 'student',
      branchId: user.branchId,
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { 'studentProfile.registrationNumber': { $regex: query, $options: 'i' } },
        { 'studentProfile.rollNumber': { $regex: query, $options: 'i' } }
      ]
    };
    
    const students = await User.find(searchQuery)
      .select('fullName firstName lastName email phone branchId studentProfile')
      .populate('studentProfile.classId', 'name code')
      .limit(limit)
      .lean();
    
    // Get fee status for each student (current month)
    const FeeVoucher = (await import('@/backend/models/FeeVoucher')).default;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const studentIds = students.map(s => s._id);
    const feeVouchers = await FeeVoucher.find({
      studentId: { $in: studentIds },
      month: currentMonth,
      year: currentYear
    }).select('studentId status').lean();
    
    const feeStatusMap = {};
    feeVouchers.forEach(voucher => {
      feeStatusMap[voucher.studentId.toString()] = voucher.status;
    });
    
    // Enrich students with fee status
    const enrichedStudents = students.map(student => ({
      _id: student._id,
      fullName: student.fullName,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      branchId: student.branchId,
      registrationNumber: student.studentProfile?.registrationNumber,
      rollNumber: student.studentProfile?.rollNumber,
      section: student.studentProfile?.section,
      classId: student.studentProfile?.classId,
      feeStatus: feeStatusMap[student._id.toString()] || 'unpaid',
      hasPaidFees: ['paid', 'partial'].includes(feeStatusMap[student._id.toString()])
    }));
    
    return NextResponse.json({
      success: true,
      data: enrichedStudents
    });
  } catch (error) {
    console.error('Error searching students:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to search students' },
      { status: 500 }
    );
  }
}, [requireRole(['branch_admin'])]);
