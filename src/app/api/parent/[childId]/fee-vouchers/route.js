import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import FeeVoucher from '@/backend/models/FeeVoucher';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import FeeTemplate from '@/backend/models/FeeTemplate';
import { uploadToCloudinary } from '@/lib/cloudinary';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    // Verify parent owns child
    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // Build query
    const query = { studentId: childId };
    if (status) query.status = status;
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    // Fetch fee vouchers
    const feeVouchers = await FeeVoucher.find(query)
      .populate('templateId', 'name type')
      .populate('classId', 'name grade')
      .populate('branchId', 'name')
      .sort({ year: -1, month: -1, issueDate: -1 })
      .lean();

    // Format fee vouchers
    const vouchersData = feeVouchers.map(voucher => ({
      id: voucher._id.toString(),
      voucherNumber: voucher.voucherNumber,
      month: voucher.month,
      year: voucher.year,
      issueDate: voucher.issueDate,
      dueDate: voucher.dueDate,
      amount: voucher.amount,
      lateFeeAmount: voucher.lateFeeAmount,
      discountAmount: voucher.discountAmount,
      totalAmount: voucher.totalAmount,
      paidAmount: voucher.paidAmount,
      remainingAmount: voucher.remainingAmount,
      status: voucher.status,
      template: {
        id: voucher.templateId?._id?.toString(),
        name: voucher.templateId?.name,
        type: voucher.templateId?.type,
      },
      class: voucher.classId ? {
        id: voucher.classId._id.toString(),
        name: voucher.classId.name,
        grade: voucher.classId.grade,
      } : null,
      branch: {
        id: voucher.branchId?._id?.toString(),
        name: voucher.branchId?.name,
      },
      paymentHistory: voucher.paymentHistory?.map(payment => ({
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        remarks: payment.remarks,
        status: payment.status,
        approvedBy: payment.approvedBy,
        approvedAt: payment.approvedAt,
      })) || [],
      remarks: voucher.remarks,
    }));

    // Calculate summary statistics
    const summary = {
      total: vouchersData.length,
      pending: vouchersData.filter(v => v.status === 'pending').length,
      paid: vouchersData.filter(v => v.status === 'paid').length,
      partial: vouchersData.filter(v => v.status === 'partial').length,
      overdue: vouchersData.filter(v => v.status === 'overdue').length,
      totalAmount: vouchersData.reduce((sum, v) => sum + v.totalAmount, 0),
      paidAmount: vouchersData.reduce((sum, v) => sum + v.paidAmount, 0),
      remainingAmount: vouchersData.reduce((sum, v) => sum + v.remainingAmount, 0),
    };

    return NextResponse.json({
      success: true,
      feeVouchers: vouchersData,
      summary,
    });
  } catch (error) {
    console.error('Error fetching fee vouchers:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch fee vouchers' 
    }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
