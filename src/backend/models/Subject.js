import mongoose from 'mongoose';
import Grade from './Grade';

const subjectSchema = new mongoose.Schema(
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
    
    // Class and Academic Info
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    // Grade numeric (backwards compatible) and optional reference to Grade model
    grade: {
      type: Number,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
    },
    subjectType: {
      type: String,
      enum: ['core', 'elective', 'co-curricular', 'skill-based'],
      default: 'core',
    },
    
    // Curriculum Details
    hoursPerWeek: {
      type: Number,
      default: 5,
    },
    totalHoursPerYear: {
      type: Number,
      default: 150,
    },
    creditHours: {
      type: Number,
      default: 3,
    },
    
    // Department Info
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    headTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Teachers Assigned
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    
    // Assessment Criteria
    assessmentPattern: {
      continuousAssessment: { type: Number, default: 20 }, // Percentage
      midTerm: { type: Number, default: 30 },
      finalExam: { type: Number, default: 50 },
      projects: { type: Number, default: 0 },
      practical: { type: Number, default: 0 },
    },
    
    // Learning Outcomes/Objectives
    learningOutcomes: [
      {
        outcome: String,
        description: String,
      },
    ],
    
    // Pre-requisites
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    
    // Resources
    resources: {
      textbooks: [String],
      referenceBooks: [String],
      onlineResources: [String],
      labEquipment: [String],
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    
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

// Indexes (unique: true already creates index, so only add non-unique indexes)
// subjectSchema.index({ code: 1 }); // Removed - unique: true already creates this index
subjectSchema.index({ classId: 1 });
subjectSchema.index({ grade: 1 });
subjectSchema.index({ status: 1 });

// Pre-save middleware to generate code if not provided
subjectSchema.pre('save', async function (next) {
  if (!this.code) {
    // Prefer numeric grade if available, fall back to gradeId when possible
    const gradeNumber = this.grade || undefined;
    const gradePrefix = gradeNumber ? `G${gradeNumber}` : 'G0';
    const namePrefix = (this.name || '').substring(0, 3).toUpperCase();
    const count = gradeNumber ? await this.constructor.countDocuments({ grade: gradeNumber }) : await this.constructor.countDocuments();
    this.code = `${gradePrefix}-${namePrefix}-${String(count + 1).padStart(2, '0')}`;
  }

  next();
});

// Ensure virtuals are included in JSON
subjectSchema.set('toJSON', { virtuals: true });
subjectSchema.set('toObject', { virtuals: true });

const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);

export default Subject;
