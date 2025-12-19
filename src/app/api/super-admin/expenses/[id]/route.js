import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import {
  updateExpense,
  deleteExpense,
} from '@/backend/controllers/expenseController';

export async function PUT(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = params;
        const body = await request.json();
        
        const result = await updateExpense(id, body);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Update expense error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to update expense' },
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
        const result = await deleteExpense(id);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Delete expense error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to delete expense' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
