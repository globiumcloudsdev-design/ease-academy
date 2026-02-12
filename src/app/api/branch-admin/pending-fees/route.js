import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';
import User from '@/backend/models/User';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import { ROLES } from '@/constants/roles';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    // Check if user is branch admin
    if (user.role !== ROLES.BRANCH_ADMIN) {
      return NextResponse.json(
        { success: false, message: 'Only branch admins can access pending fees' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get user's branch
    const branchAdmin = await User.findById(userDoc._id);
    if (!branchAdmin?.branchId) {
      return NextResponse.json(
        { success: false, message: 'Branch not found' },
        { status: 400 }
      );
    }

    const branchId = branchAdmin.branchId;

    // Find all fee vouchers for this branch
    const vouchers = await FeeVoucher.find({
      branchId,
    })
      .populate('studentId', 'name firstName lastName fullName fatherName parentProfile')
      .populate('classId', 'name')
      .lean();

    console.log('Found vouchers for branch:', vouchers.length);

    // Initialize statistics
    const statistics = {
      pending: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      rejected: { count: 0, totalAmount: 0 },
    };

    // Extract payments by status
    const pendingPayments = [];
    const approvedPayments = [];
    const rejectedPayments = [];

    for (const voucher of vouchers) {
      for (let index = 0; index < voucher.paymentHistory.length; index++) {
        const payment = voucher.paymentHistory[index];
        const paymentData = {
          paymentId: `${voucher._id}-${index}`,
          voucherId: voucher._id,
          paymentIndex: index,
          voucherNumber: voucher.voucherNumber,
          studentName: voucher.studentId?.fullName || `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() || 'Unknown',
          className: voucher.classId?.name || 'N/A',
          amount: payment.amount,
          currency: 'PKR', // You can make this configurable per branch
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
          transactionId: payment.transactionId,
          screenshotUrl: payment.screenshot?.url,
          remarks: payment.remarks,
          submittedBy: payment.submittedBy,
          approvedBy: payment.approvedBy,
          approvedAt: payment.approvedAt,
          rejectedReason: payment.rejectedReason,
        };

        if (payment.status === 'pending') {
          statistics.pending.count++;
          statistics.pending.totalAmount += payment.amount;
          pendingPayments.push(paymentData);
        } else if (payment.status === 'approved') {
          statistics.approved.count++;
          statistics.approved.totalAmount += payment.amount;
          approvedPayments.push(paymentData);
        } else if (payment.status === 'rejected') {
          statistics.rejected.count++;
          statistics.rejected.totalAmount += payment.amount;
          rejectedPayments.push(paymentData);
        }
      }
    }

    // Sort by latest payment date first
    pendingPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    approvedPayments.sort((a, b) => new Date(b.approvedAt || b.paymentDate) - new Date(a.approvedAt || a.paymentDate));
    rejectedPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    return NextResponse.json({
      success: true,
      data: pendingPayments,
      statistics,
      approvedPayments,
      rejectedPayments,
      total: pendingPayments.length,
    });
  } catch (error) {
    console.error('Error fetching pending fees:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch pending fees' },
      { status: 500 }
    );
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
