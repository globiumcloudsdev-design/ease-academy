import { NextResponse } from 'next/server';
import FeeVoucher from '@/backend/models/FeeVoucher';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeTemplate from '@/backend/models/FeeTemplate';
import User from '@/backend/models/User';
import Counter from '@/backend/models/Counter';
import Class from '@/backend/models/Class';

// GET /api/super-admin/fee-vouchers/[id]
export const GET = withAuth(async (request, user, userDoc, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const voucher = await FeeVoucher.findById(id)
      .populate('studentId', 'fullName firstName lastName email studentProfile.rollNumber studentProfile.classId studentProfile.section')
      .populate('templateId', 'name code category amount lateFee discount')
      .populate('classId', 'name code')
      .lean();
    if (!voucher) return NextResponse.json({ success: false, message: 'Voucher not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: voucher });
  } catch (error) {
    console.error('Error getting voucher:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to get voucher' }, { status: 500 });
  }
}, [requireRole(['super_admin'])]);

// DELETE /api/super-admin/fee-vouchers/[id]
export const DELETE = withAuth(async (request, user, userDoc, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const voucher = await FeeVoucher.findById(id);
    if (!voucher) return NextResponse.json({ success: false, message: 'Voucher not found' }, { status: 404 });
    voucher.status = 'cancelled';
    await voucher.save();
    return NextResponse.json({ success: true, message: 'Voucher cancelled' });
  } catch (error) {
    console.error('Error cancelling voucher:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to cancel voucher' }, { status: 500 });
  }
}, [requireRole(['super_admin'])]);
