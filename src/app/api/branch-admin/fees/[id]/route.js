import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import BranchFee from '@/backend/models/BranchFee';

// GET - Get single fee
async function getFee(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    const fee = await BranchFee.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    })
      .populate('createdBy', 'fullName email')
      .lean();

    if (!fee) {
      return NextResponse.json(
        { success: false, message: 'Fee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: fee,
    });
  } catch (error) {
    console.error('Get fee error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch fee' },
      { status: 500 }
    );
  }
}

// PUT - Update fee
async function updateFee(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;
    const updates = await request.json();

    // Find fee and verify it belongs to admin's branch
    const fee = await BranchFee.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!fee) {
      return NextResponse.json(
        { success: false, message: 'Fee not found' },
        { status: 404 }
      );
    }

    // Prevent changing branchId
    delete updates.branchId;

    // Update fee
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        fee[key] = updates[key];
      }
    });

    await fee.save();

    return NextResponse.json({
      success: true,
      data: fee,
      message: 'Fee updated successfully',
    });
  } catch (error) {
    console.error('Update fee error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update fee' },
      { status: 500 }
    );
  }
}

// DELETE - Delete fee
async function deleteFee(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find and delete fee (only from admin's branch)
    const fee = await BranchFee.findOneAndDelete({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!fee) {
      return NextResponse.json(
        { success: false, message: 'Fee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fee deleted successfully',
    });
  } catch (error) {
    console.error('Delete fee error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete fee' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFee);
export const PUT = withAuth(updateFee);
export const DELETE = withAuth(deleteFee);
