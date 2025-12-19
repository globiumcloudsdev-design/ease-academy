import Expense from '@/backend/models/Expense';
import connectDB from '@/lib/database';
import { deleteCache } from '@/lib/redis';

/**
 * Get all expenses
 */
export async function getAllExpenses(filters = {}) {
  try {
    await connectDB();
    
    const { branchId, category, paymentStatus, startDate, endDate, page = 1, limit = 20 } = filters;
    
    const query = {};
    if (branchId) query.branchId = branchId;
    if (category) query.category = category;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const expenses = await Expense.find(query)
      .populate('branchId', 'name code')
      .populate('approvedBy', 'fullName')
      .populate('createdBy', 'fullName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Expense.countDocuments(query);
    
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
    
    return {
      success: true,
      data: {
        expenses,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
        totals: totals[0] || { totalAmount: 0, totalPaid: 0 },
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Create expense
 */
export async function createExpense(expenseData, userId) {
  try {
    await connectDB();
    
    const expense = new Expense({
      ...expenseData,
      createdBy: userId,
    });
    
    await expense.save();
    
    await deleteCache('expenses:*');
    
    return {
      success: true,
      data: expense,
      message: 'Expense created successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update expense
 */
export async function updateExpense(expenseId, updates) {
  try {
    await connectDB();
    
    const expense = await Expense.findByIdAndUpdate(expenseId, updates, {
      new: true,
      runValidators: true,
    });
    
    if (!expense) {
      throw new Error('Expense not found');
    }
    
    await deleteCache('expenses:*');
    
    return {
      success: true,
      data: expense,
      message: 'Expense updated successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Delete expense
 */
export async function deleteExpense(expenseId) {
  try {
    await connectDB();
    
    const expense = await Expense.findByIdAndDelete(expenseId);
    
    if (!expense) {
      throw new Error('Expense not found');
    }
    
    await deleteCache('expenses:*');
    
    return {
      success: true,
      message: 'Expense deleted successfully',
    };
  } catch (error) {
    throw error;
  }
}

export default {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
