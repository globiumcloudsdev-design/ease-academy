import mongoose from 'mongoose';

const salaryTemplateSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      required: [true, 'Please provide template name'],
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Please provide branch'],
    },
    designation: {
      type: String,
      required: [true, 'Please provide designation'],
    },
    basicSalary: {
      type: Number,
      required: [true, 'Please provide basic salary'],
    },
    allowances: {
      houseRent: {
        type: Number,
        default: 0,
      },
      medical: {
        type: Number,
        default: 0,
      },
      transport: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },
    deductions: {
      tax: {
        type: Number,
        default: 0,
      },
      providentFund: {
        type: Number,
        default: 0,
      },
      insurance: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },
    description: {
      type: String,
      trim: true,
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
salaryTemplateSchema.index({ branchId: 1, status: 1 });
salaryTemplateSchema.index({ designation: 1 });
salaryTemplateSchema.index({ templateName: 'text' });

export default mongoose.models.SalaryTemplate ||
  mongoose.model('SalaryTemplate', salaryTemplateSchema);
