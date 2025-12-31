import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeTemplate from '@/backend/models/FeeTemplate';
import User from '@/backend/models/User';
import Class from '@/backend/models/Class';

// GET - Get single fee template
async function getFeeTemplate(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const template = await FeeTemplate.findOne({
      _id: id,
      $or: [
        { branchId: authenticatedUser.branchId },
        { branchId: null }
      ]
    })
      .populate('createdBy', 'fullName email')
      .lean();

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Fee template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Get fee template error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch fee template' },
      { status: 500 }
    );
  }
}

// PUT - Update fee template
async function updateFeeTemplate(request, authenticatedUser, userDoc, { params }) {
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

    // Find template and verify it belongs to admin's branch (can't update school-wide)
    const template = await FeeTemplate.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Fee template not found or cannot be modified' },
        { status: 404 }
      );
    }

    // Prevent changing branchId
    delete updates.branchId;

    // Update template
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        template[key] = updates[key];
      }
    });

    template.updatedBy = authenticatedUser.userId;
    await template.save();

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Fee template updated successfully',
    });
  } catch (error) {
    console.error('Update fee template error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update fee template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete fee template
async function deleteFeeTemplate(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find and delete template (only from admin's branch)
    const template = await FeeTemplate.findOneAndDelete({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Fee template not found or cannot be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fee template deleted successfully',
    });
  } catch (error) {
    console.error('Delete fee template error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete fee template' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFeeTemplate, [requireRole('branch_admin')]);
export const PUT = withAuth(updateFeeTemplate, [requireRole('branch_admin')]);
export const DELETE = withAuth(deleteFeeTemplate, [requireRole('branch_admin')]);
