import mongoose from 'mongoose';

const branchFeeSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Please provide branch'],
    },
    feeName: {
      type: String,
      required: [true, 'Please provide fee name'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide amount'],
    },
    feeType: {
      type: String,
      enum: ['monthly', 'quarterly', 'halfYearly', 'yearly'],
      default: 'monthly',
    },
    description: {
      type: String,
      trim: true,
    },
    appliedFrom: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Indexes
branchFeeSchema.index({ branchId: 1, status: 1 });
branchFeeSchema.index({ feeName: 'text', description: 'text' });

export default mongoose.models.BranchFee ||
  mongoose.model('BranchFee', branchFeeSchema);
