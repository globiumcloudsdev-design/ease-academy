import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';

const handler = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();

    // Get parent with populated children data
    const parent = await User.findById(userDoc._id)
      .populate('parentProfile.children.id', 'fullName firstName lastName email phone studentProfile profilePhoto')
      .lean();

    if (!parent || !parent.parentProfile || !parent.parentProfile.children) {
      return NextResponse.json({ success: true, children: [] });
    }

    // Map children with complete details
    const children = parent.parentProfile.children.map(child => ({
      id: child.id?._id?.toString() || child.id?.toString() || child.id,
      name: child.name || child.id?.fullName || child.id?.firstName || 'Unknown',
      registrationNumber: child.registrationNumber || child.id?.studentProfile?.registrationNumber || '',
      className: child.className || '',
      classId: child.classId?.toString() || child.id?.studentProfile?.classId?.toString() || '',
      section: child.section || child.id?.studentProfile?.section || '',
      rollNumber: child.id?.studentProfile?.rollNumber || '',
      email: child.id?.email || '',
      phone: child.id?.phone || '',
      profilePhoto: child.id?.profilePhoto?.url || null,
    }));

    return NextResponse.json({ success: true, children });
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch children' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
