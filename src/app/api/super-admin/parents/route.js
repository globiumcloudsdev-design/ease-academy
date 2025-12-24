import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';

export const GET = withAuth(async (request, user) => {
  try {
    await connectDB();

    // Find all parents
    const parents = await User.find({
      role: 'parent',
    }).populate({
      path: 'parentProfile.children.id',
      select: 'fullName studentProfile.registrationNumber studentProfile.classId branchId'
    }).sort({ createdAt: -1 });

    return NextResponse.json({ parents });
  } catch (error) {
    console.error('Get parents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('super_admin')]);