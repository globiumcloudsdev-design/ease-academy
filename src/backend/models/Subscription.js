import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    planType: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'enterprise'],
      required: [true, 'Plan type is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      required: [true, 'Billing cycle is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'suspended'],
      default: 'active',
      index: true,
    },
    features: [{
      type: String,
      trim: true,
    }],
    maxStudents: {
      type: Number,
      default: 0,
    },
    maxTeachers: {
      type: Number,
      default: 0,
    },
    maxClasses: {
      type: Number,
      default: 0,
    },
    storageLimit: {
      type: Number, // in GB
      default: 0,
    },
    paymentHistory: [{
      date: { type: Date, default: Date.now },
      amount: { type: Number, required: true },
      method: { type: String },
      status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
      transactionId: { type: String },
    }],
    autoRenew: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ branchId: 1, status: 1 });
subscriptionSchema.index({ startDate: 1, endDate: 1 });

// Virtual for remaining days
subscriptionSchema.virtual('remainingDays').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for is expired
subscriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Ensure virtuals are included
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
