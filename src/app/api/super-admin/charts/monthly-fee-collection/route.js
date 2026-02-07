import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/database';
import { authenticate } from '@/backend/middleware/auth';
import FeeVoucher from '@/backend/models/FeeVoucher';

export async function GET(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || 'all';
    const timeRange = searchParams.get('timeRange') || '6months';

    await connectDB();

    // Calculate date range based on timeRange
    const now = new Date();
    let months = 6; // default

    switch (timeRange) {
      case '1month':
        months = 1;
        break;
      case '3months':
        months = 3;
        break;
      case '6months':
        months = 6;
        break;
      case '1year':
        months = 12;
        break;
      default:
        months = 6;
    }

    // Calculate start date - go back (months - 1) months from the start of current month
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    // Build aggregation pipeline for monthly fee collection (approved payments)
    const approvedPipeline = [
      // Match fee vouchers with approved payments
      {
        $match: {
          'paymentHistory.status': 'approved',
          ...(branch !== 'all' && { branchId: new mongoose.Types.ObjectId(branch) })
        }
      },
      // Unwind payment history to get individual payments
      {
        $unwind: '$paymentHistory'
      },
      // Match only approved payments within date range
      {
        $match: {
          'paymentHistory.status': 'approved',
          'paymentHistory.paymentDate': { $gte: startDate }
        }
      },
      // Group by month and year
      {
        $group: {
          _id: {
            year: { $year: '$paymentHistory.paymentDate' },
            month: { $month: '$paymentHistory.paymentDate' }
          },
          approvedAmount: { $sum: '$paymentHistory.amount' }
        }
      },
      // Project final format
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          approvedAmount: '$approvedAmount'
        }
      },
      // Sort by date
      {
        $sort: { year: 1, month: 1 }
      }
    ];

    // Build aggregation pipeline for pending fees
    const pendingPipeline = [
      // Match fee vouchers with pending payments
      {
        $match: {
          'paymentHistory.status': 'pending',
          ...(branch !== 'all' && { branchId: new mongoose.Types.ObjectId(branch) })
        }
      },
      // Unwind payment history to get individual payments
      {
        $unwind: '$paymentHistory'
      },
      // Match only pending payments within date range
      {
        $match: {
          'paymentHistory.status': 'pending',
          'paymentHistory.paymentDate': { $gte: startDate }
        }
      },
      // Group by month and year
      {
        $group: {
          _id: {
            year: { $year: '$paymentHistory.paymentDate' },
            month: { $month: '$paymentHistory.paymentDate' }
          },
          pendingAmount: { $sum: '$paymentHistory.amount' }
        }
      },
      // Project final format
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          pendingAmount: '$pendingAmount'
        }
      },
      // Sort by date
      {
        $sort: { year: 1, month: 1 }
      }
    ];

    // Run both pipelines
    const [approvedData, pendingData] = await Promise.all([
      FeeVoucher.aggregate(approvedPipeline),
      FeeVoucher.aggregate(pendingPipeline)
    ]);

    // Debug logging
    console.log('Monthly Fee Collection Debug:');
    console.log('Branch filter:', branch);
    console.log('Time range:', timeRange);
    console.log('Start date:', startDate);
    console.log('Approved data:', approvedData);
    console.log('Pending data:', pendingData);

    // Create a map to merge approved and pending data by month
    const dataMap = new Map();

    // Process approved data
    approvedData.forEach(item => {
      const key = `${item.year}-${item.month}`;
      dataMap.set(key, {
        year: item.year,
        month: item.month,
        approvedAmount: item.approvedAmount || 0,
        pendingAmount: 0
      });
    });

    // Process pending data
    pendingData.forEach(item => {
      const key = `${item.year}-${item.month}`;
      if (dataMap.has(key)) {
        dataMap.get(key).pendingAmount = item.pendingAmount || 0;
      } else {
        dataMap.set(key, {
          year: item.year,
          month: item.month,
          approvedAmount: 0,
          pendingAmount: item.pendingAmount || 0
        });
      }
    });

    // Generate all months in the range, even if they have no data
    const allMonthsData = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
      const key = `${year}-${month}`;

      const existingData = dataMap.get(key);
      allMonthsData.push({
        year,
        month,
        approvedAmount: existingData?.approvedAmount || 0,
        pendingAmount: existingData?.pendingAmount || 0
      });
    }

    console.log('All months data (including zero values):', allMonthsData);

    // Format data for frontend (convert month numbers to names)
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const formattedData = allMonthsData.map(item => ({
      month: monthNames[item.month - 1],
      approvedAmount: item.approvedAmount,
      pendingAmount: item.pendingAmount
    }));

    console.log('Final processed data:', formattedData);

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching monthly fee collection:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch monthly fee collection' },
      { status: 500 }
    );
  }
}
