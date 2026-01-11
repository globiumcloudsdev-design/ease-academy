import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';
import User from '@/backend/models/User';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    // Check if user is branch admin
    if (user.role !== 'branch-admin') {
      return NextResponse.json(
        { success: false, message: 'Only branch admins can reject payments' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { voucherId, paymentIndex, rejectionReason } = body;

    if (!voucherId || paymentIndex === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json(
        { success: false, message: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get user's branch
    const branchAdmin = await User.findById(userDoc._id);
    if (!branchAdmin?.branchId) {
      return NextResponse.json(
        { success: false, message: 'Branch not found' },
        { status: 400 }
      );
    }

    const branchId = branchAdmin.branchId;

    // Find the voucher
    const voucher = await FeeVoucher.findById(voucherId);
    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Fee voucher not found' },
        { status: 404 }
      );
    }

    // Verify branch ownership
    if (voucher.branchId.toString() !== branchId.toString()) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if payment exists and is pending
    const payment = voucher.paymentHistory[paymentIndex];
    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `Payment is already ${payment.status}` },
        { status: 400 }
      );
    }

    // Reject the payment
    payment.status = 'rejected';
    payment.rejectedBy = userDoc._id;
    payment.rejectedAt = new Date();
    payment.rejectionReason = rejectionReason.trim();

    await voucher.save();

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      data: {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        rejectionReason: payment.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reject payment' },
      { status: 500 }
    );
  }
});

export async function POST(request, context) {
  return handler(request, context);
}
