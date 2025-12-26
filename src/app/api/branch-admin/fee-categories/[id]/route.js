import { NextResponse } from 'next/server';
import FeeCategory from '@/backend/models/FeeCategory';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

// GET - Get single fee category
async function getFeeCategory(request, authenticatedUser, userDoc, context) {
  try {
    await connectDB();

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    const { params } = context;
    const { id } = await params;

    // Can only access categories from their branch or school-wide
    const category = await FeeCategory.findOne({
      _id: id,
      $or: [
        { branchId: authenticatedUser.branchId },
        { branchId: null }
      ]
    }).populate('branchId', 'name code');

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Fee category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Get fee category error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch fee category' },
      { status: 500 }
    );
  }
}

// PUT - Update fee category
async function updateFeeCategory(request, authenticatedUser, userDoc, context) {
  try {
    await connectDB();

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    const { params } = context;
    const { id } = await params;
    const body = await request.json();

    // Find category - can only update categories from their branch
    const category = await FeeCategory.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Fee category not found or cannot be modified' },
        { status: 404 }
      );
    }

    // Check if code is being changed and if it already exists
    if (body.code && body.code.toUpperCase() !== category.code) {
      const existing = await FeeCategory.findOne({
        code: body.code.toUpperCase(),
        branchId: authenticatedUser.branchId,
        _id: { $ne: id },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Category with this code already exists in your branch' },
          { status: 400 }
        );
      }
    }

    // Update fields
    if (body.name) category.name = body.name;
    if (body.code) category.code = body.code.toUpperCase();
    if (body.description !== undefined) category.description = body.description;
    if (body.color) category.color = body.color;
    if (body.icon) category.icon = body.icon;
    if (body.isActive !== undefined) category.isActive = body.isActive;

    await category.save();

    const updatedCategory = await FeeCategory.findById(id)
      .populate('branchId', 'name code');

    return NextResponse.json({
      success: true,
      message: 'Fee category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Update fee category error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update fee category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete fee category (soft delete)
async function deleteFeeCategory(request, authenticatedUser, userDoc, context) {
  try {
    await connectDB();

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    const { params } = context;
    const { id } = await params;

    // Find category - can only delete categories from their branch
    const category = await FeeCategory.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Fee category not found or cannot be deleted' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    category.isActive = false;
    await category.save();

    return NextResponse.json({
      success: true,
      message: 'Fee category archived successfully',
    });
  } catch (error) {
    console.error('Delete fee category error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete fee category' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFeeCategory, [requireRole(['branch_admin'])]);
export const PUT = withAuth(updateFeeCategory, [requireRole(['branch_admin'])]);
export const DELETE = withAuth(deleteFeeCategory, [requireRole(['branch_admin'])]);
