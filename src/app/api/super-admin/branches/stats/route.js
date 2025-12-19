import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import { getBranchStats } from '@/backend/controllers/branchController';

export async function GET(request) {
  return withAuth(
    async (request, user) => {
      try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');
        
        const result = await getBranchStats(branchId);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Get branch stats error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch statistics' },
          { status: 500 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
