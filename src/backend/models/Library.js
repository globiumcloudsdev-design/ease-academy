import mongoose from 'mongoose';

const librarySchema = new mongoose.Schema(
  {
    // Basic Book Information
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      index: true,
    },
    isbn: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Classification
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Mathematics',
        'English',
        'Urdu',
        'Islamiyat',
        'Social Studies',
        'Computer Science',
        'Physics',
        'Chemistry',
        'Biology',
        'Commerce',
        'Arts',
        'History',
        'Geography',
        'Literature',
        'Reference',
        'Other'
      ],
      index: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },

    // Publication Details
    publisher: {
      type: String,
      trim: true,
    },
    publicationYear: {
      type: Number,
      min: 1000,
      max: new Date().getFullYear() + 1,
    },
    edition: {
      type: String,
      trim: true,
    },

    // Inventory Management
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: 1,
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    damagedCopies: {
      type: Number,
      default: 0,
      min: 0,
    },
    lostCopies: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Pricing and Acquisition
    purchasePrice: {
      type: Number,
      min: 0,
    },
    bookValue: {
      type: Number,
      min: 0,
    },
    purchaseDate: {
      type: Date,
    },
    supplier: {
      type: String,
      trim: true,
    },

    // Location and Access
    shelfLocation: {
      type: String,
      trim: true,
    },
    callNumber: {
      type: String,
      trim: true,
    },

    // Book Cover Image (Cloudinary)
    coverImage: {
      url: { type: String },
      publicId: { type: String },
      uploadedAt: { type: Date },
    },

    // Branch Association
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },

    // Status and Availability
    status: {
      type: String,
      enum: ['available', 'checked_out', 'reserved', 'damaged', 'lost', 'maintenance'],
      default: 'available',
      index: true,
    },

    // Additional Metadata
    language: {
      type: String,
      default: 'English',
      trim: true,
    },
    pages: {
      type: Number,
      min: 1,
    },
    keywords: [{
      type: String,
      trim: true,
    }],

    // Audit Fields
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Notes
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
librarySchema.index({ title: 1, author: 1 });
librarySchema.index({ category: 1, branchId: 1 });
librarySchema.index({ status: 1, branchId: 1 });
librarySchema.index({ isbn: 1 });
librarySchema.index({ keywords: 1 });

// ==================== VIRTUALS ====================

// Virtual for current availability status
librarySchema.virtual('isAvailable').get(function() {
  return this.availableCopies > 0 && this.status === 'available';
});

// Virtual for total borrowed copies
librarySchema.virtual('borrowedCopies').get(function() {
  return this.totalCopies - this.availableCopies - this.damagedCopies - this.lostCopies;
});

// ==================== METHODS ====================

// Method to check out a book
librarySchema.methods.checkout = function() {
  if (this.availableCopies > 0) {
    this.availableCopies -= 1;
    if (this.availableCopies === 0) {
      this.status = 'checked_out';
    }
    return true;
  }
  return false;
};

// Method to return a book
librarySchema.methods.returnBook = function() {
  if (this.availableCopies < this.totalCopies - this.damagedCopies - this.lostCopies) {
    this.availableCopies += 1;
    if (this.availableCopies > 0) {
      this.status = 'available';
    }
    return true;
  }
  return false;
};

// Method to mark as damaged
librarySchema.methods.markDamaged = function() {
  if (this.availableCopies > 0) {
    this.availableCopies -= 1;
    this.damagedCopies += 1;
    if (this.availableCopies === 0) {
      this.status = 'damaged';
    }
    return true;
  }
  return false;
};

// Method to mark as lost
librarySchema.methods.markLost = function() {
  if (this.availableCopies > 0) {
    this.availableCopies -= 1;
    this.lostCopies += 1;
    if (this.availableCopies === 0) {
      this.status = 'lost';
    }
    return true;
  }
  return false;
};

// ==================== STATIC METHODS ====================

// Find available books
librarySchema.statics.findAvailable = function(branchId, filter = {}) {
  return this.find({
    ...filter,
    branchId,
    availableCopies: { $gt: 0 },
    status: 'available'
  });
};

// Find books by category
librarySchema.statics.findByCategory = function(category, branchId) {
  return this.find({ category, branchId });
};

// Search books
librarySchema.statics.searchBooks = function(searchTerm, branchId) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    branchId,
    $or: [
      { title: regex },
      { author: regex },
      { isbn: regex },
      { category: regex },
      { keywords: regex }
    ]
  });
};

// ==================== MIDDLEWARE ====================

// Pre-save: Update available copies if total copies changed
librarySchema.pre('save', function(next) {
  if (this.isModified('totalCopies') && !this.isModified('availableCopies')) {
    // If total copies increased, add to available
    if (this.totalCopies > this.availableCopies + this.damagedCopies + this.lostCopies) {
      this.availableCopies = this.totalCopies - this.damagedCopies - this.lostCopies;
    }
  }

  // Ensure available copies don't exceed total usable copies
  const usableCopies = this.totalCopies - this.damagedCopies - this.lostCopies;
  if (this.availableCopies > usableCopies) {
    this.availableCopies = usableCopies;
  }

  next();
});

const Library = mongoose.models.Library || mongoose.model('Library', librarySchema);

export default Library;
