import { NextResponse } from 'next/server';
import Payroll from '@/backend/models/Payroll';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { generateSalarySlipPDF } from '@/lib/pdf-generator';
import connectDB from '@/lib/database';

/**
 * GET /api/payroll/slip/[id]
 * Download salary slip PDF
 * Access: Super Admin, Branch Admin, Teacher (own slip)
 */
async function downloadSlipHandler(request, user, userDoc, context) {
  try {
    await connectDB();

    const { id } = await context.params;
    const currentUser = user;

    // Get payroll record
    const payroll = await Payroll.findById(id)
      .populate('userId', 'firstName lastName email phone teacherProfile staffProfile role')
      .populate('branchId', 'name code address')
      .lean();

    if (!payroll) {
      return NextResponse.json(
        { success: false, error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    // Authorization check
    const isOwner = payroll.userId._id.toString() === currentUser.userId;
    const isAdmin = ['super_admin', 'branch_admin'].includes(currentUser.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    if (currentUser.role === 'branch_admin' && payroll.branchId._id.toString() !== currentUser.branchId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateSalarySlipPDF(payroll, payroll.userId);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Salary_Slip_${payroll.month}_${payroll.year}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Download slip error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(downloadSlipHandler, [requireRole(['super_admin', 'branch_admin', 'teacher', 'staff'])]);
