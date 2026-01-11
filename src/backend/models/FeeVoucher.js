import mongoose from 'mongoose';

const feeVoucherSchema = new mongoose.Schema(
  {
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeTemplate',
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    baseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    items: [{
      name: String,
      amount: Number,
      discount: {
        enabled: Boolean,
        type: {
          type: String,
          enum: ['fixed', 'percentage'],
        },
        amount: Number,
      }
    }],
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'overdue', 'cancelled'],
      default: 'pending',
    },
    paymentHistory: [{
      amount: Number,
      paymentDate: Date,
      paymentMethod: {
        type: String,
        enum: ['cash', 'bank-transfer', 'online', 'cheque', 'card'],
      },
      transactionId: String,
      screenshot: {
        url: String,
        publicId: String,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      approvedAt: Date,
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectedAt: Date,
      rejectionReason: String,
      receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      remarks: String,
    }],
    remarks: {
      type: String,
      trim: true,
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

// Indexes
feeVoucherSchema.index({ voucherNumber: 1 });
feeVoucherSchema.index({ studentId: 1 });
feeVoucherSchema.index({ branchId: 1 });
feeVoucherSchema.index({ status: 1 });
feeVoucherSchema.index({ dueDate: 1 });
feeVoucherSchema.index({ month: 1, year: 1 });

// Compound index to prevent duplicate vouchers
feeVoucherSchema.index({ studentId: 1, templateId: 1, month: 1, year: 1 }, { unique: true });

// Pre-save middleware to check for overdue status
feeVoucherSchema.pre('save', function(next) {
  const now = new Date();
  
  // Auto-update to overdue if past due date and not fully paid
  if (this.dueDate < now && this.remainingAmount > 0 && this.status !== 'paid' && this.status !== 'cancelled') {
    this.status = 'overdue';
  }
  
  next();
});

// Static method to update all overdue vouchers
feeVoucherSchema.statics.updateOverdueVouchers = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      dueDate: { $lt: now },
      remainingAmount: { $gt: 0 },
      status: { $nin: ['paid', 'cancelled', 'overdue'] }
    },
    {
      $set: { status: 'overdue' }
    }
  );
  return result;
};

const FeeVoucher = mongoose.models.FeeVoucher || mongoose.model('FeeVoucher', feeVoucherSchema);

export default FeeVoucher;
