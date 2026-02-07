import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/database';
import { authenticate } from '@/backend/middleware/auth';
import Attendance from '@/backend/models/Attendance';
import Class from '@/backend/models/Class';

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
    const timeRange = searchParams.get('timeRange') || 'current_month';

    await connectDB();

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case 'current_week':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        endDate = new Date(now.setDate(now.getDate() + 6));
        break;
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Build aggregation pipeline for attendance percentages by class
    const pipeline = [
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          attendanceType: 'daily',
          ...(branch !== 'all' && { branchId: new mongoose.Types.ObjectId(branch) })
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $group: {
          _id: {
            classId: '$classInfo._id',
            className: '$classInfo.name'
          },
          totalRecords: { $sum: { $size: '$records' } },
          presentCount: {
            $sum: {
              $size: {
                $filter: {
                  input: '$records',
                  cond: { $eq: ['$$this.status', 'present'] }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          class: '$_id.className',
          percentage: {
            $cond: {
              if: { $eq: ['$totalRecords', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$presentCount', '$totalRecords'] },
                  100
                ]
              }
            }
          }
        }
      },
      {
        $sort: { class: 1 }
      }
    ];

    const data = await Attendance.aggregate(pipeline);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch student attendance' },
      { status: 500 }
    );
  }
}
