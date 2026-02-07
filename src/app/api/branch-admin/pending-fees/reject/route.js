import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';
import User from '@/backend/models/User';
import { ROLES } from '@/constants/roles';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    // Check if user is branch admin
    if (user.role !== ROLES.BRANCH_ADMIN) {
      return NextResponse.json(
        { success: false, message: 'Only branch admins can reject payments' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { voucherId, paymentIndex, rejectionReason } = body;

    if (!voucherId || paymentIndex === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Voucher ID and payment index are required'
      }, { status: 400 });
    }

    // Find voucher
    const voucher = await FeeVoucher.findById(voucherId);
    if (!voucher) {
      return NextResponse.json({ success: false, message: 'Fee voucher not found' }, { status: 404 });
    }

    // Verify voucher belongs to branch admin's branch
    const branchAdmin = await User.findById(userDoc._id);
    if (!branchAdmin?.branchId || voucher.branchId.toString() !== branchAdmin.branchId.toString()) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Find payment in history by index
    const payment = voucher.paymentHistory[paymentIndex];
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: `Payment already ${payment.status}`
      }, { status: 400 });
    }

    // Reject payment
    payment.status = 'rejected';
    payment.rejectedBy = userDoc._id;
    payment.rejectedAt = new Date();
    payment.rejectionReason = rejectionReason || 'Payment rejected by branch admin';

    voucher.updatedBy = userDoc._id;
    await voucher.save();

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      voucher: {
        id: voucher._id.toString(),
        status: voucher.status,
        paidAmount: voucher.paidAmount,
        remainingAmount: voucher.remainingAmount,
      },
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to reject payment'
    }, { status: 500 });
  }
});

export async function POST(request, context) {
  return handler(request, context);
}
