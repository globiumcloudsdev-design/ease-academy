import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Grade from '@/backend/models/Grade';

async function getPassFailRatio(request, authenticatedUser, userDoc) {
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

    // Get pass/fail ratio for the last 6 months
    const currentDate = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

      const monthName = monthStart.toLocaleString('default', { month: 'short' });

      // Get total grades for this month
      const totalGrades = await Grade.countDocuments({
        branchId: branchId,
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      // Get passing grades (assuming passing grade is >= 50)
      const passingGrades = await Grade.countDocuments({
        branchId: branchId,
        grade: { $gte: 50 },
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const pass = totalGrades > 0 ? Math.round((passingGrades / totalGrades) * 100) : 0;
      const fail = 100 - pass;

      data.push({
        name: 'Pass',
        value: pass
      }, {
        name: 'Fail',
        value: fail
      });
    }

    // If no data found, return mock data
    if (!data || data.length === 0 || data.every(item => item.value === 0)) {
      const mockData = [
        { name: 'Pass', value: 78 },
        { name: 'Fail', value: 22 }
      ];
      return NextResponse.json({
        success: true,
        data: mockData,
        message: 'Mock pass/fail ratio data retrieved successfully',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Pass/fail ratio data retrieved successfully',
    });
  } catch (error) {
    console.error('Pass fail ratio error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch pass/fail ratio data',
      },
      { status: 500 }
    );
  }
}



export const GET = withAuth(getPassFailRatio);
