import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: String,
    
    // Department Head (reference to User)
    headTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Branch
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    
    // Staff Members (references to User)
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    
    // Subjects Managed
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    
    // Contact Information (email/phone removed - branch is primary contact)
    officeLocation: String,
    officeHours: String,
    
    // Budget Information
    budget: {
      allocatedAmount: { type: Number, default: 0 },
      spentAmount: { type: Number, default: 0 },
      year: Number,
    },
    
    // Academic Information
    academicYears: [String],
    programsOffered: [String],
    
    // Facilities
    classrooms: Number,
    labRooms: Number,
    librarySection: String,
    specialFacilities: [String],
    
    // Goals and Objectives
    departmentGoals: [String],
    achievements: [
      {
        title: String,
        date: Date,
        description: String,
      },
    ],
    
    // Contact Details (only name and office retained)
    hod: {
      name: String,
      office: String,
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    
    // Additional Info
    remarks: String,
    
    // Tracking
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
departmentSchema.index({ code: 1 });
departmentSchema.index({ branchId: 1 });
departmentSchema.index({ headTeacherId: 1 });
departmentSchema.index({ status: 1 });

// Ensure virtuals are included in JSON
departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department;
