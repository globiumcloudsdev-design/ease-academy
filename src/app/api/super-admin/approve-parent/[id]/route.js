import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import User from '@/backend/models/User';

export const POST = withAuth(async (request, user, userDoc, context) => {
  try {
    const { params } = context || {};
    const id = params?.id;
    const body = await request.json();
    const { childrenMapping } = body; // { childIndex: studentId }

    await connectDB();

    const parent = await User.findById(id);
    if (!parent || parent.role !== 'parent') {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    if (parent.approved || parent.status === 'approved' || parent.status === 'active') {
      return NextResponse.json({ error: 'Parent already approved' }, { status: 400 });
    }

    // Update parent status
    parent.approved = true;
    parent.isActive = true;
    parent.status = 'approved';
    parent.approvedBy = user.userId;
    parent.approvedAt = new Date();

    // Link matched children if provided
    if (childrenMapping && typeof childrenMapping === 'object') {
      if (!parent.parentProfile) {
        parent.parentProfile = { children: [] };
      }
      
      // Update children array with matched student IDs
      for (const [childIndex, studentId] of Object.entries(childrenMapping)) {
        const idx = parseInt(childIndex);
        if (parent.parentProfile.children[idx]) {
          parent.parentProfile.children[idx].id = studentId;
        }
      }
    }

    await parent.save();

    return NextResponse.json({
      success: true,
      message: 'Parent approved successfully',
      parent: {
        _id: parent._id,
        fullName: parent.fullName,
        email: parent.email,
        status: parent.status,
        approvedAt: parent.approvedAt,
      }
    });

  } catch (error) {
    console.error('Error approving parent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole(ROLES.SUPER_ADMIN)]);
