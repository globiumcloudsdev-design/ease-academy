import Salary from '@/backend/models/Salary';
import User from '@/backend/models/User';
import connectDB from '@/lib/database';
import { deleteCache } from '@/lib/redis';

/**
 * Get all salaries
 */
export async function getAllSalaries(filters = {}) {
  try {
    await connectDB();
    
    const { branchId, employeeId, month, year, paymentStatus, page = 1, limit = 20 } = filters;
    
    const query = {};
    if (branchId) query.branchId = branchId;
    if (employeeId) query.employeeId = employeeId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const skip = (page - 1) * limit;
    
    const salaries = await Salary.find(query)
      .populate('employeeId', 'fullName email role')
      .populate('branchId', 'name code')
      .populate('approvedBy', 'fullName')
      .populate('createdBy', 'fullName')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Salary.countDocuments(query);
    
    // Calculate totals
    const totals = await Salary.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$baseSalary' },
          totalNet: { $sum: '$netSalary' },
        },
      },
    ]);
    
    return {
      success: true,
      data: {
        salaries,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
        totals: totals[0] || { totalGross: 0, totalNet: 0 },
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Create salary record
 */
export async function createSalary(salaryData, userId) {
  try {
    await connectDB();
    
    // Check if salary already exists for this employee and month
    const existing = await Salary.findOne({
      employeeId: salaryData.employeeId,
      month: salaryData.month,
      year: salaryData.year,
    });
    
    if (existing) {
      throw new Error('Salary record already exists for this employee and month');
    }
    
    // Verify employee exists
    const employee = await User.findById(salaryData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    const salary = new Salary({
      ...salaryData,
      createdBy: userId,
    });
    
    await salary.save();
    
    await deleteCache('salaries:*');
    
    return {
      success: true,
      data: salary,
      message: 'Salary record created successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update salary record
 */
export async function updateSalary(salaryId, updates) {
  try {
    await connectDB();
    
    const salary = await Salary.findByIdAndUpdate(salaryId, updates, {
      new: true,
      runValidators: true,
    });
    
    if (!salary) {
      throw new Error('Salary record not found');
    }
    
    await deleteCache('salaries:*');
    
    return {
      success: true,
      data: salary,
      message: 'Salary record updated successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Delete salary record
 */
export async function deleteSalary(salaryId) {
  try {
    await connectDB();
    
    const salary = await Salary.findByIdAndDelete(salaryId);
    
    if (!salary) {
      throw new Error('Salary record not found');
    }
    
    await deleteCache('salaries:*');
    
    return {
      success: true,
      message: 'Salary record deleted successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Mark salary as paid
 */
export async function markSalaryAsPaid(salaryId, paymentData) {
  try {
    await connectDB();
    
    const salary = await Salary.findById(salaryId);
    
    if (!salary) {
      throw new Error('Salary record not found');
    }
    
    salary.paymentStatus = 'paid';
    salary.paymentDate = paymentData.paymentDate || new Date();
    salary.transactionId = paymentData.transactionId;
    salary.paymentMethod = paymentData.paymentMethod || salary.paymentMethod;
    
    await salary.save();
    
    await deleteCache('salaries:*');
    
    return {
      success: true,
      data: salary,
      message: 'Salary marked as paid successfully',
    };
  } catch (error) {
    throw error;
  }
}

export default {
  getAllSalaries,
  createSalary,
  updateSalary,
  deleteSalary,
  markSalaryAsPaid,
};
