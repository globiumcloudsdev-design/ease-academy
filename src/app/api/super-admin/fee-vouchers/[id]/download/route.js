import { NextResponse } from 'next/server';
import FeeVoucher from '@/backend/models/FeeVoucher';
import connectDB from '@/lib/database';
import { generateFeeVoucherPDF } from '@/lib/pdf-generator';

// GET /api/super-admin/fee-vouchers/[id]/download - Download PDF (public endpoint for emails)
export async function GET(request, { params }) {
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
    const pdfBuffer = generateFeeVoucherPDF(voucher);

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
}