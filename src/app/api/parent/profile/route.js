import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const parent = await User.findById(authenticatedUser.userId).populate({
      path: 'parentProfile.children.id',
      select: 'fullName studentProfile',
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    return NextResponse.json({ parent });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);

export const PUT = withAuth(async (request, authenticatedUser) => {
  try {
    await connectDB();

    const body = await request.json();
    const { fullName, phone, address, parentProfile } = body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (parentProfile) updateData.parentProfile = { ...parentProfile };

    const parent = await User.findByIdAndUpdate(authenticatedUser.userId, updateData, { new: true });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile updated successfully', parent });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
