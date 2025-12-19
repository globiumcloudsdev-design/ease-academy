import mongoose from 'mongoose';
import Grade from './Grade';

const syllabusSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Subject and Class References
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: false, // Optional - syllabus is grade-based, not class-specific
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: false, // Optional - syllabus is school-wide
    },
    
    // Academic Hierarchy (Level → Grade → Stream)
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level',
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
    },
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stream',
    },
    
    // Teacher
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Duration
    startDate: Date,
    endDate: Date,
    
    // Curriculum Overview
    overview: String,
    courseObjectives: [String],
    learningOutcomes: [String],
    
    // Chapters/Units
    chapters: [
      {
        chapterNumber: Number,
        chapterName: {
          type: String,
          required: true,
        },
        duration: {
          weeks: Number,
          hours: Number,
        },
        topics: [
          {
            topicName: String,
            description: String,
            learningObjectives: [String],
            resources: [String],
            assessmentMethods: [String],
          },
        ],
        assessment: {
          type: String,
          enum: ['quiz', 'assignment', 'project', 'exam', 'presentation'],
        },
        marks: Number,
      },
    ],
    
    // Learning Strategies
    teachingMethods: [
      {
        type: String,
        enum: [
          'Lecture',
          'Discussion',
          'Group Work',
          'Practical/Lab',
          'Project-Based Learning',
          'Case Study',
          'Simulation',
          'Online Learning',
          'Field Work',
          'Peer Teaching',
        ],
      },
    ],
    
    // Assessment Plan
    assessmentPlan: {
      continuousAssessment: {
        type: Number,
        min: 0,
        max: 100,
        default: 20,
      },
      midTermExam: {
        type: Number,
        min: 0,
        max: 100,
        default: 30,
      },
      finalExam: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      project: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      practical: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
    
    // Resources and Materials
    textbooks: [
      {
        title: String,
        author: String,
        isbn: String,
        chapters: [String],
      },
    ],
    referenceBooks: [String],
    onlineResources: [
      {
        title: String,
        url: String,
        type: {
          type: String,
          enum: ['video', 'article', 'course', 'simulation', 'other'],
        },
      },
    ],
    labRequirements: [String],
    equipmentNeeded: [String],
    
    // Academic Integrity
    plagiarismPolicy: String,
    academicEthics: String,
    
    // Status and Approval
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'published', 'archived'],
      default: 'draft',
    },
    approvalDate: Date,
    approvalNotes: String,
    
    // Additional Info
    remarks: String,
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    
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
syllabusSchema.index({ subjectId: 1 });
syllabusSchema.index({ classId: 1 });
syllabusSchema.index({ branchId: 1 });
syllabusSchema.index({ academicYear: 1 });
syllabusSchema.index({ status: 1 });
syllabusSchema.index({ levelId: 1 });
syllabusSchema.index({ gradeId: 1 });
syllabusSchema.index({ streamId: 1 });
syllabusSchema.index({ subjectId: 1, classId: 1, academicYear: 1 });
syllabusSchema.index({ gradeId: 1, streamId: 1, subjectId: 1 });

// Ensure virtuals are included in JSON
syllabusSchema.set('toJSON', { virtuals: true });
syllabusSchema.set('toObject', { virtuals: true });

const Syllabus = mongoose.models.Syllabus || mongoose.model('Syllabus', syllabusSchema);

export default Syllabus;
