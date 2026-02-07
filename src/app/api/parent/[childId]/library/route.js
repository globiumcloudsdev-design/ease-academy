import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Library from '@/backend/models/Library';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    // Verify parent owns this child
    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Get the child's branch (assuming child is a student)
    const child = await User.findById(childId).lean();
    if (!child || child.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Child not found or not a student' }, { status: 404 });
    }

    // Get available books for the child's branch and class
    // Books can be general (no classId) or specific to the child's class
    const availableBooks = await Library.find({
      branchId: child.branchId,
      availableCopies: { $gt: 0 },
      status: 'available',
      $or: [
        { classId: null }, // General books available to all classes
        { classId: child.studentProfile?.classId } // Books specific to child's class
      ]
    })
    .select('+attachments title author category isbn description availableCopies totalCopies shelfLocation classId')
    .populate('classId', 'name grade level stream')
    .sort({ title: 1 })
    .lean();

    // Ensure attachments are properly included in the response
    // Transform the data to make sure attachments are accessible
    const booksWithAttachments = availableBooks.map(book => ({
      ...book,
      attachments: book.attachments || [],
      // Add convenience fields for frontend
      hasAttachments: (book.attachments && book.attachments.length > 0) || false,
      attachmentCount: (book.attachments && book.attachments.length) || 0
    }));

    // Get child's current borrowed books (placeholder for future borrowing system)
    const borrowedBooks = []; // TODO: Implement borrowing history

    const libraryData = {
      availableBooks: booksWithAttachments,
      borrowedBooks,
      totalAvailable: booksWithAttachments.length,
      childInfo: {
        id: child._id,
        name: child.fullName,
        class: child.studentProfile?.currentClass,
        branch: child.branchId
      }
    };

    return NextResponse.json({
      success: true,
      data: libraryData,
      message: 'Library data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching library:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch library data' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
