import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Library from '@/backend/models/Library';
import { withAuth } from '@/backend/middleware/auth';

// Helper to get ID from URL
function extractIdFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

export const GET = withAuth(async (request) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);

    const book = await Library.findById(id).populate('branchId', 'name');

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

export const PUT = withAuth(async (request, authenticatedUser) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);
    const body = await request.json();

    const book = await Library.findById(id);

    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    // Update fields
    Object.keys(body).forEach((key) => {
      // Prevent updating system fields directly if needed, but for now we trust validation logic
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'addedBy') {
        book[key] = body[key];
      }
    });

    // Handle copy count changes logic implicitly by model pre-save or explicit logic if needed
    // For now assuming direct update is okay, but we should ensure available copies are consistent.
    // The Library model has a pre-save hook that might handle this, but let's be safe.
    // If totalCopies is changed, we might need to adjust availableCopies delta.
    // Check model pre-save logic in attachment...
    // "Pre-save: Update available copies if total copies changed" - Good. 
    // It says: "Update available copies if total copies changed". 
    
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

export const DELETE = withAuth(async (request) => {
  try {
    await connectDB();
    const id = extractIdFromUrl(request.url);

    const book = await Library.findByIdAndDelete(id);

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
