import { NextResponse } from 'next/server';
import Payroll from '@/backend/models/Payroll';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * GET /api/payroll/reports/summary
 * Get payroll summary and statistics
 * Access: Super Admin, Branch Admin
 */
async function getReportsHandler(request, user, userDoc) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const branchId = searchParams.get('branchId');

    const currentUser = user;

    // Build query
    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    // Branch-specific logic
    if (currentUser.role === 'branch_admin') {
      query.branchId = currentUser.branchId;
    } else if (currentUser.role === 'super_admin' && branchId && branchId !== 'all') {
      query.branchId = branchId;
    }

    // Get summary statistics
    const totalPayrolls = await Payroll.countDocuments(query);
    const pendingPayrolls = await Payroll.countDocuments({ ...query, paymentStatus: 'pending' });
    const paidPayrolls = await Payroll.countDocuments({ ...query, paymentStatus: 'paid' });

    // Get total amounts
    const amountStats = await Payroll.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalGrossSalary: { $sum: '$grossSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNetSalary: { $sum: '$netSalary' },
        },
      },
    ]);

    const amounts = amountStats[0] || {
      totalGrossSalary: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
    };

    // Get branch-wise breakdown (for super admin)
    let branchBreakdown = [];
    if (currentUser.role === 'super_admin') {
      branchBreakdown = await Payroll.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$branchId',
            count: { $sum: 1 },
            totalGross: { $sum: '$grossSalary' },
            totalNet: { $sum: '$netSalary' },
          },
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branch',
          },
        },
        { $unwind: '$branch' },
        {
          $project: {
            branchId: '$_id',
            branchName: '$branch.name',
            count: 1,
            totalGross: 1,
            totalNet: 1,
          },
        },
      ]);
    }

    // Get payment status breakdown
    const statusBreakdown = await Payroll.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$netSalary' },
        },
      },
    ]);

    // Get top 10 highest salaries
    const topSalaries = await Payroll.find(query)
      .populate('teacherId', 'firstName lastName teacherProfile')
      .populate('branchId', 'name')
      .sort({ netSalary: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPayrolls,
          pendingPayrolls,
          paidPayrolls,
          ...amounts,
        },
        branchBreakdown,
        statusBreakdown,
        topSalaries,
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getReportsHandler, [requireRole(['super_admin', 'branch_admin'])]);
