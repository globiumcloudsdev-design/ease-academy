import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
import dbConnect from '@/lib/database';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/backend/utils/emailService';
import { getAdminEmailTemplate } from '@/backend/templates/adminEmail';

// GET - Get single user
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await dbConnect();
    
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
    await dbConnect();
    
    // Extract userId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1];
    
    const body = await request.json();
    const { fullName, firstName, lastName, email, phone, password, role, branchId, permissions, isActive, dateOfBirth, gender, nationality, cnic, religion, bloodGroup, address } = body;

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

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (fullName) user.fullName = fullName;
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    if (gender !== undefined) user.gender = gender;
    if (nationality !== undefined) user.nationality = nationality;
    if (cnic !== undefined) user.cnic = cnic;
    if (religion !== undefined) user.religion = religion;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (address !== undefined) user.address = address;
    if (role) user.role = role;
    if (branchId !== undefined) user.branchId = role === 'super_admin' ? null : branchId;
    if (permissions !== undefined) user.permissions = permissions;
    if (isActive !== undefined) user.isActive = isActive;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();

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
    await dbConnect();
    
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
