import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import BranchFee from '@/backend/models/BranchFee';

// GET - Get all fees for branch admin's branch
async function getFees(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const feeType = searchParams.get('feeType');

    // Build query - only for this branch
    const query = { branchId: authenticatedUser.branchId };
    
    if (search) {
      query.$or = [
        { feeName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (feeType) {
      query.feeType = feeType;
    }

    const skip = (page - 1) * limit;

    const [fees, total] = await Promise.all([
      BranchFee.find(query)
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BranchFee.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        fees,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get fees error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch fees' },
      { status: 500 }
    );
  }
}

// POST - Create new fee (only for branch admin's branch)
async function createFee(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Ensure fee is created for admin's branch only
    const feeData = {
      ...body,
      branchId: authenticatedUser.branchId, // Force branch to admin's branch
      createdBy: authenticatedUser.userId,
    };

    const fee = new BranchFee(feeData);
    await fee.save();

    return NextResponse.json({
      success: true,
      data: fee,
      message: 'Fee created successfully',
    });
  } catch (error) {
    console.error('Create fee error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create fee' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFees);
export const POST = withAuth(createFee);
