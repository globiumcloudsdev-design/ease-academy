import { withAuth } from '@/backend/middleware/auth';
import BranchFee from '@/backend/models/BranchFee';

async function handler(request, authenticatedUser, userDoc) {
  const id = request.url.split('/').pop();

  if (request.method === 'GET') {
    try {
      const fee = await BranchFee.findById(id)
        .populate('branchId', 'name code')
        .populate('createdBy', 'firstName lastName email');

      if (!fee) {
        return Response.json(
          { success: false, message: 'Branch fee not found' },
          { status: 404 }
        );
      }

      return Response.json({ success: true, data: fee });
    } catch (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const { feeName, amount, feeType, appliedFrom, description, status } = body;

      const fee = await BranchFee.findById(id);
      if (!fee) {
        return Response.json(
          { success: false, message: 'Branch fee not found' },
          { status: 404 }
        );
      }

      fee.feeName = feeName || fee.feeName;
      fee.amount = amount || fee.amount;
      fee.feeType = feeType || fee.feeType;
      fee.appliedFrom = appliedFrom || fee.appliedFrom;
      fee.description = description || fee.description;
      fee.status = status || fee.status;

      await fee.save();
      await fee.populate('branchId', 'name code');
      await fee.populate('createdBy', 'firstName lastName email');

      return Response.json({ success: true, data: fee });
    } catch (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  if (request.method === 'DELETE') {
    try {
      const fee = await BranchFee.findByIdAndDelete(id);

      if (!fee) {
        return Response.json(
          { success: false, message: 'Branch fee not found' },
          { status: 404 }
        );
      }

      return Response.json({ success: true, message: 'Branch fee deleted successfully' });
    } catch (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  return Response.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  );
}

export const GET = withAuth(handler);
export const PUT = withAuth(handler);
export const DELETE = withAuth(handler);
