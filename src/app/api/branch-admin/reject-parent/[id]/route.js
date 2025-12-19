import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import User from '@/backend/models/User';

export const POST = withAuth(async (request, user) => {
  try {
    const params = (request && request.params) || undefined;
    // In withAuth handler, context is third arg; but some Next handlers pass params differently. Use context later if needed.
    // Many routes call withAuth(handler) where handler receives (request, authUser, userDoc, context).
    // However Next passes dynamic route params via the context arg, available as the 4th param. To be safe, check request by trying to read json body first and handle context fallback in middleware.

    // Context fallback will be handled by reading the body and expecting id to be present in params from context
    const contextParams = (arguments && arguments[2] && arguments[2].params) || (arguments && arguments[3] && arguments[3].params);
    const id = contextParams?.id || (params && params.id);

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

    // Check if parent belongs to the branch-admin's branch
    if (parent.branchId?.toString() !== user.branchId?.toString()) {
      return NextResponse.json({ error: 'Unauthorized to reject this parent' }, { status: 403 });
    }

    // Update parent status to rejected
    parent.status = 'rejected';
    parent.rejectionReason = reason;
    parent.rejectedAt = new Date();
    parent.rejectedBy = user.userId;
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
}, [requireRole(ROLES.BRANCH_ADMIN)]);
