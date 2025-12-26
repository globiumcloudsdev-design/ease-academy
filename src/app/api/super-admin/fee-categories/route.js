import { NextResponse } from 'next/server';
import FeeCategory from '@/backend/models/FeeCategory';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

// GET - Get all fee categories
async function getFeeCategories(request, authenticatedUser, userDoc) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 100;
    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (branchId && branchId !== 'all') {
      query.$or = [
        { branchId: branchId },
        { branchId: null }
      ];
    } else {
      // Return all categories (school-wide and branch-specific)
    }

    if (isActive !== undefined && isActive !== null && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      FeeCategory.find(query)
        .populate('branchId', 'name code')
        .populate('createdBy', 'firstName lastName')
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

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json(
        { success: false, message: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCategory = await FeeCategory.findOne({ code: body.code.toUpperCase() });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category code already exists' },
        { status: 400 }
      );
    }

    const categoryData = {
      ...body,
      code: body.code.toUpperCase(),
      createdBy: userDoc._id,
    };

    const category = new FeeCategory(categoryData);
    await category.save();

    await category.populate('branchId', 'name code');

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Fee category created successfully',
    });
  } catch (error) {
    console.error('Create fee category error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create fee category' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFeeCategories, [requireRole(['super_admin'])]);
export const POST = withAuth(createFeeCategory, [requireRole(['super_admin'])]);
