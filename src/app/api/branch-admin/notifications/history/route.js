import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Notification from '@/backend/models/Notification';
import User from '@/backend/models/User';

export const GET = withAuth(async (request, user) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const senderId = user.userId;

    // Aggregate to group individual notifications into "Campaigns"
    const pipeline = [
      { 
        $match: { 
          "metadata.senderId": senderId 
        } 
      },
      { 
        $group: {
          _id: { 
            title: "$title",
            message: "$message",
             // Group close timestamps (e.g. within same minute) to treat as one campaign
            timeMinute: { 
              $dateToString: { format: "%Y-%m-%d %H:%M", date: "$createdAt" } 
            }
          },
          count: { $sum: 1 }, // How many users received this
          createdAt: { $max: "$createdAt" }, // Use latest timestamp
          type: { $first: "$type" },
          sampleMetadata: { $first: "$metadata" }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const results = await Notification.aggregate(pipeline);
    
    const campaigns = results[0].data || [];
    const totalCount = results[0].total[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        notifications: campaigns.map(c => ({
          _id: `${c._id.title}-${c._id.timeMinute}`, // Synthetic ID
          title: c._id.title,
          message: c._id.message,
          type: c.type,
          createdAt: c.createdAt,
          recipientCount: c.count,
          role: c.sampleMetadata?.role || 'Mixed' // We could store targetRole in metadata too
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages
        }
      }
    });

  } catch (error) {
    console.error('Error fetching notification history:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch history', error: error.message },
      { status: 500 }
    );
  }
});
