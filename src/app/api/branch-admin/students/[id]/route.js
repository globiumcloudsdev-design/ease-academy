//api/branch-admin/students/[id]/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { sendEmail } from '@/backend/utils/emailService';
import { getStudentEmailTemplate } from '@/backend/templates/studentEmail';
import { uploadStudentDocument, deleteFromCloudinary } from '@/lib/cloudinary';

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

    // Handle profile photo upload if provided as base64
    if (updates.pendingProfileFile && typeof updates.pendingProfileFile === 'string' && updates.pendingProfileFile.startsWith('data:image')) {
      try {
        const { uploadToCloudinary } = await import('@/lib/cloudinary');
        const uploadResult = await uploadToCloudinary(updates.pendingProfileFile, `students/profiles/${student._id}`);
        student.profilePhoto = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          uploadedAt: new Date(),
        };
      } catch (err) {
        console.error('Failed to upload profile photo:', err);
      }
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
      if (updates[key] !== undefined && !key.startsWith('pending') && key !== 'studentProfile') {
        student[key] = updates[key];
      }
    });

    // Ensure registration number and roll number are generated if missing
    if (!student.studentProfile.registrationNumber && student.branchId) {
      const Branch = (await import('@/backend/models/Branch')).default;
      const branch = await Branch.findById(student.branchId);
      if (branch) {
        if (typeof student.generateRegistrationNumber === 'function') {
          student.studentProfile.registrationNumber = await student.generateRegistrationNumber(branch.code);
        } else {
          const year = new Date().getFullYear().toString().slice(-2);
          const count = await User.countDocuments({
            role: 'student',
            branchId: student.branchId,
          });
          student.studentProfile.registrationNumber = `${branch.code}-${year}-${String(count + 1).padStart(4, '0')}`;
        }
      }
    }
    
    if (!student.studentProfile.rollNumber && student.branchId && student.studentProfile.classId) {
      if (typeof student.generateRollNumber === 'function') {
        student.studentProfile.rollNumber = await student.generateRollNumber();
      } else {
        let rollNumber;
        let exists = true;
        while (exists) {
          rollNumber = Math.floor(100000 + Math.random() * 900000).toString();
          const existing = await User.findOne({
            role: 'student',
            branchId: student.branchId,
            'studentProfile.classId': student.studentProfile.classId,
            'studentProfile.rollNumber': rollNumber
          });
          if (!existing) exists = false;
        }
        student.studentProfile.rollNumber = rollNumber;
      }
    }

    student.updatedBy = authenticatedUser.userId;
    await student.save();

    // Ensure student has a QR code; generate and upload if missing
    try {
      const hasQr = !!(student.studentProfile && student.studentProfile.qr && student.studentProfile.qr.url);
      if (!hasQr) {
        const { generateStudentQR } = await import('@/lib/qr-generator');
        const { uploadQR } = await import('@/lib/cloudinary');
        const qrDataUrl = await generateStudentQR(student);
        if (qrDataUrl) {
          const uploadResult = await uploadQR(qrDataUrl, student._id, 'student');
          student.studentProfile.qr = {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            uploadedAt: new Date()
          };
          await student.save();
        }
      }
    } catch (err) {
      console.error('Failed to generate/upload QR for student (update):', err);
    }

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
        const { generateStudentQR } = await import('@/lib/qr-generator');
        const { uploadQR } = await import('@/lib/cloudinary');
        
        const qrDataUrl = await generateStudentQR(student);
        if (qrDataUrl) {
          const uploadResult = await uploadQR(qrDataUrl, student._id, 'student');
          student.studentProfile = student.studentProfile || {};
          student.studentProfile.qr = {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            uploadedAt: new Date(),
          };
          await student.save();
        }
      }
    } catch (err) {
      console.error('Failed to generate/upload QR for student (update):', err);
    }

    // Handle document deletions
    if (updates.documentsToDelete && Array.isArray(updates.documentsToDelete) && updates.documentsToDelete.length > 0) {
      try {
        student.studentProfile = student.studentProfile || {};
        student.studentProfile.documents = student.studentProfile.documents || [];

        for (const docToDelete of updates.documentsToDelete) {
          // Remove from documents array
          student.studentProfile.documents = student.studentProfile.documents.filter(
            doc => doc.publicId !== docToDelete.publicId
          );

          // Delete from Cloudinary
          try {
            await deleteFromCloudinary(docToDelete.publicId);
          } catch (cloudErr) {
            console.error('Failed to delete document from Cloudinary:', cloudErr);
          }
        }

        await student.save();
      } catch (err) {
        console.error('Failed to delete documents for student:', err);
      }
    }

    // Handle document uploads
    if (updates.pendingDocuments && Array.isArray(updates.pendingDocuments) && updates.pendingDocuments.length > 0) {
      try {
        student.studentProfile = student.studentProfile || {};
        student.studentProfile.documents = student.studentProfile.documents || [];

        for (const doc of updates.pendingDocuments) {
          if (doc.file && typeof doc.file === 'string' && doc.file.startsWith('data:')) {
            const uploadResult = await uploadStudentDocument(doc.file, student._id, doc.type || 'other');

            student.studentProfile.documents.push({
              type: doc.type || 'other',
              name: doc.name || 'Document',
              url: uploadResult.url,
              publicId: uploadResult.publicId,
              uploadedAt: new Date(),
            });
          }
        }

        await student.save();
      } catch (err) {
        console.error('Failed to upload documents for student:', err);
        // Don't fail the entire operation for document upload errors
      }
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
