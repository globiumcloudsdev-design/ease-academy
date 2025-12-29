import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import FeeVoucher from '@/backend/models/FeeVoucher';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import FeeTemplate from '@/backend/models/FeeTemplate';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId, id } = await context.params || {};
    await connectDB();

    // Verify parent owns child
    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Verify voucher belongs to child
    const voucher = await FeeVoucher.findById(id);
    if (!voucher) {
      return NextResponse.json({ success: false, message: 'Fee voucher not found' }, { status: 404 });
    }

    if (voucher.studentId.toString() !== childId) {
      return NextResponse.json({ success: false, message: 'Voucher does not belong to this student' }, { status: 403 });
    }

    // Check if already paid
    if (voucher.status === 'paid') {
      return NextResponse.json({ success: false, message: 'Voucher already paid' }, { status: 400 });
    }

    const formData = await request.formData();
    const amount = parseFloat(formData.get('amount'));
    const paymentMethod = formData.get('paymentMethod');
    const transactionId = formData.get('transactionId');
    const remarks = formData.get('remarks');
    const screenshot = formData.get('screenshot');

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Valid amount is required' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ success: false, message: 'Payment method is required' }, { status: 400 });
    }

    if (!screenshot) {
      return NextResponse.json({ success: false, message: 'Payment screenshot is required' }, { status: 400 });
    }

    // Check if amount exceeds remaining amount
    if (amount > voucher.remainingAmount) {
      return NextResponse.json({ 
        success: false, 
        message: `Amount cannot exceed remaining amount (${voucher.remainingAmount})` 
      }, { status: 400 });
    }

    // Upload screenshot to Cloudinary
    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${screenshot.type};base64,${base64}`;

    const uploadResult = await uploadToCloudinary(dataUrl, {
      folder: `ease-academy/students/${childId}/fee-payments/${id}`,
      resourceType: 'image',
    });

    // Add payment to history with pending approval status
    const payment = {
      amount,
      paymentDate: new Date(),
      paymentMethod,
      transactionId: transactionId || `TXN-${Date.now()}`,
      screenshot: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      },
      remarks,
      status: 'pending', // Pending admin approval
      submittedBy: userDoc._id,
    };

    voucher.paymentHistory.push(payment);
    
    // Don't update paid amount yet - wait for admin approval
    // Just save the payment record
    await voucher.save();

    return NextResponse.json({
      success: true,
      message: 'Payment submitted for approval',
      payment: {
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('Error submitting payment:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to submit payment' 
    }, { status: 500 });
  }
});

export async function POST(request, context) {
  return handler(request, context);
}
