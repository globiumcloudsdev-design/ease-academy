import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import { getAllEvents, createEvent } from '@/backend/controllers/eventController';

export async function GET(request) {
  return withAuth(
    async (request, user) => {
      try {
        const { searchParams } = new URL(request.url);
        const filters = {
          branchId: searchParams.get('branchId'),
          eventType: searchParams.get('eventType'),
          status: searchParams.get('status'),
          startDate: searchParams.get('startDate'),
          endDate: searchParams.get('endDate'),
          page: searchParams.get('page') || 1,
          limit: searchParams.get('limit') || 50,
        };
        
        const result = await getAllEvents(filters);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Get events error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch events' },
          { status: 500 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

export async function POST(request) {
  return withAuth(
    async (request, user) => {
      try {
        const body = await request.json();
        
        if (!body.title || !body.startDate || !body.endDate) {
          return NextResponse.json(
            { success: false, message: 'Title, start date, and end date are required' },
            { status: 400 }
          );
        }
        
        const result = await createEvent(body, user.userId);
        
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        console.error('Create event error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to create event' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
