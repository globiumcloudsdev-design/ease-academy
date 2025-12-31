import { NextResponse } from 'next/server';
import FeeVoucher from '@/backend/models/FeeVoucher';
import FeeTemplate from '@/backend/models/FeeTemplate';
import User from '@/backend/models/User';
import Counter from '@/backend/models/Counter';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Class from '@/backend/models/Class';
import Branch from '@/backend/models/Branch';

// GET /api/branch-admin/fee-vouchers/[id] - Get single voucher
export const GET = withAuth(async (request, user, userDoc, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const voucher = await FeeVoucher.findOne({
      _id: id,
      branchId: user.branchId,
    })
      .populate('studentId', 'fullName firstName lastName email studentProfile.registrationNumber studentProfile.rollNumber studentProfile.classId studentProfile.section')
      .populate('templateId', 'name code category baseAmount items lateFee discount')
      .populate('classId', 'name code')
      .populate('branchId', 'name')
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
export const DELETE = withAuth(async (request, user, userDoc, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const voucher = await FeeVoucher.findOne({
      _id: id,
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
