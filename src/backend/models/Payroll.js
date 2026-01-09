import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    
    // Salary Breakdown
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    allowances: {
      houseRent: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    
    // Deductions
    deductions: {
      tax: { type: Number, default: 0 },
      providentFund: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    
    // Attendance-based Deductions
    attendanceDeduction: {
      totalWorkingDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      leaveDays: { type: Number, default: 0 },
      deductionType: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
        default: 'percentage' 
      },
      deductionValue: { type: Number, default: 0 }, // percentage or fixed amount
      calculatedDeduction: { type: Number, default: 0 },
    },
    
    // Final Amounts
    totalDeductions: {
      type: Number,
      required: true,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    
    // Payment Information
    paymentStatus: {
      type: String,
      enum: ['pending', 'processed', 'paid'],
      default: 'pending',
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque'],
    },
    transactionReference: {
      type: String,
    },
    
    // Additional Information
    remarks: {
      type: String,
      trim: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Email and Notification
    emailSent: {
      type: Boolean,
      default: false,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
payrollSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ branchId: 1, month: 1, year: 1 });
payrollSchema.index({ paymentStatus: 1 });
payrollSchema.index({ createdAt: -1 });

// Virtual for month name
payrollSchema.virtual('monthName').get(function() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[this.month - 1];
});

// Method to calculate net salary
payrollSchema.methods.calculateNetSalary = function() {
  // Calculate gross salary
  this.grossSalary = this.basicSalary + 
    (this.allowances.houseRent || 0) + 
    (this.allowances.medical || 0) + 
    (this.allowances.transport || 0) + 
    (this.allowances.other || 0);
  
  // Calculate total deductions
  this.totalDeductions = 
    (this.deductions.tax || 0) + 
    (this.deductions.providentFund || 0) + 
    (this.deductions.insurance || 0) + 
    (this.deductions.other || 0) + 
    (this.attendanceDeduction.calculatedDeduction || 0);
  
  // Calculate net salary
  this.netSalary = this.grossSalary - this.totalDeductions;
  
  return this.netSalary;
};

const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', payrollSchema);

export default Payroll;
