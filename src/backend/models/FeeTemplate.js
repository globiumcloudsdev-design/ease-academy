import mongoose from 'mongoose';

const feeTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      minlength: [2, 'Template name must be at least 2 characters'],
      maxlength: [100, 'Template name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Template code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeCategory',
      required: [true, 'Fee category is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: ['one-time', 'monthly', 'quarterly', 'half-yearly', 'annually'],
      default: 'monthly',
    },
    applicableTo: {
      type: String,
      enum: ['all', 'class-specific', 'student-specific'],
      default: 'all',
    },
    classes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    }],
    sections: [{
      type: String,
      trim: true,
    }],
    dueDate: {
      day: {
        type: Number,
        min: 1,
        max: 31,
        default: 1,
      },
      month: {
        type: Number,
        min: 1,
        max: 12,
      },
    },
    lateFee: {
      enabled: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        enum: ['fixed', 'percentage'],
        default: 'fixed',
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      graceDays: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    discount: {
      enabled: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        enum: ['fixed', 'percentage'],
        default: 'fixed',
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      criteria: {
        type: String,
        trim: true,
      },
    },
    paymentMethods: [{
      type: String,
      enum: ['cash', 'bank-transfer', 'online', 'cheque', 'card'],
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
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
feeTemplateSchema.index({ code: 1 });
feeTemplateSchema.index({ category: 1 });
feeTemplateSchema.index({ status: 1 });
feeTemplateSchema.index({ branchId: 1 });

const FeeTemplate = mongoose.models.FeeTemplate || mongoose.model('FeeTemplate', feeTemplateSchema);

export default FeeTemplate;
