import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    baseSalary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: 0,
    },
    allowances: {
      housing: { type: Number, default: 0 },
      transportation: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    deductions: {
      tax: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      loan: { type: Number, default: 0 },
      advance: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    netSalary: {
      type: Number,
      required: true,
    },
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque'],
      default: 'bank_transfer',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    transactionId: String,
    workingDays: {
      type: Number,
      default: 0,
    },
    presentDays: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    leaveDays: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    overtimeAmount: {
      type: Number,
      default: 0,
    },
    notes: String,
    payslipUrl: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalDate: Date,
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
salarySchema.index({ employeeId: 1, month: 1, year: 1 });
salarySchema.index({ branchId: 1, month: 1, year: 1 });
salarySchema.index({ paymentStatus: 1 });

// Calculate net salary before saving
salarySchema.pre('save', function (next) {
  const totalAllowances = Object.values(this.allowances).reduce((sum, val) => sum + (val || 0), 0);
  const totalDeductions = Object.values(this.deductions).reduce((sum, val) => sum + (val || 0), 0);
  
  this.netSalary = this.baseSalary + totalAllowances + this.overtimeAmount - totalDeductions;
  
  next();
});

// Ensure unique salary record per employee per month
salarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const Salary = mongoose.models.Salary || mongoose.model('Salary', salarySchema);

export default Salary;
