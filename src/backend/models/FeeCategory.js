import mongoose from 'mongoose';

const feeCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    color: {
      type: String,
      default: 'blue',
      enum: ['blue', 'green', 'purple', 'yellow', 'pink', 'indigo', 'orange', 'red', 'gray', 'teal', 'cyan'],
    },
    icon: {
      type: String,
      default: 'DollarSign',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null, // null means school-wide
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
feeCategorySchema.index({ code: 1 });
feeCategorySchema.index({ branchId: 1 });
feeCategorySchema.index({ isActive: 1 });

const FeeCategory = mongoose.models.FeeCategory || mongoose.model('FeeCategory', feeCategorySchema);

export default FeeCategory;
