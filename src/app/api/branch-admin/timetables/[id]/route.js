import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import { getTimetableById, updateTimetable, deleteTimetable } from '@/backend/controllers/timetableController';

/**
 * GET /api/branch-admin/timetables/[id]
 * Get a specific timetable by ID (branch admins can only access timetables from their branch)
 */
export const GET = withAuth(
  async (request, user, userDoc, { params }) => {
    try {
      const { id } = await params;
      const branchId = user.branchId;

      if (!branchId) {
        return NextResponse.json({ success: false, message: 'Branch not assigned to user' }, { status: 403 });
      }

      const result = await getTimetableById(id, branchId);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Branch admin get timetable error:', error);
      return NextResponse.json({ success: false, message: error.message || 'Failed to fetch timetable' }, { status: 500 });
    }
  },
  [requireRole(ROLES.BRANCH_ADMIN)]
);

/**
 * PUT /api/branch-admin/timetables/[id]
 * Update a specific timetable (branch admins can only update timetables from their branch)
 */
export const PUT = withAuth(
  async (request, user, userDoc, { params }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const branchId = user.branchId;

      if (!branchId) {
        return NextResponse.json({ success: false, message: 'Branch not assigned' }, { status: 403 });
      }

      // Ensure branch cannot be changed to another branch
      body.branchId = branchId;

      const result = await updateTimetable(id, body, user._id);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Branch admin update timetable error:', error);
      return NextResponse.json({ success: false, message: error.message || 'Failed to update timetable' }, { status: 500 });
    }
  },
  [requireRole(ROLES.BRANCH_ADMIN)]
);

/**
 * DELETE /api/branch-admin/timetables/[id]
 * Delete a specific timetable (branch admins can only delete timetables from their branch)
 */
export const DELETE = withAuth(
  async (request, user, userDoc, { params }) => {
    try {
      const { id } = await params;
      const branchId = user.branchId;

      if (!branchId) {
        return NextResponse.json({ success: false, message: 'Branch not assigned' }, { status: 403 });
      }

      // First check if the timetable belongs to the user's branch
      const timetable = await getTimetableById(id, branchId);
      if (!timetable.success) {
        return NextResponse.json(timetable, { status: 404 });
      }

      const result = await deleteTimetable(id);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Branch admin delete timetable error:', error);
      return NextResponse.json({ success: false, message: error.message || 'Failed to delete timetable' }, { status: 500 });
    }
  },
  [requireRole(ROLES.BRANCH_ADMIN)]
);