import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { sendEmail } from '@/backend/utils/emailService';
import { getTeacherEmailTemplate } from '@/backend/templates/teacherEmail';
import { generateTeacherQR } from '@/lib/qr-generator';
import { uploadToCloudinary } from '@/lib/cloudinary';

// GET - Get single teacher
async function getTeacher(request, authenticatedUser, userDoc, context) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { params } = context || {};
    let { id } = params || {};
    if (!id) {
      // fallback: extract id from URL path
      try {
        const url = new URL(request.url);
        const parts = url.pathname.split('/').filter(Boolean);
        id = parts[parts.length - 1];
      } catch (e) {
        id = undefined;
      }
    }

    const teacher = await User.findOne({
      _id: id,
      role: 'teacher',
      branchId: authenticatedUser.branchId,
    })
      .populate('teacherProfile.departmentId', 'name code')
      .populate('teacherProfile.subjects', 'name code')
      .lean();

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch teacher' },
      { status: 500 }
    );
  }
}

// PUT - Update teacher
async function updateTeacher(request, authenticatedUser, userDoc, context) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { params } = context || {};
    let { id } = params || {};
    if (!id) {
      try {
        const url = new URL(request.url);
        const parts = url.pathname.split('/').filter(Boolean);
        id = parts[parts.length - 1];
      } catch (e) {
        id = undefined;
      }
    }
    const updates = await request.json();

    // Find teacher and verify it belongs to admin's branch
    const teacher = await User.findOne({
      _id: id,
      role: 'teacher',
      branchId: authenticatedUser.branchId,
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // If client sent nested teacherProfile object, lift all fields to top level
    if (updates.teacherProfile && typeof updates.teacherProfile === 'object') {
      Object.assign(updates, updates.teacherProfile);
      delete updates.teacherProfile;
    }

    // Remove empty-string values from updates to avoid invalid enum/ObjectId casts
    const removeEmptyStrings = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      Object.keys(obj).forEach((k) => {
        const v = obj[k];
        if (v === '') {
          delete obj[k];
        } else if (Array.isArray(v)) {
          obj[k] = v.map((item) => (typeof item === 'object' ? removeEmptyStrings(item) : item)).filter((item) => item !== undefined);
          if (obj[k].length === 0) delete obj[k];
        } else if (v && typeof v === 'object') {
          removeEmptyStrings(v);
          if (Object.keys(v).length === 0) delete obj[k];
        }
      });
      return obj;
    };

    removeEmptyStrings(updates);

    // Prevent changing branchId and role
    delete updates.branchId;
    delete updates.role;

    // Handle profile photo updates
    if (updates.profilePhoto && typeof updates.profilePhoto === 'object') {
      teacher.profilePhoto = {
        url: updates.profilePhoto.url || '',
        publicId: updates.profilePhoto.publicId || '',
        uploadedAt: updates.profilePhoto.uploadedAt || new Date(),
      };
      delete updates.profilePhoto;
    }

    // Handle teacherProfile updates
    if (updates.designation || updates.department || updates.basicSalary || updates.allowances || updates.bankAccount || updates.salaryDetails) {
      teacher.teacherProfile = teacher.teacherProfile || {};
      
      if (updates.designation) {
        teacher.teacherProfile.designation = updates.designation;
        delete updates.designation;
      }
      if (updates.department !== undefined) {
        if (typeof updates.department === 'string' && updates.department.trim()) {
          teacher.teacherProfile.department = updates.department;
        }
        delete updates.department;
      }
      if (updates.departmentId) {
        teacher.teacherProfile.departmentId = updates.departmentId;
        delete updates.departmentId;
      }
      // apply employeeId update if provided
      if (updates.employeeId !== undefined) {
        teacher.teacherProfile.employeeId = updates.employeeId;
        delete updates.employeeId;
      }
      
      // Handle salary updates
      if (updates.basicSalary !== undefined || updates.allowances || updates.salaryDetails) {
        teacher.teacherProfile.salaryDetails = teacher.teacherProfile.salaryDetails || { allowances: {}, deductions: {} };
        
        if (updates.basicSalary !== undefined) {
          teacher.teacherProfile.salaryDetails.basicSalary = updates.basicSalary;
          delete updates.basicSalary;
        }
        if (updates.allowances) {
          teacher.teacherProfile.salaryDetails.allowances = {
            ...teacher.teacherProfile.salaryDetails.allowances,
            ...updates.allowances,
          };
          delete updates.allowances;
        }
        if (updates.salaryDetails) {
          teacher.teacherProfile.salaryDetails = {
            ...teacher.teacherProfile.salaryDetails,
            ...updates.salaryDetails,
          };
          delete updates.salaryDetails;
        }
      }
      
      // Handle bank account updates
      if (updates.bankAccount) {
        teacher.teacherProfile.bankAccount = {
          ...teacher.teacherProfile.bankAccount,
          ...updates.bankAccount,
        };
        delete updates.bankAccount;
      }
      
      if (updates.qualifications) {
        teacher.teacherProfile.qualifications = updates.qualifications;
        delete updates.qualifications;
      }
      if (updates.subjects) {
        teacher.teacherProfile.subjects = updates.subjects;
        delete updates.subjects;
      }
      if (updates.documents) {
        teacher.teacherProfile.documents = updates.documents;
        delete updates.documents;
      }
    }

    // Update other fields
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        teacher[key] = updates[key];
      }
    });

    teacher.updatedBy = authenticatedUser.userId;
    await teacher.save();

    // If QR missing or key identity fields changed, try regenerating QR
    try {
      const shouldRegenerate = (!teacher.teacherProfile?.qr?.url) || updates.firstName || updates.lastName || updates.employeeId;
      if (shouldRegenerate) {
        const qrDataURL = await generateTeacherQR(teacher);
        const qrUpload = await uploadToCloudinary(qrDataURL, {
          folder: `ease-academy/teachers/${teacher._id}/qr`,
          resourceType: 'image',
        });
        teacher.teacherProfile = teacher.teacherProfile || {};
        teacher.teacherProfile.qr = {
          url: qrUpload.url,
          publicId: qrUpload.publicId,
          uploadedAt: new Date(),
        };
        await teacher.save();
      }
    } catch (qrErr) {
      console.error('Branch-admin QR regen failed:', qrErr);
    }

    // Send update or status-change email
    try {
      const recipient = teacher.email;
      if (recipient) {
        if (updates.status && (updates.status === 'inactive' || updates.status === 'terminated')) {
          const html = getTeacherEmailTemplate('TEACHER_STATUS_CHANGED', teacher);
          sendEmail(recipient, 'Account Status Changed', html);
        } else {
          const html = getTeacherEmailTemplate('TEACHER_UPDATED', teacher);
          sendEmail(recipient, 'Teacher Record Updated', html);
        }
      }
    } catch (err) {
      console.error('Failed to send teacher update email:', err);
    }

    return NextResponse.json({
      success: true,
      data: teacher,
      message: 'Teacher updated successfully',
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

// DELETE - Delete teacher
async function deleteTeacher(request, authenticatedUser, userDoc, context) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { params } = context || {};
    let { id } = params || {};
    if (!id) {
      try {
        const url = new URL(request.url);
        const parts = url.pathname.split('/').filter(Boolean);
        id = parts[parts.length - 1];
      } catch (e) {
        id = undefined;
      }
    }

    // Find teacher first (verify branch) then delete
    const teacher = await User.findOne({ 
      _id: id, 
      role: 'teacher',
      branchId: authenticatedUser.branchId 
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Send deletion/deactivation email before removal
    try {
      if (teacher.email) {
        const html = getTeacherEmailTemplate('TEACHER_STATUS_CHANGED', teacher);
        await sendEmail(teacher.email, 'Account Deleted', html);
      }
    } catch (err) {
      console.error('Failed to send teacher deletion email:', err);
    }

    await User.findOneAndDelete({ 
      _id: id, 
      role: 'teacher',
      branchId: authenticatedUser.branchId 
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTeacher);
export const PUT = withAuth(updateTeacher);
export const DELETE = withAuth(deleteTeacher);
