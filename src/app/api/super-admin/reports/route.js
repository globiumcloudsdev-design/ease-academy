import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import connectDB from '@/lib/database';
import Branch from '@/backend/models/Branch';
import User from '@/backend/models/User';
import Expense from '@/backend/models/Expense';
import Salary from '@/backend/models/Salary';
import Event from '@/backend/models/Event';
import Subscription from '@/backend/models/Subscription';

/**
 * Generate comprehensive reports
 */
export async function GET(request) {
  return withAuth(
    async (request, user) => {
      try {
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const reportType = searchParams.get('type');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const branchId = searchParams.get('branchId');
        
        let reportData = {};
        
        switch (reportType) {
          case 'overview':
            reportData = await generateOverviewReport(startDate, endDate, branchId);
            break;
          
          case 'financial':
            reportData = await generateFinancialReport(startDate, endDate, branchId);
            break;
          
          case 'branches':
            reportData = await generateBranchesReport();
            break;
          
          case 'users':
            reportData = await generateUsersReport(branchId);
            break;
          
          case 'events':
            reportData = await generateEventsReport(startDate, endDate, branchId);
            break;
          
          default:
            return NextResponse.json(
              { success: false, message: 'Invalid report type' },
              { status: 400 }
            );
        }
        
        return NextResponse.json({
          success: true,
          data: reportData,
        }, { status: 200 });
      } catch (error) {
        console.error('Generate report error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to generate report' },
          { status: 500 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

/**
 * Overview Report
 */
async function generateOverviewReport(startDate, endDate, branchId) {
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  
  const branchFilter = branchId ? { branchId } : {};
  
  const [
    totalBranches,
    activeBranches,
    totalUsers,
    totalExpenses,
    totalSalaries,
    upcomingEvents,
    activeSubscriptions,
  ] = await Promise.all([
    Branch.countDocuments(),
    Branch.countDocuments({ status: 'active' }),
    User.countDocuments({ ...branchFilter, ...dateFilter }),
    Expense.aggregate([
      {
        $match: {
          ...branchFilter,
          paymentStatus: 'paid',
          date: dateFilter.createdAt || { $exists: true },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Salary.aggregate([
      {
        $match: {
          ...branchFilter,
          status: 'paid',
          paymentDate: dateFilter.createdAt || { $exists: true },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Event.countDocuments({
      ...branchFilter,
      startDate: { $gte: new Date() },
      status: 'scheduled',
    }),
    Subscription.countDocuments({ status: 'active' }),
  ]);
  
  return {
    summary: {
      totalBranches,
      activeBranches,
      totalUsers,
      upcomingEvents,
      activeSubscriptions,
    },
    financial: {
      totalExpenses: totalExpenses[0]?.total || 0,
      totalSalaries: totalSalaries[0]?.total || 0,
      totalSpent: (totalExpenses[0]?.total || 0) + (totalSalaries[0]?.total || 0),
    },
  };
}

/**
 * Financial Report
 */
async function generateFinancialReport(startDate, endDate, branchId) {
  const dateFilter = startDate && endDate ? {
    $gte: new Date(startDate),
    $lte: new Date(endDate),
  } : { $exists: true };
  
  const branchFilter = branchId ? { branchId } : {};
  
  const [
    expensesByCategory,
    expensesByMonth,
    salariesByMonth,
    pendingExpenses,
    pendingSalaries,
  ] = await Promise.all([
    Expense.aggregate([
      {
        $match: {
          ...branchFilter,
          date: dateFilter,
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      {
        $match: {
          ...branchFilter,
          date: dateFilter,
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Salary.aggregate([
      {
        $match: {
          ...branchFilter,
          paymentDate: dateFilter,
          status: 'paid',
        },
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Expense.countDocuments({ ...branchFilter, paymentStatus: 'pending' }),
    Salary.countDocuments({ ...branchFilter, status: 'pending' }),
  ]);
  
  return {
    expensesByCategory,
    expensesByMonth,
    salariesByMonth,
    pending: {
      expenses: pendingExpenses,
      salaries: pendingSalaries,
    },
  };
}

/**
 * Branches Report
 */
async function generateBranchesReport() {
  const branches = await Branch.find()
    .select('name code status contactEmail contactPhone address city state country')
    .lean();
  
  const branchStats = await Promise.all(
    branches.map(async (branch) => {
      const [
        totalUsers,
        totalExpenses,
        totalSalaries,
      ] = await Promise.all([
        User.countDocuments({ branchId: branch._id }),
        Expense.aggregate([
          {
            $match: {
              branchId: branch._id,
              paymentStatus: 'paid',
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Salary.aggregate([
          {
            $match: {
              branchId: branch._id,
              status: 'paid',
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);
      
      return {
        ...branch,
        stats: {
          totalUsers,
          totalExpenses: totalExpenses[0]?.total || 0,
          totalSalaries: totalSalaries[0]?.total || 0,
        },
      };
    })
  );
  
  return { branches: branchStats };
}

/**
 * Users Report
 */
async function generateUsersReport(branchId) {
  const filter = branchId ? { branchId } : {};
  
  const [
    totalUsers,
    usersByRole,
    activeUsers,
    inactiveUsers,
  ] = await Promise.all([
    User.countDocuments(filter),
    User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]),
    User.countDocuments({ ...filter, isActive: true }),
    User.countDocuments({ ...filter, isActive: false }),
  ]);
  
  return {
    totalUsers,
    usersByRole,
    activeUsers,
    inactiveUsers,
  };
}

/**
 * Events Report
 */
async function generateEventsReport(startDate, endDate, branchId) {
  const dateFilter = startDate && endDate ? {
    $or: [
      { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
    ],
  } : {};
  
  const branchFilter = branchId ? { branchId } : {};
  
  const [
    totalEvents,
    eventsByType,
    eventsByStatus,
    upcomingEvents,
  ] = await Promise.all([
    Event.countDocuments({ ...branchFilter, ...dateFilter }),
    Event.aggregate([
      { $match: { ...branchFilter, ...dateFilter } },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ]),
    Event.aggregate([
      { $match: { ...branchFilter, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Event.countDocuments({
      ...branchFilter,
      startDate: { $gte: new Date() },
      status: 'scheduled',
    }),
  ]);
  
  return {
    totalEvents,
    eventsByType,
    eventsByStatus,
    upcomingEvents,
  };
}
