import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';

export const POST = withAuth(async (request, user, userDoc, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { childrenMapping } = body; // { childIndex: studentId }

    const parent = await User.findById(id);
    if (!parent || parent.role !== 'parent') {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    if (parent.approved) {
      return NextResponse.json({ error: 'Parent already approved' }, { status: 400 });
    }

    // Update parent status
    parent.approved = true;
    parent.isActive = true;

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
      message: 'Parent approved successfully' 
    });
  } catch (error) {
    console.error('Approve parent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('branch_admin')]);
