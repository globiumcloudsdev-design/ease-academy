import { NextResponse } from 'next/server';
import Payroll from '@/backend/models/Payroll';
import Notification from '@/backend/models/Notification';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

/**
 * PUT /api/payroll/[id]/mark-paid
 * Mark payroll as paid
 * Access: Super Admin, Branch Admin
 */
async function markPaidHandler(request, user, userDoc, context) {
  try {
    await connectDB();

    const { id } = context.params;
    const { paymentMethod, transactionReference, paymentDate, remarks } = await request.json();

    const currentUser = user;

    // Get payroll record
    const payroll = await Payroll.findById(id).populate('teacherId', 'firstName lastName email');

    if (!payroll) {
      return NextResponse.json(
        { success: false, error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    // Authorization check
    if (currentUser.role === 'branch_admin' && payroll.branchId.toString() !== currentUser.branchId.toString()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Update payroll status
    payroll.paymentStatus = 'paid';
    payroll.paymentMethod = paymentMethod || 'bank_transfer';
    payroll.transactionReference = transactionReference;
    payroll.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    payroll.paidBy = currentUser._id;
    
    if (remarks) {
      payroll.remarks = payroll.remarks 
        ? `${payroll.remarks}\n\nPayment: ${remarks}` 
        : `Payment: ${remarks}`;
    }

    await payroll.save();

    // Create notification for teacher
    await Notification.create({
      type: 'general',
      title: 'Salary Payment Received',
      message: `Your salary for ${getMonthName(payroll.month)} ${payroll.year} has been paid. Amount: PKR ${payroll.netSalary.toLocaleString()}`,
      targetUser: payroll.teacherId._id,
      metadata: {
        payrollId: payroll._id,
        month: payroll.month,
        year: payroll.year,
        amount: payroll.netSalary,
        paymentMethod,
        transactionReference,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payroll marked as paid successfully',
      data: payroll,
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

export const PUT = withAuth(markPaidHandler, [requireRole(['super_admin', 'branch_admin'])]);
