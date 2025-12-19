import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import {
  getAllBranches,
  createBranch,
  getBranchStats,
} from '@/backend/controllers/branchController';

export async function GET(request) {
  return withAuth(
    async (request, user) => {
      try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = searchParams.get('page') || 1;
        const limit = searchParams.get('limit') || 10;
        
        const result = await getAllBranches({ status, search, page, limit });
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Get branches error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch branches' },
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
        
        const { name, code, address, contact, adminId, settings } = body;
        
        // Validate required fields
        if (!name || !code) {
          return NextResponse.json(
            { success: false, message: 'Branch name and code are required' },
            { status: 400 }
          );
        }
        
        const result = await createBranch({
          name,
          code,
          address,
          contact,
          adminId,
          settings,
        });
        
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        console.error('Create branch error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to create branch' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
