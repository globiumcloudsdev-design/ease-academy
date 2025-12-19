import Event from '@/backend/models/Event';
import connectDB from '@/lib/database';
import { setCache, getCache, deleteCache } from '@/lib/redis';

/**
 * Get all events with filters
 */
export async function getAllEvents(filters = {}) {
  try {
    await connectDB();
    
    const { branchId, eventType, status, startDate, endDate, page = 1, limit = 50 } = filters;
    
    // Build query
    const query = {};
    if (branchId) {
      query.$or = [{ branchId }, { branchId: null }]; // Include global events
    }
    if (eventType) query.eventType = eventType;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const events = await Event.find(query)
      .populate('branchId', 'name code')
      .populate('organizer', 'fullName email')
      .populate('createdBy', 'fullName')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Event.countDocuments(query);
    
    return {
      success: true,
      data: {
        events,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get event by ID
 */
export async function getEventById(eventId) {
  try {
    await connectDB();
    
    const event = await Event.findById(eventId)
      .populate('branchId', 'name code')
      .populate('organizer', 'fullName email phone')
      .populate('participants', 'fullName email')
      .populate('createdBy', 'fullName');
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    return {
      success: true,
      data: event,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Create new event
 */
export async function createEvent(eventData, userId) {
  try {
    await connectDB();
    
    const event = new Event({
      ...eventData,
      createdBy: userId,
    });
    
    await event.save();
    
    // Clear cache
    await deleteCache('events:*');
    
    return {
      success: true,
      data: event,
      message: 'Event created successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update event
 */
export async function updateEvent(eventId, updates) {
  try {
    await connectDB();
    
    const event = await Event.findByIdAndUpdate(eventId, updates, {
      new: true,
      runValidators: true,
    });
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Clear cache
    await deleteCache('events:*');
    
    return {
      success: true,
      data: event,
      message: 'Event updated successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Delete event
 */
export async function deleteEvent(eventId) {
  try {
    await connectDB();
    
    const event = await Event.findByIdAndDelete(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Clear cache
    await deleteCache('events:*');
    
    return {
      success: true,
      message: 'Event deleted successfully',
    };
  } catch (error) {
    throw error;
  }
}

export default {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
