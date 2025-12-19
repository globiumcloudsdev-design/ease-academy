import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, user) => {
  try {
    await connectDB();

    // Find all parents who are pending
    const pendingParents = await User.find({
      role: 'parent',
      status: 'pending',
    }).populate({
      path: 'parentProfile.children.id',
      select: 'fullName studentProfile.registrationNumber studentProfile.classId branchId'
    }).sort({ createdAt: -1 });

    return NextResponse.json({ parents: pendingParents });
  } catch (error) {
    console.error('Get pending parents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('super_admin')]);
