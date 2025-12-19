
import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Event from '@/backend/models/Event';

// GET - Get all events for branch admin's branch
async function getEvents(request, authenticatedUser, userDoc) {
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
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');

    // Build query - only for this branch and global events
    const query = {
      $or: [
        { branchId: authenticatedUser.branchId },
        { branchId: null } // Include global events
      ]
    };
    
    if (search) {
      query.$and = [
        { ...query },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ]
        }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (eventType) {
      query.eventType = eventType;
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizer', 'fullName email')
        .populate('participants', 'fullName email')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Create new event (only for branch admin's branch)
async function createEvent(request, authenticatedUser, userDoc) {
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

    // Ensure event is created for admin's branch only
    const eventData = {
      ...body,
      branchId: authenticatedUser.branchId, // Force branch to admin's branch
      createdBy: authenticatedUser.userId,
      organizer: authenticatedUser.userId,
    };

    const event = new Event(eventData);
    await event.save();

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getEvents);
export const POST = withAuth(createEvent);
