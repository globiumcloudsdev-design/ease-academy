import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Library from '@/backend/models/Library';
import User from '@/backend/models/User';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

// Ensure Node runtime so Buffer is available for binary handling
export const runtime = 'nodejs';

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
    const classId = searchParams.get('class') || '';

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

    if (classId) {
      filter.classId = classId;
    }

    // Get total count
    const total = await Library.countDocuments(filter);

    // Get books with pagination
    const books = await Library.find(filter)
      .select('+attachments') // Explicitly include attachments
      .populate('addedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    // Add convenience fields for attachments
    const booksWithAttachments = books.map(book => ({
      ...book,
      hasAttachments: (book.attachments && book.attachments.length > 0) || false,
      attachmentCount: (book.attachments && book.attachments.length) || 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        books: booksWithAttachments,
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

    let body, attachments = [];

    // Check if request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      // Parse JSON data
      const jsonData = formData.get('data');
      if (!jsonData) {
        return NextResponse.json({
          success: false,
          message: 'Book data is required'
        }, { status: 400 });
      }
      body = JSON.parse(jsonData);

      // Handle file uploads
      const files = formData.getAll('attachments');
      for (const file of files) {
        if (file && file.size > 0) {
          // Validate file type
          const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
          ];

          if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
              success: false,
              message: `File type ${file.type} is not allowed. Allowed types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG, GIF`
            }, { status: 400 });
          }

          // Convert file to buffer and upload to Cloudinary
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

          const uploadResult = await uploadToCloudinary(base64File, {
            folder: `ease-academy/library/${userDoc.branchId}`,
            resourceType: 'auto'
          });

          // Get file extension for fileType
          const fileName = file.name;
          const fileExtension = fileName.split('.').pop().toLowerCase();

          attachments.push({
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            filename: fileName,
            fileType: fileExtension,
            mimeType: file.type,
            size: file.size,
            uploadedBy: userDoc._id
          });
        }
      }
    } else {
      body = await request.json();
    }

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
      notes,
      classId
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
      attachments, // Add attachments to the book
      classId: classId || null, // Class association (null for general books)
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
