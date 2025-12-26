import { NextResponse } from 'next/server';
import FeeCategory from '@/backend/models/FeeCategory';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

// GET - Get all fee categories for branch admin
async function getFeeCategories(request, authenticatedUser, userDoc) {
  try {
    await connectDB();

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 100;

    // Build query - categories for this branch or school-wide
    const query = {
      $or: [
        { branchId: authenticatedUser.branchId },
        { branchId: null }
      ]
    };
    
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$and = [
        { ...query },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } },
          ]
        }
      ];
    }

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      FeeCategory.find(query)
        .populate('branchId', 'name code')
        .skip(skip)
        .limit(limit)
        .lean(),
      FeeCategory.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get fee categories error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch fee categories' },
      { status: 500 }
    );
  }
}

// POST - Create new fee category
async function createFeeCategory(request, authenticatedUser, userDoc) {
  try {
    await connectDB();

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, code, description, color, icon, isActive } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if code already exists in this branch
    const existing = await FeeCategory.findOne({
      code: code.toUpperCase(),
      branchId: authenticatedUser.branchId,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Category with this code already exists in your branch' },
        { status: 400 }
      );
    }

    const category = await FeeCategory.create({
      name,
      code: code.toUpperCase(),
      description,
      color: color || 'blue',
      icon: icon || 'book',
      isActive: isActive !== false,
      branchId: authenticatedUser.branchId, // Branch-admin can only create for their branch
    });

    const populatedCategory = await FeeCategory.findById(category._id)
      .populate('branchId', 'name code');

    return NextResponse.json({
      success: true,
      message: 'Fee category created successfully',
      data: populatedCategory,
    }, { status: 201 });
  } catch (error) {
    console.error('Create fee category error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create fee category' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFeeCategories, [requireRole(['branch_admin'])]);
export const POST = withAuth(createFeeCategory, [requireRole(['branch_admin'])]);
