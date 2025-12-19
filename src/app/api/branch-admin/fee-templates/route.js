import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import FeeTemplate from '@/backend/models/FeeTemplate';

// GET - Get all fee templates for branch admin's branch
async function getFeeTemplates(request, authenticatedUser, userDoc) {
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
    const category = searchParams.get('category');

    // Build query - only for this branch or school-wide (null branchId)
    const query = {
      $or: [
        { branchId: authenticatedUser.branchId },
        { branchId: null }
      ]
    };
    
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

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      FeeTemplate.find(query)
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeeTemplate.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get fee templates error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch fee templates' },
      { status: 500 }
    );
  }
}

// POST - Create new fee template (only for branch admin's branch)
async function createFeeTemplate(request, authenticatedUser, userDoc) {
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

    // Ensure template is created for admin's branch only
    const templateData = {
      ...body,
      branchId: authenticatedUser.branchId, // Force branch to admin's branch
      createdBy: authenticatedUser.userId,
    };

    const template = new FeeTemplate(templateData);
    await template.save();

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Fee template created successfully',
    });
  } catch (error) {
    console.error('Create fee template error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create fee template' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFeeTemplates);
export const POST = withAuth(createFeeTemplate);
