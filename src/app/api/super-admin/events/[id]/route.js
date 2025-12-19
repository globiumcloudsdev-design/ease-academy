import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import {
  getEventById,
  updateEvent,
  deleteEvent,
} from '@/backend/controllers/eventController';

export async function GET(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = params;
        const result = await getEventById(id);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Get event error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch event' },
          { status: 404 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

export async function PUT(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = params;
        const body = await request.json();
        
        const result = await updateEvent(id, body);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Update event error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to update event' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

export async function DELETE(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = params;
        const result = await deleteEvent(id);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Delete event error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to delete event' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
