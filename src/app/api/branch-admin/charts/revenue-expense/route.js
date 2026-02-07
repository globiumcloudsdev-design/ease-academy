import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Expense from '@/backend/models/Expense';
import FeeVoucher from '@/backend/models/FeeVoucher';

async function getRevenueExpense(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Branch admin role required.' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned to this admin.' },
        { status: 400 }
      );
    }

    await connectDB();
    const branchId = authenticatedUser.branchId;

    // Get filter from query parameters
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'monthly';

    const currentDate = new Date();
    const data = [];

    let periods = 6; // Default for monthly
    let periodType = 'month';
    let dateFormat = 'short';

    // Determine the number of periods and date format based on filter
    switch (filter) {
      case 'weekly':
        periods = 7; // Last 7 days
        periodType = 'day';
        dateFormat = 'day';
        break;
      case 'yearly':
        periods = 3; // Last 3 years
        periodType = 'year';
        dateFormat = 'year';
        break;
      case 'monthly':
      default:
        periods = 6; // Last 6 months
        periodType = 'month';
        dateFormat = 'short';
        break;
    }

    for (let i = periods - 1; i >= 0; i--) {
      let periodStart, periodEnd, periodLabel;

      switch (filter) {
        case 'weekly':
          // Calculate day start and end for last 7 days
          const dayStart = new Date(currentDate);
          dayStart.setDate(currentDate.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          periodStart = dayStart;
          periodEnd = dayEnd;
          const dayMonth = dayStart.toLocaleString('default', { month: 'short' });
          const dayDate = dayStart.getDate();
          periodLabel = `${dayMonth} ${dayDate}`;
          break;

        case 'yearly':
          periodStart = new Date(currentDate.getFullYear() - i, 0, 1);
          periodEnd = new Date(currentDate.getFullYear() - i, 11, 31);
          periodLabel = periodStart.getFullYear().toString();
          break;

        case 'monthly':
        default:
          periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
          periodLabel = periodStart.toLocaleString('default', { month: 'short' });
          break;
      }

      // Get revenue (collected fees) for this period
      const revenueResult = await FeeVoucher.aggregate([
        {
          $match: {
            branchId: branchId,
            status: 'paid',
            paymentDate: { $gte: periodStart, $lte: periodEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      // Get expenses for this period
      const expenseResult = await Expense.aggregate([
        {
          $match: {
            branchId: branchId,
            date: { $gte: periodStart, $lte: periodEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const revenue = revenueResult[0]?.total || 0;
      const expense = expenseResult[0]?.total || 0;

      data.push({
        period: periodLabel,
        revenue: revenue,
        expense: expense
      });
    }

    // If no data found, return mock data
    if (!data || data.length === 0 || data.every(item => item.revenue === 0 && item.expense === 0)) {
      let mockData = [];
      switch (filter) {
        case 'weekly':
          mockData = Array.from({ length: periods }, (_, i) => {
            const dayStart = new Date(currentDate);
            dayStart.setDate(currentDate.getDate() - i);
            const dayMonth = dayStart.toLocaleString('default', { month: 'short' });
            const dayDate = dayStart.getDate();
            return {
              period: `${dayMonth} ${dayDate}`,
              revenue: Math.floor(Math.random() * 10000) + 5000,
              expense: Math.floor(Math.random() * 8000) + 3000
            };
          });
          break;
        case 'yearly':
          mockData = [
            { period: '2021', revenue: 120000, expense: 85000 },
            { period: '2022', revenue: 135000, expense: 92000 },
            { period: '2023', revenue: 142000, expense: 98000 }
          ];
          break;
        case 'monthly':
        default:
          mockData = [
            { period: 'Aug', revenue: 25000, expense: 18000 },
            { period: 'Sept', revenue: 28000, expense: 22000 },
            { period: 'Oct', revenue: 32000, expense: 25000 },
            { period: 'Nov', revenue: 29000, expense: 21000 },
            { period: 'Dec', revenue: 35000, expense: 27000 },
            { period: 'Jan', revenue: 33000, expense: 24000 }
          ];
          break;
      }
      return NextResponse.json({
        success: true,
        data: mockData,
        message: `Mock ${filter} revenue vs expense data retrieved successfully`,
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: `${filter.charAt(0).toUpperCase() + filter.slice(1)} revenue vs expense data retrieved successfully`,
    });
  } catch (error) {
    console.error('Revenue expense error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch revenue vs expense data',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getRevenueExpense);
