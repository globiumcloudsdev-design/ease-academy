import { NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import FeeTemplate from '@/backend/models/FeeTemplate';
import { withAuth } from '@/backend/middleware/auth';

// GET - Get single fee template
async function getFeeTemplate(request) {
  try {
    await dbConnect();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const template = await FeeTemplate.findById(id)
      .populate('branchId', 'name code city')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Fee template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error fetching fee template:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch fee template', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update fee template
async function updateFeeTemplate(request, authenticatedUser, userDoc) {
  try {
    await dbConnect();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const body = await request.json();

    // Find template
    const template = await FeeTemplate.findById(id);
    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Fee template not found' },
        { status: 404 }
      );
    }

    // Update template
    const updateData = {
      ...body,
      updatedBy: userDoc._id,
    };

    const updatedTemplate = await FeeTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('branchId', 'name code city')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Fee template updated successfully',
      data: updatedTemplate,
    });
  } catch (error) {
    console.error('Error updating fee template:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update fee template', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete fee template
async function deleteFeeTemplate(request) {
  try {
    await dbConnect();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const template = await FeeTemplate.findById(id);
    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Fee template not found' },
        { status: 404 }
      );
    }

    // Archive instead of delete (soft delete)
    await FeeTemplate.findByIdAndUpdate(id, { status: 'archived' });

    return NextResponse.json({
      success: true,
      message: 'Fee template archived successfully',
    });
  } catch (error) {
    console.error('Error deleting fee template:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete fee template', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFeeTemplate);
export const PUT = withAuth(updateFeeTemplate);
export const DELETE = withAuth(deleteFeeTemplate);
