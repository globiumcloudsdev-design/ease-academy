import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';
import Class from '@/backend/models/Class';
import Branch from '@/backend/models/Branch';
import User from '@/backend/models/User';


// Helper to ensure we always return JSON
const jsonResponse = (data, status = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};


const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    await connectDB();

    // 1. Check if user exists and is super_admin
    if (!userDoc || userDoc.role !== 'super_admin') {
      return jsonResponse({ success: false, message: 'Unauthorized: Super Admin access required' }, 403);
    }

    // 2. Fetch data for all payment statuses
    const feeVouchers = await FeeVoucher.find({
      'paymentHistory.0': { $exists: true } // Has at least one payment in history
    })
      .populate('studentId', 'firstName lastName fullName')
      .populate('classId', 'name')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    const pendingPayments = [];
    const approvedPayments = [];
    const rejectedPayments = [];

    feeVouchers.forEach(voucher => {
      voucher.paymentHistory.forEach((payment, index) => {
        const paymentData = {
          paymentId: `${voucher._id}-${index}`,
          voucherId: voucher._id.toString(),
          paymentIndex: index,
          voucherNumber: voucher.voucherNumber,
          studentName: voucher.studentId?.fullName || 'Unknown',
          className: voucher.classId?.name || 'N/A',
          branchName: voucher.branchId?.name || 'N/A',
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
          transactionId: payment.transactionId,
          screenshotUrl: payment.screenshot?.url,
          status: payment.status
        };

        if (payment.status === 'pending') {
          pendingPayments.push(paymentData);
        } else if (payment.status === 'approved') {
          approvedPayments.push({
            ...paymentData,
            approvedAt: payment.approvedAt
          });
        } else if (payment.status === 'rejected') {
          rejectedPayments.push({
            ...paymentData,
            rejectedReason: payment.rejectionReason || payment.rejectedReason
          });
        }
      });
    });

    // Sort by latest payment date first
    pendingPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    approvedPayments.sort((a, b) => new Date(b.approvedAt || b.paymentDate) - new Date(a.approvedAt || a.paymentDate));
    rejectedPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    return jsonResponse({
      success: true,
      data: pendingPayments,
      approvedPayments: approvedPayments,
      rejectedPayments: rejectedPayments,
      statistics: {
        pending: { count: pendingPayments.length, totalAmount: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0) },
        approved: { count: approvedPayments.length, totalAmount: approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0) },
        rejected: { count: rejectedPayments.length, totalAmount: rejectedPayments.reduce((sum, p) => sum + (p.amount || 0), 0) }
      },
      total: pendingPayments.length
    });

  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ success: false, message: error.message }, 500);
  }
});

export async function GET(request, context) {
  return handler(request, context);
}


// const handler = withAuth(async (request, user, userDoc, context) => {
//   try {
//     // Check if user is super admin
//     if (userDoc.role !== 'super_admin') {
//       return NextResponse.json(
//         { success: false, message: 'Only super admins can access this endpoint' },
//         { status: 403 }
//       );
//     }

//     await connectDB();

//     // Find all fee vouchers that have pending payments in their history
//     const feeVouchers = await FeeVoucher.find({
//       'paymentHistory.status': 'pending'
//     })
//       .populate('studentId', 'firstName lastName fullName')
//       .populate('classId', 'name')
//       .populate('branchId', 'name')
//       .sort({ createdAt: -1 });

//     console.log('Super Admin - Found vouchers with pending payments:', feeVouchers.length);

//     const pendingPayments = [];

//     for (const voucher of feeVouchers) {
//       const pendingHistoryItems = voucher.paymentHistory.filter(
//         (payment) => payment.status === 'pending'
//       );

//       for (let index = 0; index < voucher.paymentHistory.length; index++) {
//         const payment = voucher.paymentHistory[index];
//         if (payment.status === 'pending') {
//           pendingPayments.push({
//             paymentId: `${voucher._id}-${index}`,
//             voucherId: voucher._id.toString(),
//             paymentIndex: index,
//             voucherNumber: voucher.voucherNumber,
//             studentName: voucher.studentId?.fullName || `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() || 'Unknown',
//             className: voucher.classId?.name || 'N/A',
//             branchName: voucher.branchId?.name || 'N/A',
//             amount: payment.amount,
//             currency: 'PKR',
//             paymentMethod: payment.paymentMethod,
//             paymentDate: payment.paymentDate,
//             transactionId: payment.transactionId,
//             screenshotUrl: payment.screenshot?.url,
//             remarks: payment.remarks,
//             submittedBy: payment.submittedBy,
//             status: payment.status
//           });
//         }
//       }
//     }

//     // Sort by latest payment date first
//     pendingPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

//     console.log('Super Admin - Total pending payments:', pendingPayments.length);

//     return NextResponse.json({
//       success: true,
//       data: pendingPayments,
//       total: pendingPayments.length
//     });
//   } catch (error) {
//     console.error('Error fetching pending fees:', error);
//     return NextResponse.json({
//       success: false,
//       message: error.message || 'Failed to fetch pending fees'
//     }, { status: 500 });
//   }
// });

// export async function GET(request, context) {
//   return handler(request, context);
// }
