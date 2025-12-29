import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    // Check if parent owns this child
    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => 
      c.id?.toString() === childId
    );

    if (!ownsChild) {
      return NextResponse.json({ success: false, message: 'Access denied to this child' }, { status: 403 });
    }

    // Fetch full child details
    const child = await User.findById(childId)
      .populate('studentProfile.classId', 'name code grade section')
      .populate('branchId', 'name code')
      .lean();

    if (!child) {
      return NextResponse.json({ success: false, message: 'Child not found' }, { status: 404 });
    }

    const childData = {
      id: child._id.toString(),
      fullName: child.fullName || `${child.firstName || ''} ${child.lastName || ''}`.trim(),
      email: child.email,
      phone: child.phone,
      registrationNumber: child.studentProfile?.registrationNumber || '',
      rollNumber: child.studentProfile?.rollNumber || '',
      class: {
        id: child.studentProfile?.classId?._id?.toString(),
        name: child.studentProfile?.classId?.name,
        code: child.studentProfile?.classId?.code,
        grade: child.studentProfile?.classId?.grade,
        section: child.studentProfile?.section,
      },
      branch: {
        id: child.branchId?._id?.toString(),
        name: child.branchId?.name,
      },
      profilePhoto: child.profilePhoto?.url,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      bloodGroup: child.bloodGroup,
      admissionDate: child.studentProfile?.admissionDate,
    };

    return NextResponse.json({ success: true, child: childData });
  } catch (error) {
    console.error('Error fetching child details:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch child details' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
