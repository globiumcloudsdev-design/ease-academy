import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    description: String,
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    category: {
      type: String,
      enum: ['salary', 'utilities', 'maintenance', 'supplies', 'equipment', 'transportation', 'marketing', 'other'],
      required: [true, 'Category is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'credit_card', 'online'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'cancelled'],
      default: 'pending',
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    vendor: {
      name: String,
      contact: String,
      email: String,
    },
    invoice: {
      number: String,
      url: String,
    },
    receipt: {
      number: String,
      url: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalDate: Date,
    notes: String,
    tags: [String],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
expenseSchema.index({ branchId: 1, date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ paymentStatus: 1 });
expenseSchema.index({ date: 1 });

// Virtual for balance
expenseSchema.virtual('balance').get(function () {
  return this.amount - this.paidAmount;
});

// Method to check if fully paid
expenseSchema.methods.isFullyPaid = function () {
  return this.paidAmount >= this.amount;
};

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

export default Expense;
