import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = context.params || {};
    await connectDB();

    // Verify user is branch admin
    if (userDoc.role !== 'branch-admin') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

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

    // Verify voucher belongs to branch admin's branch
    if (voucher.branchId.toString() !== userDoc.branchAdminProfile?.branchId?.toString()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Voucher does not belong to your branch' 
      }, { status: 403 });
    }

    // Find payment in history
    const payment = voucher.paymentHistory.id(paymentId);
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
      payment.approvedBy = userDoc._id;
      payment.approvedAt = new Date();
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
});

export async function POST(request, context) {
  return handler(request, context);
}
