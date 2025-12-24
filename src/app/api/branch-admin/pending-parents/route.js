import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, user) => {
  try {
    await connectDB();

    const branchId = user.branchId;

    // Find all pending parents (not approved)
    const pendingParents = await User.find({
      role: 'parent',
      approved: false
    }).sort({ createdAt: -1 });

    // Filter to only include parents who have children to match
    const parentsWithChildren = pendingParents.filter(parent =>
      parent.parentProfile?.children?.length > 0
    );

    return NextResponse.json({ parents: parentsWithChildren });
  } catch (error) {
    console.error('Get pending parents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('branch_admin')]);
