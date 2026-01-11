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

    // Get available books for the child's branch
    const availableBooks = await Library.find({
      branchId: child.branchId,
      availableCopies: { $gt: 0 },
      status: 'available'
    })
    .select('title author category isbn description availableCopies totalCopies shelfLocation')
    .sort({ title: 1 })
    .lean();

    // Get child's current borrowed books (placeholder for future borrowing system)
    const borrowedBooks = []; // TODO: Implement borrowing history

    const libraryData = {
      availableBooks,
      borrowedBooks,
      totalAvailable: availableBooks.length,
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
