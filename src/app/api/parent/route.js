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

    // Get parent basic doc (we'll fetch children separately to ensure nested populates work reliably)
    const parent = await User.findById(userDoc._id).lean();

    // If no children, return early
    const childRefs = parent?.parentProfile?.children || [];
    if (!childRefs || childRefs.length === 0) {
      return NextResponse.json({ success: true, children: [] });
    }

    // Collect child IDs from parent profile (support both {id: ObjectId} and plain id)
    const childIds = childRefs.map((c) => (c?.id?._id ? c.id._id.toString() : (c?.id ? c.id.toString() : null))).filter(Boolean);

    // Fetch child user docs with explicit nested populates (class -> grade, branch)
    const childDocs = await User.find({ _id: { $in: childIds } })
      .select('role firstName lastName fullName email phone profilePhoto dateOfBirth gender bloodGroup studentProfile branchId')
      .populate({
        path: 'studentProfile.classId',
        model: 'Class',
        select: 'name code sections academicYear status grade',
        populate: {
          path: 'grade',
          model: 'Grade',
          select: 'name code level description'
        }
      })
      .populate({
        path: 'branchId',
        model: 'Branch',
        select: 'name code address contact location bankAccounts admin status settings'
      })
      .lean();

    // Build a lookup map by id for easy merging
    const childMap = {};
    for (const cd of childDocs) {
      childMap[cd._id.toString()] = cd;
    }

    if (!parent || !parent.parentProfile || !parent.parentProfile.children) {
      return NextResponse.json({ success: true, children: [] });
    }

    // Map children with complete details using populated child docs
    const children = parent.parentProfile.children.map(child => {
      const childId = child?.id?._id?.toString() || (child?.id ? child.id.toString() : null);
      const childDoc = childMap[childId] || {};

      return {
        id: childId || child.id,
        name: child.name || childDoc.fullName || `${childDoc.firstName || ''} ${childDoc.lastName || ''}`.trim() || 'Unknown',
        fullName: childDoc.fullName || `${childDoc.firstName || ''} ${childDoc.lastName || ''}`.trim(),
        registrationNumber: child.registrationNumber || childDoc.studentProfile?.registrationNumber || '',
        rollNumber: childDoc.studentProfile?.rollNumber || '',
        email: childDoc.email || '',
        phone: childDoc.phone || '',
        profilePhoto: childDoc.profilePhoto?.url || null,
        dateOfBirth: childDoc.dateOfBirth,
        gender: childDoc.gender,
        bloodGroup: childDoc.bloodGroup,
        class: {
          id: childDoc.studentProfile?.classId?._id?.toString() || null,
          name: childDoc.studentProfile?.classId?.name || '',
          code: childDoc.studentProfile?.classId?.code || '',
          section: child.section || childDoc.studentProfile?.section || '',
          academicYear: childDoc.studentProfile?.classId?.academicYear,
          grade: {
            id: childDoc.studentProfile?.classId?.grade?._id?.toString(),
            name: childDoc.studentProfile?.classId?.grade?.name,
            code: childDoc.studentProfile?.classId?.grade?.code,
            level: childDoc.studentProfile?.classId?.grade?.level,
            description: childDoc.studentProfile?.classId?.grade?.description,
          }
        },
        branch: {
          id: childDoc.branchId?._id?.toString(),
          name: childDoc.branchId?.name,
          code: childDoc.branchId?.code,
          address: childDoc.branchId?.address,
          contact: childDoc.branchId?.contact,
          location: childDoc.branchId?.location,
          bankAccounts: childDoc.branchId?.bankAccounts,
          status: childDoc.branchId?.status,
        },
        admissionDate: childDoc.studentProfile?.admissionDate,
      };
    });

    return NextResponse.json({ success: true, children });
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch children' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
