import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Expense from '@/backend/models/Expense';

// GET - Get all expenses for branch admin's branch
async function getExpenses(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const paymentStatus = searchParams.get('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query - only for this branch
    const query = { branchId: authenticatedUser.branchId };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('approvedBy', 'fullName email')
        .populate('createdBy', 'fullName email')
        .populate('eventId', 'title eventType startDate endDate')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(query),
    ]);

    // Calculate totals
    const totals = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        expenses,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
        summary: totals[0] || { totalAmount: 0, totalPaid: 0 },
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST - Create new expense (only for branch admin's branch)
async function createExpense(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Handle event expenses - check if expense already exists for this event
    if (body.isEventExpense && body.eventId) {
      const existingEventExpense = await Expense.findOne({
        branchId: authenticatedUser.branchId,
        isEventExpense: true,
        eventId: body.eventId,
      });

      if (existingEventExpense) {
        // Update existing event expense by adding the new amount
        existingEventExpense.amount += parseFloat(body.amount) || 0;
        existingEventExpense.paidAmount += parseFloat(body.paidAmount) || 0;
        existingEventExpense.updatedAt = new Date();

        // Update other fields if provided
        if (body.description) existingEventExpense.description = body.description;
        if (body.paymentMethod) existingEventExpense.paymentMethod = body.paymentMethod;
        if (body.paymentStatus) existingEventExpense.paymentStatus = body.paymentStatus;
        if (body.vendor) existingEventExpense.vendor = body.vendor;
        if (body.notes) existingEventExpense.notes = body.notes;

        await existingEventExpense.save();

        return NextResponse.json({
          success: true,
          data: existingEventExpense,
          message: 'Event expense updated successfully',
        });
      }
    }

    // Ensure expense is created for admin's branch only
    const expenseData = {
      ...body,
      branchId: authenticatedUser.branchId, // Force branch to admin's branch
      createdBy: authenticatedUser.userId,
    };

    // Only set eventId if it's an event expense and eventId is provided
    if (!expenseData.isEventExpense || !expenseData.eventId) {
      delete expenseData.eventId;
    }

    const expense = new Expense(expenseData);
    await expense.save();

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense created successfully',
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create expense' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getExpenses);
export const POST = withAuth(createExpense);
