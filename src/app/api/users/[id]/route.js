//src/app/api/users/[id]/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
import dbConnect from '@/lib/database';
import { sendEmail } from '@/backend/utils/emailService';
import { getStudentEmailTemplate } from '@/backend/templates/studentEmail';
import bcrypt from 'bcryptjs';
import { getAdminEmailTemplate } from '@/backend/templates/adminEmail';
import Branch from '@/backend/models/Branch';
import Department from '@/backend/models/Department';
import Class from '@/backend/models/Class';

/**
 * GET - Get single user by ID
 */
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();

    // Extract id from request URL (works with withAuth wrapper)
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];

    const user = await User.findById(id)
      .populate('branchId', 'name code city address')
      .populate('studentProfile.classId', 'name grade sections')
      .populate('studentProfile.departmentId', 'name code')
      .populate('teacherProfile.departmentId', 'name code')
      .populate('teacherProfile.subjects', 'name code')
      .populate('teacherProfile.classes.classId', 'name grade')
      .populate('teacherProfile.classes.subjectId', 'name code')
      .populate('staffProfile.departmentId', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user', error: error.message },
      { status: 500 }
    );
  }
});

/**
 * PUT - Update user by ID
 */
export const PUT = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];
    const body = await request.json();

    // Don't allow updating sensitive fields directly
    delete body.passwordHash;
    delete body.refreshToken;
    delete body.email; // Email update should be separate with verification

    // Sanitize empty string IDs that would fail ObjectId casting
    if (typeof body.branchId === 'string' && body.branchId.trim() === '') delete body.branchId;
    if (body.studentProfile) {
      if (typeof body.studentProfile.classId === 'string' && body.studentProfile.classId.trim() === '') delete body.studentProfile.classId;
      if (typeof body.studentProfile.departmentId === 'string' && body.studentProfile.departmentId.trim() === '') delete body.studentProfile.departmentId;
      // Sanitize feeDiscount.type: schema expects 'percentage' or 'fixed'.
      if (body.studentProfile.feeDiscount && body.studentProfile.feeDiscount.type !== undefined) {
        const t = body.studentProfile.feeDiscount.type;
        // Map numeric or boolean values to enum strings
        if (t === 0 || t === '0' || t === false) {
          body.studentProfile.feeDiscount.type = 'fixed';
        } else if (t === 1 || t === '1' || t === true) {
          body.studentProfile.feeDiscount.type = 'percentage';
        } else if (typeof t === 'string') {
          const v = t.trim().toLowerCase();
          if (v !== 'fixed' && v !== 'percentage') {
            delete body.studentProfile.feeDiscount.type;
          } else {
            body.studentProfile.feeDiscount.type = v;
          }
        } else {
          // Unknown type, remove to avoid validation error
          delete body.studentProfile.feeDiscount.type;
        }
      }
    }
    if (body.teacherProfile) {
      if (typeof body.teacherProfile.departmentId === 'string' && body.teacherProfile.departmentId.trim() === '') delete body.teacherProfile.departmentId;
    }
    if (body.staffProfile) {
      if (typeof body.staffProfile.departmentId === 'string' && body.staffProfile.departmentId.trim() === '') delete body.staffProfile.departmentId;
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Snapshot previous state for change detection
    const prev = user.toObject ? user.toObject() : { isActive: user.isActive };

    // Capture password from body (if provided) and remove from body to avoid merging raw password
    const incomingPassword = body.password;
    if (incomingPassword !== undefined) delete body.password;

    // Deep-merge incoming body into the existing user document so
    // partial/patch-style updates work correctly for nested objects.
    function deepMerge(target, source) {
      for (const key of Object.keys(source)) {
        const srcVal = source[key];
        const tgtVal = target[key];

        if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
          if (!tgtVal || typeof tgtVal !== 'object' || Array.isArray(tgtVal)) {
            // Replace non-object target with a plain object before merging
            target[key] = {};
          }
          deepMerge(target[key], srcVal);
        } else {
          // For primitive values and arrays, replace directly
          target[key] = srcVal;
        }
      }
    }

    deepMerge(user, body);
    // If a new password was provided, hash it and set passwordHash
    if (incomingPassword) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(incomingPassword, salt);
    }
    user.updatedBy = userDoc._id;
    await user.save();

    // Populate fields
    await user.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'studentProfile.classId', select: 'name grade' },
      { path: 'studentProfile.departmentId', select: 'name code' },
      { path: 'teacherProfile.departmentId', select: 'name code' },
      { path: 'teacherProfile.subjects', select: 'name code' },
      { path: 'staffProfile.departmentId', select: 'name code' },
      { path: 'updatedBy', select: 'fullName email' },
    ]);

    // Send update emails (non-blocking)
    try {
      // Student update
      if (user.role === 'student' && user.email) {
        try {
          const emailHtml = getStudentEmailTemplate('STUDENT_UPDATED', user.toObject());
          await sendEmail(user.email, '🔔 Your Student Profile Has Been Updated', emailHtml);
        } catch (emailErr) {
          console.error('Student update email failed (non-blocking):', emailErr);
        }
      }

      // Admin: send update/status/password emails
      const adminRoles = ['branch_admin', 'super_admin', 'admin'];
      if (adminRoles.includes(user.role) && user.email) {
        const schoolName = process.env.SCHOOL_NAME || 'Ease Academy';
        const adminForEmail = user.toObject ? user.toObject() : user;
        if (incomingPassword) adminForEmail.tempPassword = incomingPassword;

        // ADMIN_UPDATED
        try {
          const htmlUpdate = getAdminEmailTemplate('ADMIN_UPDATED', adminForEmail, schoolName);
          await sendEmail(user.email, `${schoolName} - Administrator Profile Updated`, htmlUpdate);
        } catch (err) {
          console.error('Failed to send admin updated email:', err);
        }

        // ADMIN_STATUS_CHANGED
        if (prev.isActive !== undefined && prev.isActive !== user.isActive) {
          try {
            const htmlStatus = getAdminEmailTemplate('ADMIN_STATUS_CHANGED', adminForEmail, schoolName);
            await sendEmail(user.email, `${schoolName} - Account Status Changed`, htmlStatus);
          } catch (err) {
            console.error('Failed to send admin status email:', err);
          }
        }

        // ADMIN_PASSWORD_RESET
        if (incomingPassword) {
          try {
            const htmlPw = getAdminEmailTemplate('ADMIN_PASSWORD_RESET', adminForEmail, schoolName);
            await sendEmail(user.email, `${schoolName} - Password Reset`, htmlPw);
          } catch (err) {
            console.error('Failed to send admin password reset email:', err);
          }
        }
      }
    } catch (errAll) {
      console.error('Email notifications failed (non-blocking):', errAll);
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user', error: error.message },
      { status: 500 }
    );
  }
});

/**
 * DELETE - Delete user by ID (soft delete by setting status to inactive)
 */
export const DELETE = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete: set status to inactive
    user.status = 'inactive';
    user.isActive = false;
    user.updatedBy = userDoc._id;
    await user.save();

    // Populate and send deactivation email if student
    await user.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'studentProfile.classId', select: 'name grade' },
      { path: 'studentProfile.departmentId', select: 'name code' },
    ]);

    if (user.role === 'student' && user.email) {
      try {
        const emailHtml = getStudentEmailTemplate('STUDENT_DEACTIVATED', user.toObject());
        await sendEmail(user.email, '⚠️ Student Account Deactivated', emailHtml);
      } catch (emailErr) {
        console.error('Email sending failed (non-blocking):', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user', error: error.message },
      { status: 500 }
    );
  }
});
