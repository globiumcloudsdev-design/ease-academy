import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';

export const POST = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();

    // Verify user is super admin
    if (userDoc.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, remarks } = body;

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        message: 'Payment ID is required'
      }, { status: 400 });
    }

    // Parse paymentId format: "voucherId-index"
    const [voucherId, paymentIndexStr] = paymentId.split('-');
    const paymentIndex = parseInt(paymentIndexStr);

    if (!voucherId || isNaN(paymentIndex)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid payment ID format'
      }, { status: 400 });
    }

    // Find voucher
    const voucher = await FeeVoucher.findById(voucherId);
    if (!voucher) {
      return NextResponse.json({ success: false, message: 'Fee voucher not found' }, { status: 404 });
    }

    // Find payment in history by index
    if (paymentIndex < 0 || paymentIndex >= voucher.paymentHistory.length) {
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

    voucher.updatedBy = userDoc._id;
    await voucher.save();

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
      voucher: {
        id: voucher._id.toString(),
        status: voucher.status,
        paidAmount: voucher.paidAmount,
        remainingAmount: voucher.remainingAmount,
      },
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to approve payment'
    }, { status: 500 });
  }
});
