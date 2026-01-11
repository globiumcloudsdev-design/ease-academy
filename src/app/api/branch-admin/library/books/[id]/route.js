import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Library from '@/backend/models/Library';
import { withAuth } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();
    const { params } = context;
    const { id } = await params;

    // Ensure the book belongs to the admin's branch
    const book = await Library.findOne({ _id: id, branchId: userDoc.branchId });

    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: book });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch book', error: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();
    const { params } = context;
    const { id } = await params;
    const body = await request.json();

    // Ensure the book belongs to the admin's branch
    const book = await Library.findOne({ _id: id, branchId: userDoc.branchId });

    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    // Update fields
    Object.keys(body).forEach((key) => {
      // Prevent updating system fields or branchId directly
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'addedBy' && key !== 'branchId') {
        book[key] = body[key];
      }
    });

    book.lastUpdatedBy = authenticatedUser.userId;

    await book.save();

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully',
      data: book,
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update book', error: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();
    const { params } = context;
    const { id } = await params;

    // Ensure the book belongs to the admin's branch
    const book = await Library.findOneAndDelete({ _id: id, branchId: userDoc.branchId });

    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete book', error: error.message },
      { status: 500 }
    );
  }
});
