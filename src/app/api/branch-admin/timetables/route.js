import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import { getTimetables, createTimetable, updateTimetable, deleteTimetable } from '@/backend/controllers/timetableController';

/**
 * GET /api/branch-admin/timetables
 * Returns timetables limited to the authenticated branch-admin's branch
 */
export const GET = withAuth(
  async (request, user, userDoc) => {
    try {
      // user.branchId is set in withAuth authenticate
      const branchId = user.branchId;
      if (!branchId) {
        return NextResponse.json({ success: false, message: 'Branch not assigned to user' }, { status: 403 });
      }

      const { searchParams } = new URL(request.url);
      const filters = {
        branchId,
        classId: searchParams.get('classId'),
        academicYear: searchParams.get('academicYear'),
        status: searchParams.get('status'),
        page: searchParams.get('page') || 1,
        limit: searchParams.get('limit') || 50,
      };

      const result = await getTimetables(filters);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Branch admin get timetables error:', error);
      return NextResponse.json({ success: false, message: error.message || 'Failed to fetch timetables' }, { status: 500 });
    }
  },
  [requireRole(ROLES.BRANCH_ADMIN)]
);

export default GET;

// Allow branch-admins to create timetables for their own branch
export const POST = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const branchId = user.branchId;
      if (!branchId) return NextResponse.json({ success: false, message: 'Branch not assigned' }, { status: 403 });

      // Enforce branchId to user's branch
      body.branchId = branchId;

      const result = await createTimetable(body, user._id);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Branch admin create timetable error:', error);
      return NextResponse.json({ success: false, message: error.message || 'Failed to create timetable' }, { status: 500 });
    }
  },
  [requireRole(ROLES.BRANCH_ADMIN)]
);

// Update timetable (branch admins can only update timetables belonging to their branch)
export const PUT = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      const body = await request.json();
      const branchId = user.branchId;
      if (!branchId) return NextResponse.json({ success: false, message: 'Branch not assigned' }, { status: 403 });
      if (!id && !body._id) return NextResponse.json({ success: false, message: 'Timetable id required' }, { status: 400 });
      const timetableId = id || body._id;

      // Ensure branch cannot be changed to another branch
      body.branchId = branchId;

      const result = await updateTimetable(timetableId, body, user._id);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Branch admin update timetable error:', error);
      return NextResponse.json({ success: false, message: error.message || 'Failed to update timetable' }, { status: 500 });
    }
  },
  [requireRole(ROLES.BRANCH_ADMIN)]
);

// Delete timetable
export const DELETE = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ success: false, message: 'Timetable id required' }, { status: 400 });
      const result = await deleteTimetable(id);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Branch admin delete timetable error:', error);
      return NextResponse.json({ success: false, message: error.message || 'Failed to delete timetable' }, { status: 500 });
    }
  },
  [requireRole(ROLES.BRANCH_ADMIN)]
);
