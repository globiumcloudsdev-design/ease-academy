import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';

export const GET = withAuth(async (request, user) => {
  try {
    await connectDB();

    const branchId = user.branchId;

    // Find parents with children in this branch
    const parents = await User.find({
      role: 'parent',
      'parentProfile.children.id': {
        $exists: true,
        $ne: null
      }
    }).populate({
      path: 'parentProfile.children.id',
      match: { branchId },
      select: 'fullName studentProfile.registrationNumber studentProfile.classId'
    }).sort({ createdAt: -1 });

    // Filter out parents who don't have children in this branch
    const filteredParents = parents.filter(parent =>
      parent.parentProfile.children.some(child => child.id)
    );

    return NextResponse.json({ parents: filteredParents });
  } catch (error) {
    console.error('Get parents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('branch_admin')]);