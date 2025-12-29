import { NextResponse } from 'next/server';
import FeeVoucher from '@/backend/models/FeeVoucher';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeTemplate from '@/backend/models/FeeTemplate';
import User from '@/backend/models/User';
import Counter from '@/backend/models/Counter';
import Class from '@/backend/models/Class';
import Branch from '@/backend/models/Branch';
import { generateFeeVoucherPDF } from '@/lib/pdf-generator';

// GET /api/super-admin/fee-vouchers/[id]
export const GET = withAuth(async (request, user, userDoc, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const voucher = await FeeVoucher.findById(id)
      .populate('studentId', 'fullName firstName lastName email fatherName studentProfile.registrationNumber studentProfile.rollNumber studentProfile.classId studentProfile.section studentProfile.guardianType studentProfile.father studentProfile.guardian')
      .populate('templateId', 'name code category amount lateFee discount')
      .populate('classId', 'name code')
      .populate('branchId', 'name')
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

// GET /api/super-admin/fee-vouchers/[id]/download - Download PDF (public endpoint for emails)
export const downloadPDF = async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;

    const voucher = await FeeVoucher.findById(id)
      .populate('studentId', 'fullName firstName lastName email studentProfile.registrationNumber studentProfile.rollNumber studentProfile.classId studentProfile.section')
      .populate('templateId', 'name code category amount lateFee discount')
      .populate('classId', 'name code')
      .populate('branchId', 'name')
      .lean();

    if (!voucher) {
      return NextResponse.json({ success: false, message: 'Voucher not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generateFeeVoucherPDF(voucher);

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Fee_Voucher_${voucher.voucherNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error downloading voucher PDF:', error);
    return NextResponse.json({ success: false, message: 'Failed to download voucher' }, { status: 500 });
  }
};
