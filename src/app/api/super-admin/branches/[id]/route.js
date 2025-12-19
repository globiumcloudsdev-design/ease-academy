import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import {
  getBranchById,
  updateBranch,
  deleteBranch,
} from '@/backend/controllers/branchController';

export async function GET(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = await params;
        const result = await getBranchById(id);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Get branch error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch branch' },
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
        const { id } = await params;
        const body = await request.json();
        
        const result = await updateBranch(id, body);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Update branch error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to update branch' },
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
        const result = await deleteBranch(id);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Delete branch error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to delete branch' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
