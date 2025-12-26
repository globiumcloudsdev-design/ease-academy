import { NextResponse } from 'next/server';
import FeeCategory from '@/backend/models/FeeCategory';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

// GET - Get single fee category
async function getFeeCategory(request, authenticatedUser, userDoc, context) {
  try {
    await connectDB();

    const { id } = await context.params;

    const category = await FeeCategory.findById(id)
      .populate('branchId', 'name code')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

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
    console.error('Error fetching fee category:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch fee category', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update fee category
async function updateFeeCategory(request, authenticatedUser, userDoc, context) {
  try {
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    // Find category
    const category = await FeeCategory.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Fee category not found' },
        { status: 404 }
      );
    }

    // If updating code, check if it already exists
    if (body.code && body.code !== category.code) {
      const existingCategory = await FeeCategory.findOne({ 
        code: body.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingCategory) {
        return NextResponse.json(
          { success: false, message: 'Category code already exists' },
          { status: 400 }
        );
      }
    }

    // Update category
    const updateData = {
      ...body,
      code: body.code ? body.code.toUpperCase() : category.code,
      updatedBy: userDoc._id,
    };

    const updatedCategory = await FeeCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('branchId', 'name code')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    return NextResponse.json({
      success: true,
      message: 'Fee category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Error updating fee category:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update fee category', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete fee category
async function deleteFeeCategory(request, authenticatedUser, userDoc, context) {
  try {
    await connectDB();

    const { id } = await context.params;

    const category = await FeeCategory.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Fee category not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    await FeeCategory.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Fee category deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting fee category:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete fee category', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFeeCategory, [requireRole(['super_admin'])]);
export const PUT = withAuth(updateFeeCategory, [requireRole(['super_admin'])]);
export const DELETE = withAuth(deleteFeeCategory, [requireRole(['super_admin'])]);
