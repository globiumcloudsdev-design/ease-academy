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

const FeeVoucher = mongoose.models.FeeVoucher || mongoose.model('FeeVoucher', feeVoucherSchema);

export default FeeVoucher;
