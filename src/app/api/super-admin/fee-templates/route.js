import { NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import FeeTemplate from '@/backend/models/FeeTemplate';
import Branch from '@/backend/models/Branch';
import { withAuth } from '@/backend/middleware/auth';

// GET - List all fee templates
async function getFeeTemplates(request, authenticatedUser) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
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
      ];
    }
    if (category) query.category = category;
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
    await dbConnect();

    const body = await request.json();
    const {
      name,
      code,
      category,
      description,
      amount,
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
    if (!name || !code || !category || !amount || !frequency) {
      return NextResponse.json(
        { success: false, message: 'Name, code, category, amount, and frequency are required' },
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
      category,
      description,
      amount,
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

export const GET = withAuth(getFeeTemplates);
export const POST = withAuth(createFeeTemplate);
