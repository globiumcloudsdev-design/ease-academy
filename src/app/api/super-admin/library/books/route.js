import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Library from '@/backend/models/Library';
import { withAuth } from '@/backend/middleware/auth';

export const GET = withAuth(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Branch filter
    if (branch) {
      query.branchId = branch;
    }

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      Library.find(query)
        .populate('branchId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Library.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        books,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch books', error: error.message },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request, authenticatedUser) => {
  try {
    await connectDB();
    const body = await request.json();

    // Basic validation
    if (!body.title || !body.author || !body.category || !body.branchId || !body.totalCopies) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Set available copies to total copies initially if not provided
    if (body.availableCopies === undefined) {
      body.availableCopies = body.totalCopies;
    }

    const book = new Library({
      ...body,
      addedBy: authenticatedUser.userId,
      lastUpdatedBy: authenticatedUser.userId
    });

    await book.save();

    return NextResponse.json(
      { success: true, message: 'Book added successfully', data: book },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating book:', error);
    
    // Handle duplicate ISBN error
    if (error.code === 11000 && error.keyPattern?.isbn) {
      return NextResponse.json(
        { success: false, message: 'A book with this ISBN already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create book', error: error.message },
      { status: 500 }
    );
  }
});
