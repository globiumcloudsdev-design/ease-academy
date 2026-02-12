import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';

const approvePayment = async (request, user, userDoc, { params }) => {
  try {
    const { id } = params || {};
    await connectDB();

    const body = await request.json();
    const { paymentId, action, remarks } = body;

    if (!paymentId || !action) {
      return NextResponse.json({
        success: false,
        message: 'Payment ID and action are required'
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Action must be approve or reject'
      }, { status: 400 });
    }

    // Find voucher
    const voucher = await FeeVoucher.findById(id);
    if (!voucher) {
      return NextResponse.json({ success: false, message: 'Fee voucher not found' }, { status: 404 });
    }

    // Find payment in history by index (since paymentId is sent as index from frontend)
    const paymentIndex = parseInt(paymentId);
    if (isNaN(paymentIndex) || paymentIndex < 0 || paymentIndex >= voucher.paymentHistory.length) {
      return NextResponse.json({ success: false, message: 'Invalid payment index' }, { status: 400 });
    }

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

    if (action === 'approve') {
      // Approve payment
      payment.status = 'approved';
      payment.approvedBy = userDoc._id;
      payment.approvedAt = new Date();
      payment.receivedBy = userDoc._id;
      if (remarks) payment.remarks = remarks;

      // Update voucher amounts
      voucher.paidAmount += payment.amount;
      voucher.remainingAmount = voucher.totalAmount - voucher.paidAmount;

      // Update voucher status
      if (voucher.remainingAmount <= 0) {
        voucher.status = 'paid';
        voucher.remainingAmount = 0;
      } else if (voucher.paidAmount > 0) {
        voucher.status = 'partial';
      }
    } else {
      // Reject payment
      payment.status = 'rejected';
      payment.rejectedBy = userDoc._id;
      payment.rejectedAt = new Date();
      payment.rejectionReason = remarks || 'Payment rejected by admin';
    }

    voucher.updatedBy = userDoc._id;
    await voucher.save();

    return NextResponse.json({
      success: true,
      message: `Payment ${action}d successfully`,
      voucher: {
        id: voucher._id.toString(),
        status: voucher.status,
        paidAmount: voucher.paidAmount,
        remainingAmount: voucher.remainingAmount,
      },
    });
  } catch (error) {
    console.error('Error processing payment approval:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to process payment approval'
    }, { status: 500 });
  }
};

export const POST = withAuth(approvePayment, [requireRole(['super_admin'])]);
