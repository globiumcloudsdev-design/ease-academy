import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Expense from '@/backend/models/Expense';

// GET - Get single expense
async function getExpense(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    const expense = await Expense.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    })
      .populate('approvedBy', 'fullName email')
      .populate('createdBy', 'fullName email')
      .lean();

    if (!expense) {
      return NextResponse.json(
        { success: false, message: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Get expense error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

// PUT - Update expense
async function updateExpense(request, authenticatedUser, userDoc, { params }) {
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

    // Find expense and verify it belongs to admin's branch
    const expense = await Expense.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, message: 'Expense not found' },
        { status: 404 }
      );
    }

    // Prevent changing branchId
    delete updates.branchId;

    // Update expense
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        expense[key] = updates[key];
      }
    });

    await expense.save();

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully',
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
async function deleteExpense(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find and delete expense (only from admin's branch)
    const expense = await Expense.findOneAndDelete({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, message: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getExpense);
export const PUT = withAuth(updateExpense);
export const DELETE = withAuth(deleteExpense);
