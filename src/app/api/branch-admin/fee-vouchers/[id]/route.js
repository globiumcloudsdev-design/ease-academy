import { NextResponse } from 'next/server';
import FeeVoucher from '@/backend/models/FeeVoucher';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

// GET /api/branch-admin/fee-vouchers/[id] - Get single voucher
export const GET = withAuth(async (request, user, userDoc, context) => {
  try {
    await connectDB();

    const { params } = context;
    const voucher = await FeeVoucher.findOne({
      _id: params.id,
      branchId: user.branchId,
    })
        .populate('studentId', 'name email rollNumber')
        .populate('templateId', 'name code category amount lateFee discount')
        .populate('classId', 'name code')
        .lean();

    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    console.error('Error fetching voucher:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch voucher' },
      { status: 500 }
    );
  }
}, [requireRole(['branch_admin'])]);

// DELETE /api/branch-admin/fee-vouchers/[id] - Cancel voucher
export const DELETE = withAuth(async (request, user, userDoc, context) => {
  try {
    await connectDB();

    const { params } = context;
    const voucher = await FeeVoucher.findOne({
      _id: params.id,
      branchId: user.branchId,
    });

      if (!voucher) {
        return NextResponse.json(
          { success: false, message: 'Voucher not found' },
          { status: 404 }
        );
      }

    if (voucher.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'Cannot cancel a paid voucher' },
        { status: 400 }
      );
    }

    voucher.status = 'cancelled';
    voucher.updatedBy = user.userId;
    await voucher.save();

    return NextResponse.json({
      success: true,
      message: 'Voucher cancelled successfully',
      data: voucher,
    });
  } catch (error) {
    console.error('Error cancelling voucher:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel voucher' },
      { status: 500 }
    );
  }
}, [requireRole(['branch_admin'])]);
