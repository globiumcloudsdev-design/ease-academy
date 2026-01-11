import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';
import User from '@/backend/models/User';
import Notification from '@/backend/models/Notification';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    // Check if user is branch admin
    if (user.role !== 'branch-admin') {
      return NextResponse.json(
        { success: false, message: 'Only branch admins can approve payments' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { voucherId, paymentIndex } = body;

    if (!voucherId || paymentIndex === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
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

    // Calculate total approved amount (including current payment being approved now)
    let totalApprovedAmount = voucher.paymentHistory
      .filter((p, idx) => p.status === 'approved' || idx === paymentIndex)
      .reduce((sum, p) => sum + p.amount, 0);

    // Approve the payment
    payment.status = 'approved';
    payment.approvedBy = userDoc._id;
    payment.approvedAt = new Date();

    // Update paid amount and remaining amount
    voucher.paidAmount = totalApprovedAmount;
    voucher.remainingAmount = Math.max(0, voucher.totalAmount - totalApprovedAmount);

    // Update voucher status
    if (voucher.remainingAmount <= 0) {
      voucher.status = 'paid';
    } else if (totalApprovedAmount > 0) {
      voucher.status = 'partial';
    }

    await voucher.save();

    // Send notification to parent
    try {
      const student = await User.findById(voucher.studentId).populate('parentProfile.parentId');
      if (student?.parentProfile?.parentId) {
        const parentId = student.parentProfile.parentId;

        await Notification.create({
          targetUser: parentId,
          title: 'Payment Approved',
          message: `Your payment of ₹${payment.amount} for voucher ${voucher.voucherNumber} has been approved.`,
          type: 'payment',
          data: {
            voucherId: voucher._id,
            voucherNumber: voucher.voucherNumber,
            amount: payment.amount,
            transactionId: payment.transactionId,
          },
        });
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the payment approval if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
      data: {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        paidAmount: voucher.paidAmount,
        remainingAmount: voucher.remainingAmount,
        status: voucher.status,
      },
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to approve payment' },
      { status: 500 }
    );
  }
});

export async function POST(request, context) {
  return handler(request, context);
}
