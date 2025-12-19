import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { verifyToken } from '@/backend/middleware/auth';
import User from '@/backend/models/User';

export async function POST(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { reason } = await request.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    await connectDB();

    // Find and update the parent
    const parent = await User.findById(id);

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    if (parent.role !== 'parent' || parent.status !== 'pending') {
      return NextResponse.json({ error: 'Invalid parent or already processed' }, { status: 400 });
    }

    // Update parent status to rejected
    parent.status = 'rejected';
    parent.approved = false;
    parent.isActive = false;
    parent.rejectionReason = reason;
    parent.rejectedAt = new Date();
    parent.rejectedBy = decoded.userId;
    await parent.save();

    // Email sending removed as per user request - only backend processing

    return NextResponse.json({
      success: true,
      message: 'Parent rejected successfully',
      parent: {
        _id: parent._id,
        fullName: parent.fullName,
        email: parent.email,
        status: parent.status,
        rejectedAt: parent.rejectedAt,
      }
    });

  } catch (error) {
    console.error('Error rejecting parent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
