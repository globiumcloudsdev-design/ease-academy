import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Library from '@/backend/models/Library';
import User from '@/backend/models/User';

// GET /api/branch-admin/library/books - List all books for branch admin
const handleGET = withAuth(async (request, user, userDoc, context) => {
  try {
    await connectDB();

    // Only branch admins can access
    if (userDoc.role !== 'branch_admin') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    // Build filter
    const filter = { branchId: userDoc.branchId };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { title: regex },
        { author: regex },
        { isbn: regex },
        { category: regex }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    // Get total count
    const total = await Library.countDocuments(filter);

    // Get books with pagination
    const books = await Library.find(filter)
      .populate('addedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        books,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages
        }
      }
    });

  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch books' }, { status: 500 });
  }
});

// POST /api/branch-admin/library/books - Add new book
const handlePOST = withAuth(async (request, user, userDoc, context) => {
  try {
    await connectDB();

    // Only branch admins can access
    if (userDoc.role !== 'branch_admin') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      author,
      isbn,
      description,
      category,
      subCategory,
      publisher,
      publicationYear,
      edition,
      totalCopies,
      purchasePrice,
      bookValue,
      purchaseDate,
      supplier,
      shelfLocation,
      callNumber,
      language,
      pages,
      keywords,
      notes
    } = body;

    // Validate required fields
    if (!title || !author || !category || !totalCopies) {
      return NextResponse.json({
        success: false,
        message: 'Title, author, category, and total copies are required'
      }, { status: 400 });
    }

    // Check if ISBN already exists (if provided)
    if (isbn) {
      const existingBook = await Library.findOne({ isbn, branchId: userDoc.branchId });
      if (existingBook) {
        return NextResponse.json({
          success: false,
          message: 'A book with this ISBN already exists'
        }, { status: 400 });
      }
    }

    // Create new book
    const newBook = new Library({
      title,
      author,
      isbn,
      description,
      category,
      subCategory,
      publisher,
      publicationYear,
      edition,
      totalCopies,
      availableCopies: totalCopies, // Initially all copies are available
      purchasePrice,
      bookValue,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      supplier,
      shelfLocation,
      callNumber,
      language,
      pages,
      keywords,
      notes,
      branchId: userDoc.branchId,
      addedBy: userDoc._id,
      lastUpdatedBy: userDoc._id
    });

    await newBook.save();

    // Populate addedBy for response
    await newBook.populate('addedBy', 'firstName lastName');

    return NextResponse.json({
      success: true,
      message: 'Book added successfully',
      data: newBook
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding book:', error);
    return NextResponse.json({ success: false, message: 'Failed to add book' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handleGET(request, context);
}

export async function POST(request, context) {
  return handlePOST(request, context);
}
