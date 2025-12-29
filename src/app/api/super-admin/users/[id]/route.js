import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/backend/utils/emailService';
import { getAdminEmailTemplate } from '@/backend/templates/adminEmail';
import connectDB from '@/lib/database';
import { uploadStudentDocument, deleteFromCloudinary } from '@/lib/cloudinary';

// GET - Get single user
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    
    // Extract userId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1];

    const user = await User.findById(userId)
      .populate('branchId', 'name code address contact')
      .select('-passwordHash -refreshToken');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// PUT - Update user
export const PUT = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    
    // Extract userId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1];
    
    const body = await request.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Keep previous snapshot for change detection
    const prev = user.toObject ? user.toObject() : { isActive: user.isActive };

    // Update basic user fields
    if (body.firstName !== undefined) user.firstName = body.firstName;
    if (body.lastName !== undefined) user.lastName = body.lastName;
    if (body.fullName) user.fullName = body.fullName;
    if (body.email) user.email = body.email.toLowerCase();
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.alternatePhone !== undefined) user.alternatePhone = body.alternatePhone;
    if (body.dateOfBirth !== undefined) user.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : undefined;
    if (body.gender !== undefined) user.gender = body.gender;
    if (body.nationality !== undefined) user.nationality = body.nationality;
    if (body.cnic !== undefined) user.cnic = body.cnic;
    if (body.religion !== undefined) user.religion = body.religion;
    if (body.bloodGroup !== undefined) user.bloodGroup = body.bloodGroup;
    if (body.address !== undefined) user.address = body.address;
    if (body.role) user.role = body.role;
    if (body.branchId !== undefined) user.branchId = body.role === 'super_admin' ? null : body.branchId;
    if (body.permissions !== undefined) user.permissions = body.permissions;
    if (body.isActive !== undefined) user.isActive = body.isActive;
    if (body.status !== undefined) user.status = body.status;

    // Handle profile photo updates
    if (body.profilePhoto && typeof body.profilePhoto === 'object') {
      user.profilePhoto = {
        url: body.profilePhoto.url || '',
        publicId: body.profilePhoto.publicId || '',
        uploadedAt: body.profilePhoto.uploadedAt || new Date(),
      };
    }

    // Handle profile photo upload if provided as base64
    if (body.pendingProfileFile && typeof body.pendingProfileFile === 'string' && body.pendingProfileFile.startsWith('data:image')) {
      try {
        const { uploadToCloudinary } = await import('@/lib/cloudinary');
        const uploadResult = await uploadToCloudinary(body.pendingProfileFile, `students/profiles/${user._id}`);
        user.profilePhoto = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          uploadedAt: new Date(),
        };
      } catch (err) {
        console.error('Failed to upload profile photo:', err);
      }
    }

    // Update password if provided (will be hashed by pre-save hook)
    const password = body.password;
    if (password) {
      user.passwordHash = password;
    }

    // Initialize studentProfile if it doesn't exist and role is student
    if (user.role === 'student') {
      user.studentProfile = user.studentProfile || {};

      // Handle studentProfile updates (support both nested and flat)
      if (body.studentProfile && typeof body.studentProfile === 'object') {
        // Direct studentProfile object from form
        const sp = body.studentProfile;
        
        if (sp.classId !== undefined) user.studentProfile.classId = sp.classId;
        if (sp.departmentId !== undefined) user.studentProfile.departmentId = sp.departmentId;
        if (sp.section !== undefined) user.studentProfile.section = sp.section;
        if (sp.rollNumber !== undefined) user.studentProfile.rollNumber = sp.rollNumber;
        if (sp.admissionDate !== undefined) user.studentProfile.admissionDate = sp.admissionDate;
        if (sp.academicYear !== undefined) user.studentProfile.academicYear = sp.academicYear;
        if (sp.guardianType !== undefined) user.studentProfile.guardianType = sp.guardianType;
        
        // Preserve and merge previousSchool
        if (sp.previousSchool) {
          user.studentProfile.previousSchool = {
            ...(user.studentProfile.previousSchool || {}),
            ...sp.previousSchool,
          };
        }
        
        // Preserve and merge father
        if (sp.father) {
          user.studentProfile.father = {
            ...(user.studentProfile.father || {}),
            ...sp.father,
          };
        }
        
        // Preserve and merge mother
        if (sp.mother) {
          user.studentProfile.mother = {
            ...(user.studentProfile.mother || {}),
            ...sp.mother,
          };
        }
        
        // Preserve and merge guardian
        if (sp.guardian) {
          user.studentProfile.guardian = {
            ...(user.studentProfile.guardian || {}),
            ...sp.guardian,
          };
        }
        
        // Preserve and merge feeDiscount
        if (sp.feeDiscount) {
          user.studentProfile.feeDiscount = {
            ...(user.studentProfile.feeDiscount || {}),
            ...sp.feeDiscount,
          };
        }
        
        // Preserve and merge transportFee
        if (sp.transportFee) {
          user.studentProfile.transportFee = {
            ...(user.studentProfile.transportFee || {}),
            ...sp.transportFee,
          };
        }
        
        if (sp.documents !== undefined) user.studentProfile.documents = sp.documents;
      }

      // Handle flat structure (for backward compatibility)
      if (body.classId !== undefined) {
        user.studentProfile.classId = body.classId;
      }
      if (body.guardianType !== undefined) {
        user.studentProfile.guardianType = body.guardianType;
      }
      if (body.section !== undefined) {
        user.studentProfile.section = body.section;
      }
      if (body.rollNumber !== undefined) {
        user.studentProfile.rollNumber = body.rollNumber;
      }
      if (body.admissionDate !== undefined) {
        user.studentProfile.admissionDate = body.admissionDate;
      }
      if (body.academicYear !== undefined) {
        user.studentProfile.academicYear = body.academicYear;
      }
      if (body.documents !== undefined) {
        user.studentProfile.documents = body.documents;
      }

      // Ensure registration number and roll number are generated if missing
      if (!user.studentProfile.registrationNumber && user.branchId) {
        const Branch = (await import('@/backend/models/Branch')).default;
        const branch = await Branch.findById(user.branchId);
        if (branch) {
          if (typeof user.generateRegistrationNumber === 'function') {
            user.studentProfile.registrationNumber = await user.generateRegistrationNumber(branch.code);
          } else {
            const year = new Date().getFullYear().toString().slice(-2);
            const count = await User.countDocuments({
              role: 'student',
              branchId: user.branchId,
            });
            user.studentProfile.registrationNumber = `${branch.code}-${year}-${String(count + 1).padStart(4, '0')}`;
          }
        }
      }
      
      if (!user.studentProfile.rollNumber && user.branchId && user.studentProfile.classId) {
        // Fallback if method is not available due to model caching
        if (typeof user.generateRollNumber === 'function') {
          user.studentProfile.rollNumber = await user.generateRollNumber();
        } else {
          let rollNumber;
          let exists = true;
          while (exists) {
            rollNumber = Math.floor(100000 + Math.random() * 900000).toString();
            const existing = await User.findOne({
              role: 'student',
              branchId: user.branchId,
              'studentProfile.classId': user.studentProfile.classId,
              'studentProfile.rollNumber': rollNumber
            });
            if (!existing) exists = false;
          }
          user.studentProfile.rollNumber = rollNumber;
        }
      }
    }

    user.updatedBy = authenticatedUser.userId;
    await user.save();

    // Generate QR payload and upload to Cloudinary if missing
    if (user.role === 'student' && (!user.studentProfile?.qr?.url)) {
      try {
        const { generateStudentQR } = await import('@/lib/qr-generator');
        const { uploadQR } = await import('@/lib/cloudinary');
        const qrDataUrl = await generateStudentQR(user);
        if (qrDataUrl) {
          const uploadResult = await uploadQR(qrDataUrl, user._id, 'student');
          user.studentProfile.qr = {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            uploadedAt: new Date()
          };
          await user.save();
        }
      } catch (err) {
        console.error('Failed to generate QR for student:', err);
      }
    }

    const userResponse = user.toJSON();

    // Send emails for admin roles (non-blocking)
    try {
      const adminRoles = ['branch_admin', 'super_admin', 'admin'];
      const schoolName = process.env.SCHOOL_NAME || 'Ease Academy';
      if (adminRoles.includes(user.role)) {
        const adminForEmail = user.toObject ? user.toObject() : userResponse;

        // If password changed, include temp password for email template
        if (password) adminForEmail.tempPassword = password;

        // Send updated notification
        try {
          const htmlUpdate = getAdminEmailTemplate('ADMIN_UPDATED', adminForEmail, schoolName);
          await sendEmail(user.email, `${schoolName} - Administrator Profile Updated`, htmlUpdate);
        } catch (err) {
          console.error('Failed to send admin updated email:', err);
        }

        // If active status changed, send status email
        if (prev.isActive !== undefined && prev.isActive !== user.isActive) {
          try {
            const htmlStatus = getAdminEmailTemplate('ADMIN_STATUS_CHANGED', adminForEmail, schoolName);
            await sendEmail(user.email, `${schoolName} - Account Status Changed`, htmlStatus);
          } catch (err) {
            console.error('Failed to send admin status email:', err);
          }
        }

        // If password was changed, send password reset email
        if (password) {
          try {
            const htmlPw = getAdminEmailTemplate('ADMIN_PASSWORD_RESET', adminForEmail, schoolName);
            await sendEmail(user.email, `${schoolName} - Password Reset`, htmlPw);
          } catch (err) {
            console.error('Failed to send admin password reset email:', err);
          }
        }
      }
    } catch (err) {
      console.error('Admin email notifications failed:', err);
    }

    // Handle document deletions (for students only)
    if (user.role === 'student' && body.documentsToDelete && Array.isArray(body.documentsToDelete) && body.documentsToDelete.length > 0) {
      try {
        user.studentProfile = user.studentProfile || {};
        user.studentProfile.documents = user.studentProfile.documents || [];

        for (const docToDelete of body.documentsToDelete) {
          // Remove from documents array
          user.studentProfile.documents = user.studentProfile.documents.filter(
            doc => doc.publicId !== docToDelete.publicId
          );

          // Delete from Cloudinary
          try {
            await deleteFromCloudinary(docToDelete.publicId);
          } catch (cloudErr) {
            console.error('Failed to delete document from Cloudinary:', cloudErr);
          }
        }

        await user.save();
      } catch (err) {
        console.error('Failed to delete documents for student:', err);
      }
    }

    // Handle document uploads (for students only)
    if (user.role === 'student' && body.pendingDocuments && Array.isArray(body.pendingDocuments) && body.pendingDocuments.length > 0) {
      try {
        user.studentProfile = user.studentProfile || {};
        user.studentProfile.documents = user.studentProfile.documents || [];

        for (const doc of body.pendingDocuments) {
          if (doc.file && typeof doc.file === 'string' && doc.file.startsWith('data:')) {
            const uploadResult = await uploadStudentDocument(doc.file, user._id, doc.type || 'other');

            user.studentProfile.documents.push({
              type: doc.type || 'other',
              name: doc.name || 'Document',
              url: uploadResult.url,
              publicId: uploadResult.publicId,
              uploadedAt: new Date(),
            });
          }
        }

        await user.save();
      } catch (err) {
        console.error('Failed to upload documents for student:', err);
        // Don't fail the entire operation for document upload errors
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: { user: userResponse },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// DELETE - Delete user
export const DELETE = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();
    
    // Extract userId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1];

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
      },
      { status: 500 }
    );
  }
});
