import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import {
  createSubscription,
  getAllSubscriptions,
} from '@/backend/controllers/subscriptionController';

/**
 * GET /api/super-admin/subscriptions
 * Get all subscriptions
 */
export async function GET(request) {
  return withAuth(
    async (request, user) => {
      try {
        const { searchParams } = new URL(request.url);
        
        const filters = {
          page: searchParams.get('page') || 1,
          limit: searchParams.get('limit') || 10,
          branchId: searchParams.get('branchId'),
          status: searchParams.get('status'),
          planType: searchParams.get('planType'),
          search: searchParams.get('search'),
        };
        
        const result = await getAllSubscriptions(filters);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Get subscriptions error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch subscriptions' },
          { status: 500 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

/**
 * POST /api/super-admin/subscriptions
 * Create new subscription
 */
export async function POST(request) {
  return withAuth(
    async (request, user) => {
      try {
        const body = await request.json();
        
        const {
          branchId,
          planName,
          planType,
          price,
          billingCycle,
          startDate,
          endDate,
        } = body;
        
        // Validate required fields
        if (!branchId || !planName || !planType || !price || !billingCycle || !startDate || !endDate) {
          return NextResponse.json(
            {
              success: false,
              message: 'Branch, plan name, type, price, billing cycle, start and end dates are required',
            },
            { status: 400 }
          );
        }
        
        const result = await createSubscription(body);
        
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        console.error('Create subscription error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to create subscription' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
