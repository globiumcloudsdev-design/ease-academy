import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Class from '@/backend/models/Class';
import Branch from '@/backend/models/Branch';
import Grade from '@/backend/models/Grade';
import Subject from '@/backend/models/Subject';

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

    // Fetch full child details with class and grade populated
    const child = await User.findById(childId)
      .populate({
        path: 'studentProfile.classId',
        select: 'name code sections academicYear status',
        populate: {
          path: 'grade',
          model: 'Grade',
          select: 'name code level description'
        }
      })
      .populate('branchId', 'name code address contact location bankAccounts admin status settings')
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
        section: child.studentProfile?.section,
        academicYear: child.studentProfile?.classId?.academicYear,
        grade: {
          id: child.studentProfile?.classId?.grade?._id?.toString(),
          name: child.studentProfile?.classId?.grade?.name,
          code: child.studentProfile?.classId?.grade?.code,
          level: child.studentProfile?.classId?.grade?.level,
          description: child.studentProfile?.classId?.grade?.description,
        },
      },
      branch: {
        id: child.branchId?._id?.toString(),
        name: child.branchId?.name,
        code: child.branchId?.code,
        address: child.branchId?.address,
        contact: child.branchId?.contact,
        location: child.branchId?.location,
        bankAccounts: child.branchId?.bankAccounts,
        status: child.branchId?.status,
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
