import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authenticate } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
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

    // Calculate date range based on timeRange parameter
    const now = new Date();
    let startDate;
    const months = timeRange === '6months' ? 6 : timeRange === '1year' ? 12 : 3;

    startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    // Build aggregation pipeline for student enrollment trends
    const pipeline = [
      {
        $match: {
          role: 'student',
          createdAt: { $gte: startDate },
          ...(branch !== 'all' && { branchId: new mongoose.Types.ObjectId(branch) })
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                    { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                    { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                    { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                    { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                    { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                    { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                    { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                    { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                    { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                    { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                    { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
                  ],
                  default: 'Unknown'
                }
              },
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          students: '$count'
        }
      }
    ];

    const rawData = await User.aggregate(pipeline);

    // Debug logging
    console.log('Student Trends API Debug:');
    console.log('Branch filter:', branch);
    console.log('Time range:', timeRange);
    console.log('Months to show:', months);
    console.log('Raw aggregated data:', rawData);

    // Calculate growth and ensure we have data for all months in the range
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - months + i + 1, 1);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const monthName = monthNames[monthIndex] + ' ' + year;

      // Find data for this specific month and year
      const existingData = rawData.find(d => {
        // Parse the month name from the aggregated data
        const [monthStr, yearStr] = d.month.split(' ');
        const dataMonthIndex = monthNames.indexOf(monthStr);
        return dataMonthIndex === monthIndex && parseInt(yearStr) === year;
      });

      const students = existingData ? existingData.students : 0;
      const prevStudents = data.length > 0 ? data[data.length - 1].students : 0;
      const growth = prevStudents > 0 ? Math.round(((students - prevStudents) / prevStudents) * 100) : 0;

      data.push({
        month: monthNames[monthIndex],
        students,
        growth
      });
    }

    console.log('Final processed data:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching student trends:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch student trends' },
      { status: 500 }
    );
  }
}
