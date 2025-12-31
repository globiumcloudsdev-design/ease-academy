import { NextResponse } from 'next/server';
import FeeTemplate from '@/backend/models/FeeTemplate';
import Branch from '@/backend/models/Branch';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

// GET - List all fee templates
async function getFeeTemplates(request, authenticatedUser) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const branchId = searchParams.get('branchId') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (branchId) query.branchId = branchId;

    // Get total count
    const total = await FeeTemplate.countDocuments(query);

    // Get templates with pagination
    const templates = await FeeTemplate.find(query)
      .populate('branchId', 'name code city')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching fee templates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch fee templates', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new fee template
async function createFeeTemplate(request, authenticatedUser, userDoc) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      code,
      items,
      baseAmount,
      description,
      frequency,
      applicableTo,
      classes,
      dueDate,
      lateFee,
      discount,
      paymentMethods,
      status,
      branchId,
    } = body;

    // Validation
    if (!name || !code || !items || !Array.isArray(items) || items.length === 0 || !frequency) {
      return NextResponse.json(
        { success: false, message: 'Name, code, items, and frequency are required' },
        { status: 400 }
      );
    }

    // Check if template code already exists
    const existingTemplate = await FeeTemplate.findOne({ code: code.toUpperCase() });
    if (existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template with this code already exists' },
        { status: 400 }
      );
    }

    // Validate branch if provided
    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return NextResponse.json(
          { success: false, message: 'Invalid branch ID' },
          { status: 400 }
        );
      }
    }

    // Create new template
    const template = await FeeTemplate.create({
      name,
      code: code.toUpperCase(),
      items,
      baseAmount: baseAmount || 0,
      description,
      frequency,
      applicableTo: applicableTo || 'all',
      classes: classes || [],
      dueDate: dueDate || { day: 1 },
      lateFee: lateFee || { enabled: false },
      discount: discount || { enabled: false },
      paymentMethods: paymentMethods || ['cash', 'bank-transfer', 'online'],
      status: status || 'active',
      branchId: branchId || null,
      createdBy: userDoc._id,
    });

    const populatedTemplate = await FeeTemplate.findById(template._id)
      .populate('branchId', 'name code city')
      .populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Fee template created successfully',
      data: populatedTemplate,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating fee template:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create fee template', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFeeTemplates, [requireRole('super_admin')]);
export const POST = withAuth(createFeeTemplate, [requireRole('super_admin')]);
