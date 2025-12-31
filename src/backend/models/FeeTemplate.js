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
    items: [{
      name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
      },
      amount: {
        type: Number,
        required: [true, 'Item amount is required'],
        min: [0, 'Amount cannot be negative'],
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
      },
    }],
    baseAmount: {
      type: Number,
      default: 0,
      min: [0, 'Base amount cannot be negative'],
    },
    totalAmount: {
      type: Number,
      default: 0,
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

// Pre-save hook to calculate totalAmount
feeTemplateSchema.pre('save', function(next) {
  let sum = this.baseAmount || 0;

  if (this.items && this.items.length > 0) {
    sum += this.items.reduce((total, item) => {
      let itemTotal = item.amount;
      if (item.discount && item.discount.enabled) {
        if (item.discount.type === 'fixed') {
          itemTotal -= item.discount.amount;
        } else if (item.discount.type === 'percentage') {
          itemTotal -= (item.amount * item.discount.amount) / 100;
        }
      }
      return total + Math.max(0, itemTotal);
    }, 0);
  }

  // Apply global discount if enabled
  if (this.discount && this.discount.enabled) {
    if (this.discount.type === 'fixed') {
      sum -= this.discount.amount;
    } else if (this.discount.type === 'percentage') {
      sum -= (sum * this.discount.amount) / 100;
    }
  }

  this.totalAmount = Math.max(0, sum);
  next();
});

// Indexes for faster queries
feeTemplateSchema.index({ code: 1 });
feeTemplateSchema.index({ status: 1 });
feeTemplateSchema.index({ branchId: 1 });
feeTemplateSchema.index({ totalAmount: 1 });

const FeeTemplate = mongoose.models.FeeTemplate || mongoose.model('FeeTemplate', feeTemplateSchema);

export default FeeTemplate;
