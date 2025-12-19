//api/branch-admin/students/[id]/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { sendEmail } from '@/backend/utils/emailService';
import { getStudentEmailTemplate } from '@/backend/templates/studentEmail';
import { generateQRCode } from '@/lib/qr-generator';
import { uploadToCloudinary } from '@/lib/cloudinary';

// GET - Get single student
async function getStudent(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const student = await User.findOne({
      _id: id,
      role: 'student',
      branchId: authenticatedUser.branchId,
    })
      .populate('studentProfile.classId', 'name code grade')
      .lean();

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

// PUT - Update student
async function updateStudent(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const updates = await request.json();

    // Find student and verify it belongs to admin's branch
    const student = await User.findOne({
      _id: id,
      role: 'student',
      branchId: authenticatedUser.branchId,
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Prevent changing branchId and role
    delete updates.branchId;
    delete updates.role;
    delete updates.isEditMode;
    delete updates.studentId;

    // Handle profile photo updates
    if (updates.profilePhoto && typeof updates.profilePhoto === 'object') {
      student.profilePhoto = {
        url: updates.profilePhoto.url || '',
        publicId: updates.profilePhoto.publicId || '',
        uploadedAt: updates.profilePhoto.uploadedAt || new Date(),
      };
      delete updates.profilePhoto;
    }

    // Initialize studentProfile if it doesn't exist
    student.studentProfile = student.studentProfile || {};

    // Handle studentProfile updates (support both nested and flat)
    if (updates.studentProfile && typeof updates.studentProfile === 'object') {
      // Direct studentProfile object from form
      const sp = updates.studentProfile;
      
      if (sp.classId !== undefined) student.studentProfile.classId = sp.classId;
      if (sp.departmentId !== undefined) student.studentProfile.departmentId = sp.departmentId;
      if (sp.section !== undefined) student.studentProfile.section = sp.section;
      if (sp.rollNumber !== undefined) student.studentProfile.rollNumber = sp.rollNumber;
      if (sp.admissionDate !== undefined) student.studentProfile.admissionDate = sp.admissionDate;
      if (sp.academicYear !== undefined) student.studentProfile.academicYear = sp.academicYear;
      if (sp.guardianType !== undefined) student.studentProfile.guardianType = sp.guardianType;
      
      // Preserve and merge previousSchool
      if (sp.previousSchool) {
        student.studentProfile.previousSchool = {
          ...(student.studentProfile.previousSchool || {}),
          ...sp.previousSchool,
        };
      }
      
      // Preserve and merge father
      if (sp.father) {
        student.studentProfile.father = {
          ...(student.studentProfile.father || {}),
          ...sp.father,
        };
      }
      
      // Preserve and merge mother
      if (sp.mother) {
        student.studentProfile.mother = {
          ...(student.studentProfile.mother || {}),
          ...sp.mother,
        };
      }
      
      // Preserve and merge guardian
      if (sp.guardian) {
        student.studentProfile.guardian = {
          ...(student.studentProfile.guardian || {}),
          ...sp.guardian,
        };
      }
      
      // Preserve and merge feeDiscount
      if (sp.feeDiscount) {
        student.studentProfile.feeDiscount = {
          ...(student.studentProfile.feeDiscount || {}),
          ...sp.feeDiscount,
        };
      }
      
      // Preserve and merge transportFee
      if (sp.transportFee) {
        student.studentProfile.transportFee = {
          ...(student.studentProfile.transportFee || {}),
          ...sp.transportFee,
        };
      }
      
      if (sp.documents !== undefined) student.studentProfile.documents = sp.documents;
      
      delete updates.studentProfile;
    }

    // Handle flat structure (for backward compatibility)
    if (updates.classId !== undefined) {
      student.studentProfile.classId = updates.classId;
      delete updates.classId;
    }
    if (updates.guardianType !== undefined) {
      student.studentProfile.guardianType = updates.guardianType;
      delete updates.guardianType;
    }
    if (updates.section !== undefined) {
      student.studentProfile.section = updates.section;
      delete updates.section;
    }
    if (updates.rollNumber !== undefined) {
      student.studentProfile.rollNumber = updates.rollNumber;
      delete updates.rollNumber;
    }
    if (updates.documents !== undefined) {
      student.studentProfile.documents = updates.documents;
      delete updates.documents;
    }

    // Update top-level user fields
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && !key.startsWith('pending')) {
        student[key] = updates[key];
      }
    });

    student.updatedBy = authenticatedUser.userId;
    await student.save();

    // Send update or status-change email
    try {
      if (student.email) {
        if (updates.status && updates.status === 'inactive') {
          const html = getStudentEmailTemplate('STUDENT_DEACTIVATED', student);
          await sendEmail(student.email, 'Account Deactivated', html);
        } else {
          const html = getStudentEmailTemplate('STUDENT_UPDATED', student);
          await sendEmail(student.email, 'Student Record Updated', html);
        }
      }
    } catch (err) {
      console.error('Failed to send student update email:', err);
    }

    // Ensure student has a QR code; generate and upload if missing
    try {
      const hasQr = !!(student.studentProfile && student.studentProfile.qr && student.studentProfile.qr.url);
      if (!hasQr) {
        const qrPayload = {
          id: student._id,
          registrationNumber: student.studentProfile?.registrationNumber || null,
          rollNumber: student.studentProfile?.rollNumber || null,
          firstName: student.firstName,
          lastName: student.lastName,
          branchId: student.branchId,
          classId: student.studentProfile?.classId || null,
        };

        const qrDataUrl = await generateQRCode(JSON.stringify(qrPayload), {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          // width: 350,
        });

        const uploadResult = await uploadToCloudinary(qrDataUrl, {
          folder: `ease-academy/students/${student._id}/qr`,
          resourceType: 'image',
        });

        student.studentProfile = student.studentProfile || {};
        student.studentProfile.qr = {
          url: uploadResult.url || uploadResult.secure_url || '',
          publicId: uploadResult.publicId || uploadResult.public_id || '',
          uploadedAt: new Date(),
        };
        await student.save();
      }
    } catch (err) {
      console.error('Failed to generate/upload QR for student (update):', err);
    }

    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student updated successfully',
    });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE - Delete student
async function deleteStudent(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find student first (verify branch) then delete
    const student = await User.findOne({ 
      _id: id, 
      role: 'student',
      branchId: authenticatedUser.branchId 
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Send deletion/deactivation email before removal
    try {
      if (student.email) {
        const html = getStudentEmailTemplate('STUDENT_DEACTIVATED', student);
        await sendEmail(student.email, 'Account Deleted', html);
      }
    } catch (err) {
      console.error('Failed to send student deletion email:', err);
    }

    await User.findOneAndDelete({ 
      _id: id, 
      role: 'student',
      branchId: authenticatedUser.branchId 
    });

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete student' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStudent);
export const PUT = withAuth(updateStudent);
export const DELETE = withAuth(deleteStudent);
