import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Class from '@/backend/models/Class';
import Branch from '@/backend/models/Branch';
import Grade from '@/backend/models/Grade';
import Subject from '@/backend/models/Subject';

const handler = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();

    // Get parent with populated children data including class, grade, and branch
    const parent = await User.findById(userDoc._id)
      .populate({
        path: 'parentProfile.children.id',
        select: 'fullName firstName lastName email phone studentProfile profilePhoto dateOfBirth gender bloodGroup',
        populate: [
          {
            path: 'studentProfile.classId',
            model: 'Class',
            select: 'name code sections academicYear status',
            populate: {
              path: 'grade',
              model: 'Grade',
              select: 'name code level description'
            }
          },
          {
            path: 'branchId',
            model: 'Branch',
            select: 'name code address contact location bankAccounts admin status settings'
          }
        ]
      })
      .lean();

    if (!parent || !parent.parentProfile || !parent.parentProfile.children) {
      return NextResponse.json({ success: true, children: [] });
    }

    // Map children with complete details
    const children = parent.parentProfile.children.map(child => ({
      id: child.id?._id?.toString() || child.id?.toString() || child.id,
      name: child.name || child.id?.fullName || child.id?.firstName || 'Unknown',
      fullName: child.id?.fullName || `${child.id?.firstName || ''} ${child.id?.lastName || ''}`.trim(),
      registrationNumber: child.registrationNumber || child.id?.studentProfile?.registrationNumber || '',
      rollNumber: child.id?.studentProfile?.rollNumber || '',
      email: child.id?.email || '',
      phone: child.id?.phone || '',
      profilePhoto: child.id?.profilePhoto?.url || null,
      dateOfBirth: child.id?.dateOfBirth,
      gender: child.id?.gender,
      bloodGroup: child.id?.bloodGroup,
      class: {
        id: child.classId?.toString() || child.id?.studentProfile?.classId?._id?.toString(),
        name: child.className || child.id?.studentProfile?.classId?.name || '',
        code: child.id?.studentProfile?.classId?.code || '',
        section: child.section || child.id?.studentProfile?.section || '',
        academicYear: child.id?.studentProfile?.classId?.academicYear,
        grade: {
          id: child.id?.studentProfile?.classId?.grade?._id?.toString(),
          name: child.id?.studentProfile?.classId?.grade?.name,
          code: child.id?.studentProfile?.classId?.grade?.code,
          level: child.id?.studentProfile?.classId?.grade?.level,
          description: child.id?.studentProfile?.classId?.grade?.description,
        }
      },
      branch: {
        id: child.id?.branchId?._id?.toString(),
        name: child.id?.branchId?.name,
        code: child.id?.branchId?.code,
        address: child.id?.branchId?.address,
        contact: child.id?.branchId?.contact,
        location: child.id?.branchId?.location,
        bankAccounts: child.id?.branchId?.bankAccounts,
        status: child.id?.branchId?.status,
      },
      admissionDate: child.id?.studentProfile?.admissionDate,
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
