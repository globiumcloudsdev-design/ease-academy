import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Event from '@/backend/models/Event';

// GET - Get single event
async function getEvent(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const event = await Event.findOne({
      _id: id,
      $or: [
        { branchId: authenticatedUser.branchId },
        { branchId: null }
      ]
    })
      .populate('organizer', 'fullName email')
      .populate('participants', 'fullName email')
      .lean();

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT - Update event
async function updateEvent(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const updates = await request.json();

    // Find event and verify it belongs to admin's branch (can't update global events)
    const event = await Event.findOne({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found or cannot be modified' },
        { status: 404 }
      );
    }

    // Prevent changing branchId
    delete updates.branchId;

    // Update event
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        event[key] = updates[key];
      }
    });

    await event.save();

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
async function deleteEvent(request, authenticatedUser, userDoc, { params }) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find and delete event (only from admin's branch)
    const event = await Event.findOneAndDelete({
      _id: id,
      branchId: authenticatedUser.branchId,
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found or cannot be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getEvent);
export const PUT = withAuth(updateEvent);
export const DELETE = withAuth(deleteEvent);
