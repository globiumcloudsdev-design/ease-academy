import { NextResponse as NextResp } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import {
  uploadProfilePhoto,
  uploadStudentDocument,
  uploadTeacherDocument,
  uploadStaffDocument,
  deleteFromCloudinary,
} from '@/lib/cloudinary';
import User from '@/backend/models/User';
import dbConnect from '@/lib/database';
// Ensure Node runtime so Buffer is available for binary handling
export const runtime = 'nodejs';

/**
 * POST - Upload file to Cloudinary
 * Supports: Profile Photos, Student Documents, Teacher CV/Resume, Staff Documents
 */
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file');
    const fileType = formData.get('fileType'); // 'profile' | 'student_document' | 'teacher_document' | 'staff_document'
    const documentType = formData.get('documentType'); // 'b_form', 'cv', 'resume', etc.
    const userId = formData.get('userId') || authenticatedUser.userId;

    if (!file) {
      return NextResp.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!fileType) {
      return NextResp.json(
        { success: false, message: 'File type is required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

    let uploadResult;
    let updateQuery = {};

    // Handle different file types
    switch (fileType) {
      case 'profile':
        uploadResult = await uploadProfilePhoto(base64File, userId);
        updateQuery = {
          profilePhoto: {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            uploadedAt: new Date(),
          },
        };
        break;

      case 'student_document':
        if (!documentType) {
          return NextResp.json(
            { success: false, message: 'Document type is required for student documents' },
            { status: 400 }
          );
        }
        uploadResult = await uploadStudentDocument(base64File, userId, documentType);
        
        // Add to studentProfile.documents array
        const studentUser = await User.findById(userId);
        if (!studentUser || studentUser.role !== 'student') {
          return NextResp.json(
            { success: false, message: 'User is not a student' },
            { status: 400 }
          );
        }

        studentUser.studentProfile = studentUser.studentProfile || {};
        studentUser.studentProfile.documents = studentUser.studentProfile.documents || [];
        studentUser.studentProfile.documents.push({
          type: documentType,
          name: file.name,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          uploadedAt: new Date(),
        });

        await studentUser.save();
        
        return NextResp.json({
          success: true,
          message: 'Student document uploaded successfully',
          data: uploadResult,
        });

      case 'teacher_document':
        if (!documentType) {
          return NextResp.json(
            { success: false, message: 'Document type is required for teacher documents' },
            { status: 400 }
          );
        }
        uploadResult = await uploadTeacherDocument(base64File, userId, documentType);
        
        // Add to teacherProfile.documents array
        const teacherUser = await User.findById(userId);
        if (!teacherUser || teacherUser.role !== 'teacher') {
          return NextResp.json(
            { success: false, message: 'User is not a teacher' },
            { status: 400 }
          );
        }

        teacherUser.teacherProfile = teacherUser.teacherProfile || {};
        teacherUser.teacherProfile.documents = teacherUser.teacherProfile.documents || [];
        teacherUser.teacherProfile.documents.push({
          type: documentType,
          name: file.name,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          uploadedAt: new Date(),
        });

        await teacherUser.save();
        
        return NextResp.json({
          success: true,
          message: 'Teacher document uploaded successfully',
          data: uploadResult,
        });

      case 'admin_document':
        if (!documentType) {
          return NextResp.json(
            { success: false, message: 'Document type is required for admin documents' },
            { status: 400 }
          );
        }
        uploadResult = await uploadTeacherDocument(base64File, userId, documentType); // reuse teacher upload path

        // Add to adminProfile.documents array
        const adminUser = await User.findById(userId);
        if (!adminUser || !['branch_admin', 'super_admin', 'admin'].includes(adminUser.role)) {
          return NextResp.json(
            { success: false, message: 'User is not an admin' },
            { status: 400 }
          );
        }

        adminUser.adminProfile = adminUser.adminProfile || {};
        adminUser.adminProfile.documents = adminUser.adminProfile.documents || [];
        adminUser.adminProfile.documents.push({
          type: documentType,
          name: file.name,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          uploadedAt: new Date(),
        });

        await adminUser.save();

        return NextResp.json({
          success: true,
          message: 'Admin document uploaded successfully',
          data: uploadResult,
        });

      case 'staff_document':
        if (!documentType) {
          return NextResp.json(
            { success: false, message: 'Document type is required for staff documents' },
            { status: 400 }
          );
        }
        uploadResult = await uploadStaffDocument(base64File, userId, documentType);
        
        // Add to staffProfile.documents array
        const staffUser = await User.findById(userId);
        if (!staffUser || staffUser.role !== 'staff') {
          return NextResp.json(
            { success: false, message: 'User is not a staff member' },
            { status: 400 }
          );
        }

        staffUser.staffProfile = staffUser.staffProfile || {};
        staffUser.staffProfile.documents = staffUser.staffProfile.documents || [];
        staffUser.staffProfile.documents.push({
          type: documentType,
          name: file.name,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          uploadedAt: new Date(),
        });

        await staffUser.save();
        
        return NextResp.json({
          success: true,
          message: 'Staff document uploaded successfully',
          data: uploadResult,
        });

      default:
        return NextResp.json(
          { success: false, message: 'Invalid file type' },
          { status: 400 }
        );
    }

    // Update user profile photo (if applicable)
    if (fileType === 'profile') {
      await User.findByIdAndUpdate(userId, updateQuery);
    }

      return NextResp.json({
      success: true,
      message: 'File uploaded successfully',
      data: uploadResult,
    });
    } catch (error) {
    console.error('File upload error:', error);
    return NextResp.json(
      { success: false, message: 'Failed to upload file', error: error.message },
      { status: 500 }
    );
  }
});

/**
 * DELETE - Delete file from Cloudinary
 */
export const DELETE = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    const userId = searchParams.get('userId') || authenticatedUser.userId;
    const fileType = searchParams.get('fileType');
    const documentId = searchParams.get('documentId');

    if (!publicId) {
      return NextResp.json(
        { success: false, message: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(publicId, 'auto');

    // Remove from database
    const user = await User.findById(userId);
    if (!user) {
      return NextResp.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Handle different file types
    if (fileType === 'profile') {
      user.profilePhoto = { url: null, publicId: null, uploadedAt: null };
    } else if (fileType === 'student_document' && documentId) {
      user.studentProfile.documents = user.studentProfile.documents.filter(
        doc => doc._id.toString() !== documentId
      );
    } else if (fileType === 'teacher_document' && documentId) {
      user.teacherProfile.documents = user.teacherProfile.documents.filter(
        doc => doc._id.toString() !== documentId
      );
    } else if (fileType === 'staff_document' && documentId) {
      user.staffProfile.documents = user.staffProfile.documents.filter(
        doc => doc._id.toString() !== documentId
      );
    }

    await user.save();

    return NextResp.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete error:', error);
  return NextResp.json({ success: false, message: error.message || 'Delete failed' }, { status: 500 });
  }
});

