import { withAuth } from '@/backend/middleware/auth';
import BranchFee from '@/backend/models/BranchFee';
import Branch from '@/backend/models/Branch';

async function handler(request, authenticatedUser, userDoc) {
  if (request.method === 'GET') {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number(searchParams.get('page')) || 1;
      const limit = Number(searchParams.get('limit')) || 10;
      const skip = (page - 1) * limit;
      const search = searchParams.get('search');
      const branchId = searchParams.get('branchId');

      let query = {};

      if (search) {
        query.$or = [
          { feeName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (branchId) {
        query.branchId = branchId;
      }

      const fees = await BranchFee.find(query)
        .populate('branchId', 'name code')
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await BranchFee.countDocuments(query);

      return Response.json({
        success: true,
        data: fees,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { branchId, feeName, amount, feeType, appliedFrom, description, status } =
        body;

      if (!branchId || !feeName || !amount || !feeType) {
        return Response.json(
          { success: false, message: 'Please provide all required fields' },
          { status: 400 }
        );
      }

      // Check if branch exists
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return Response.json(
          { success: false, message: 'Branch not found' },
          { status: 404 }
        );
      }

      const newFee = await BranchFee.create({
        branchId,
        feeName,
        amount,
        feeType,
        appliedFrom: appliedFrom || new Date(),
        description,
        status: status || 'active',
        createdBy: userDoc._id,
      });

      await newFee.populate('branchId', 'name code');
      await newFee.populate('createdBy', 'firstName lastName email');

      return Response.json({ success: true, data: newFee }, { status: 201 });
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
export const POST = withAuth(handler);
