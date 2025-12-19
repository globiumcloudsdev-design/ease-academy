import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import { getAllExpenses, createExpense } from '@/backend/controllers/expenseController';

export async function GET(request) {
  return withAuth(
    async (request, user) => {
      try {
        const { searchParams } = new URL(request.url);
        const filters = {
          branchId: searchParams.get('branchId'),
          category: searchParams.get('category'),
          paymentStatus: searchParams.get('paymentStatus'),
          startDate: searchParams.get('startDate'),
          endDate: searchParams.get('endDate'),
          page: searchParams.get('page') || 1,
          limit: searchParams.get('limit') || 20,
        };
        
        const result = await getAllExpenses(filters);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Get expenses error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch expenses' },
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
        
        if (!body.title || !body.amount || !body.category || !body.branchId) {
          return NextResponse.json(
            { success: false, message: 'Title, amount, category, and branch are required' },
            { status: 400 }
          );
        }
        
        const result = await createExpense(body, user.userId);
        
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        console.error('Create expense error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to create expense' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
