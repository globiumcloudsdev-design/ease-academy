import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';
import User from '@/backend/models/User';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    // Check if user is branch admin
    if (user.role !== 'branch-admin') {
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

    // Find all fee vouchers for this branch with pending payments
    const vouchers = await FeeVoucher.find({
      branchId,
      'paymentHistory.status': 'pending',
    })
      .populate('studentId', 'name firstName lastName fullName fatherName parentProfile')
      .populate('classId', 'name')
      .lean();

    console.log('Found vouchers with pending payments:', vouchers.length);
    vouchers.forEach((voucher, index) => {
      console.log(`Voucher ${index + 1}: ${voucher.voucherNumber}, Student: ${voucher.studentId?.name || voucher.studentId?.fullName || 'Unknown'}`);
    });

    // Extract pending payments
    const pendingPayments = [];

    for (const voucher of vouchers) {
      const pendingHistoryItems = voucher.paymentHistory.filter(
        (payment) => payment.status === 'pending'
      );

      for (let index = 0; index < voucher.paymentHistory.length; index++) {
        const payment = voucher.paymentHistory[index];
        if (payment.status === 'pending') {
          pendingPayments.push({
            paymentId: `${voucher._id}-${index}`,
            voucherId: voucher._id,
            paymentIndex: index,
            voucherNumber: voucher.voucherNumber,
            studentName: voucher.studentId?.fullName || `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() || 'Unknown',
            className: voucher.classId?.name || 'N/A',
            amount: payment.amount,
            currency: '₹', // You can make this configurable per branch
            paymentMethod: payment.paymentMethod,
            paymentDate: payment.paymentDate,
            transactionId: payment.transactionId,
            screenshotUrl: payment.screenshot?.url,
            remarks: payment.remarks,
            submittedBy: payment.submittedBy,
          });
        }
      }
    }

    // Sort by latest payment date first
    pendingPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    return NextResponse.json({
      success: true,
      data: pendingPayments,
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
