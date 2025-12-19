import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import {
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} from '@/backend/controllers/subscriptionController';

/**
 * GET /api/super-admin/subscriptions/[id]
 */
export async function GET(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = params;
        const result = await getSubscriptionById(id);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Get subscription error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch subscription' },
          { status: 404 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

/**
 * PUT /api/super-admin/subscriptions/[id]
 */
export async function PUT(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = params;
        const body = await request.json();
        const result = await updateSubscription(id, body);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Update subscription error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to update subscription' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

/**
 * DELETE /api/super-admin/subscriptions/[id]
 */
export async function DELETE(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = params;
        const result = await deleteSubscription(id);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Delete subscription error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to delete subscription' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
