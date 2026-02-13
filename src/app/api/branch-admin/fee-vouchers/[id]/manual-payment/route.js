import { NextResponse } from 'next/server';
import FeeVoucher from '@/backend/models/FeeVoucher';
import User from '@/backend/models/User';
import Notification from '@/backend/models/Notification';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import { sendEmail } from '@/backend/utils/emailService';
import { getStudentEmailTemplate } from '@/backend/templates/studentEmail';
import { getParentEmailTemplate } from '@/backend/templates/parentEmail';

// POST /api/branch-admin/fee-vouchers/:id/manual-payment - Record manual payment
export const POST = withAuth(async (request, user, userDoc, context) => {
  try {
    await connectDB();

    // In Next.js 16, params is a Promise
    const { id } = await context.params || {};
    
    const body = await request.json();
    const { amount, paymentMethod, remarks, paymentDate } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    // Find the voucher
    const voucher = await FeeVoucher.findById(id)
      .populate('studentId', 'fullName firstName lastName email studentProfile')
      .populate('templateId', 'name code')
      .populate('classId', 'name code')
      .lean();
      
    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher not found' },
        { status: 404 }
      );
    }

    // Check if voucher is already cancelled or fully paid
    if (voucher.status === 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'Cannot process payment for a cancelled voucher' },
        { status: 400 }
      );
    }

    if (voucher.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'Voucher is already fully paid' },
        { status: 400 }
      );
    }

    // Calculate remaining amount with proper rounding
    const paidAmount = voucher.paidAmount || 0;
    const totalAmount = voucher.totalAmount || 0;
    const remainingAmount = Math.round((voucher.remainingAmount ?? (totalAmount - paidAmount)) * 100) / 100;

    // Validate payment amount doesn't exceed remaining (with small tolerance for floating point)
    const paymentAmount = Math.round(amount * 100) / 100;
    if (paymentAmount - remainingAmount > 0.01) {
      return NextResponse.json(
        { success: false, message: `Payment amount exceeds remaining amount of PKR ${remainingAmount}` },
        { status: 400 }
      );
    }

    // Calculate new paid amount and status
    const newPaidAmount = Math.round((paidAmount + paymentAmount) * 100) / 100;
    const newRemainingAmount = Math.round((totalAmount - newPaidAmount) * 100) / 100;
    let newStatus = 'partial';
    // Mark as paid if remaining amount is 0 or very small (due to floating point)
    if (newRemainingAmount <= 0.01) {
      newStatus = 'paid';
    }

    // Update voucher with payment
    const updatedVoucher = await FeeVoucher.findByIdAndUpdate(
      id,
      {
        $set: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount <= 0.01 ? 0 : newRemainingAmount,
          status: newStatus,
        },
        $push: {
          paymentHistory: {
            amount: paymentAmount,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            paymentMethod: paymentMethod || 'cash',
            transactionId: `MANUAL-${Date.now()}`,
            status: 'approved',
            receivedBy: user.userId,
            remarks: remarks || '',
          },
        },
      },
      { new: true }
    ).populate('studentId', 'fullName firstName lastName email studentProfile');

    // Create notification for student
    await Notification.create({
      type: 'fee_payment',
      title: 'Payment Received',
      message: `Payment of PKR ${amount.toLocaleString()} has been recorded for voucher ${voucher.voucherNumber}. ${newStatus === 'paid' ? 'Voucher fully paid!' : `Remaining: PKR ${(totalAmount - newPaidAmount).toLocaleString()}`}`,
      targetUser: voucher.studentId._id,
      metadata: {
        voucherNumber: voucher.voucherNumber,
        voucherId: voucher._id,
        amount: amount,
        newPaidAmount,
        remainingAmount: totalAmount - newPaidAmount,
        status: newStatus,
      }
    });

    // Send email to student
    if (voucher.studentId.email) {
      const studentName = voucher.studentId.fullName || `${voucher.studentId.firstName || ''} ${voucher.studentId.lastName || ''}`.trim() || 'Student';
      const studentEmailHtml = getStudentEmailTemplate('fee_payment_received', {
        studentName,
        name: studentName,
        voucherNumber: voucher.voucherNumber,
        amount: amount,
        paidAmount: newPaidAmount,
        remainingAmount: totalAmount - newPaidAmount,
        totalAmount: totalAmount,
        status: newStatus,
        paymentDate: paymentDate ? new Date(paymentDate).toLocaleDateString() : new Date().toLocaleDateString(),
      });
      await sendEmail(voucher.studentId.email, `Payment Received - ${voucher.voucherNumber}`, studentEmailHtml);
    }

    // Send email to parent/guardian
    const parentEmail = voucher.studentId.studentProfile?.father?.email || 
                       voucher.studentId.studentProfile?.mother?.email || 
                       voucher.studentId.studentProfile?.guardian?.email;
    const parentName = voucher.studentId.studentProfile?.father?.name || 
                      voucher.studentId.studentProfile?.mother?.name || 
                      voucher.studentId.studentProfile?.guardian?.name;
    
    if (parentEmail) {
      const studentName = voucher.studentId.fullName || `${voucher.studentId.firstName || ''} ${voucher.studentId.lastName || ''}`.trim() || 'Student';
      const parentEmailHtml = getParentEmailTemplate('CHILD_FEE_PAYMENT', {
        firstName: parentName || 'Parent',
        childName: studentName,
        voucherNumber: voucher.voucherNumber,
        amount: amount,
        paidAmount: newPaidAmount,
        remainingAmount: totalAmount - newPaidAmount,
        totalAmount: totalAmount,
        status: newStatus,
        paymentDate: paymentDate ? new Date(paymentDate).toLocaleDateString() : new Date().toLocaleDateString(),
        className: voucher.classId?.name || ''
      });
      await sendEmail(parentEmail, `Payment Received for ${studentName} - ${voucher.voucherNumber}`, parentEmailHtml);
    }

    return NextResponse.json({
      success: true,
      message: newStatus === 'paid' 
        ? 'Payment recorded successfully! Voucher is now fully paid.'
        : 'Payment recorded successfully!',
      data: {
        voucher: updatedVoucher,
        payment: {
          amount,
          paymentMethod: paymentMethod || 'cash',
          paymentDate: paymentDate || new Date(),
          remarks: remarks || '',
        },
        updatedStatus: {
          paidAmount: newPaidAmount,
          remainingAmount: totalAmount - newPaidAmount,
          status: newStatus,
        },
      },
    });
  } catch (error) {
    console.error('Error recording manual payment:', error);
    
    // Handle different error types
    let errorMessage = 'Failed to record payment';
    let errorStatus = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = error.message || errorMessage;
      errorStatus = error.status || errorStatus;
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: errorStatus }
    );
  }
}, [requireRole(['branch_admin'])]);
