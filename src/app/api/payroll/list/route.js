import { NextResponse } from 'next/server';
import Payroll from '@/backend/models/Payroll';
import User from '@/backend/models/User';
import Branch from '@/backend/models/Branch';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * GET /api/payroll/list
 * Get payroll records with filters
 * Access: Super Admin, Branch Admin
 */
async function getPayrollHandler(request, user, userDoc) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const teacherId = searchParams.get('teacherId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    const currentUser = user;

    // Build query
    let query = {};

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.paymentStatus = status;
    if (teacherId) query.teacherId = teacherId;

    // Branch-specific logic
    if (currentUser.role === 'branch_admin') {
      query.branchId = currentUser.branchId;
    } else if (currentUser.role === 'super_admin' && branchId && branchId !== 'all') {
      query.branchId = branchId;
    }

    // Get total count
    const total = await Payroll.countDocuments(query);

    // Get payroll records
    const payrolls = await Payroll.find(query)
      .populate('teacherId', 'firstName lastName email phone teacherProfile')
      .populate('branchId', 'name code')
      .populate('processedBy', 'firstName lastName')
      .populate('paidBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: payrolls,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getPayrollHandler, [requireRole(['super_admin', 'branch_admin'])]);
