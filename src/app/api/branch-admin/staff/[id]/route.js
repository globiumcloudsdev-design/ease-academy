import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';

// GET - Get staff by ID (only from same branch)
async function getStaff(request, currentUser, userDoc, context) {
  try {
    await connectDB();

    const params = await context.params;
    const { id } = params;

    const staff = await User.findOne({ 
      _id: id, 
      role: 'staff',
      branchId: currentUser.branchId 
    })
      .populate('branchId', 'name code address contact')
      .select('-passwordHash -refreshToken');

    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Staff not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update staff (only from same branch)
async function updateStaff(request, currentUser, userDoc, context) {
  try {
    await connectDB();

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const staff = await User.findOne({ 
      _id: id, 
      role: 'staff',
      branchId: currentUser.branchId 
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Staff not found' },
        { status: 404 }
      );
    }

    // Update basic fields
    const updateFields = [
      'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender',
      'cnic', 'bloodGroup', 'address'
    ];

    updateFields.forEach(field => {
      if (body[field] !== undefined) {
        staff[field] = body[field];
      }
    });

    // Update fullName if names changed
    if (body.firstName || body.lastName) {
      staff.fullName = `${staff.firstName} ${staff.lastName}`;
    }

    // Update staff profile
    if (body.joiningDate) staff.staffProfile.joiningDate = new Date(body.joiningDate);
    if (body.role) staff.staffProfile.role = body.role;
    if (body.shift) staff.staffProfile.shift = body.shift;
    if (body.basicSalary !== undefined) staff.staffProfile.salaryDetails.basicSalary = body.basicSalary;
    if (body.allowances) staff.staffProfile.salaryDetails.allowances = body.allowances;
    if (body.emergencyContact) staff.staffProfile.emergencyContact = body.emergencyContact;

    staff.updatedBy = currentUser.userId;
    await staff.save();

    await staff.populate('branchId', 'name code');

    return NextResponse.json({
      success: true,
      message: 'Staff updated successfully',
      data: staff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff (only from same branch)
async function deleteStaff(request, currentUser, userDoc, context) {
  try {
    await connectDB();

    const params = await context.params;
    const { id } = params;

    const staff = await User.findOneAndDelete({ 
      _id: id, 
      role: 'staff',
      branchId: currentUser.branchId 
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Staff not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStaff, [requireRole(['branch_admin'])]);
export const PUT = withAuth(updateStaff, [requireRole(['branch_admin'])]);
export const DELETE = withAuth(deleteStaff, [requireRole(['branch_admin'])]);
