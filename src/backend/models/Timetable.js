import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Timetable name is required'],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
    },
    
    // References
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    section: {
      type: String,
      trim: true,
    },
    
    // Effective Dates
    effectiveFrom: {
      type: Date,
      required: [true, 'Effective from date is required'],
    },
    effectiveTo: {
      type: Date,
    },
    
    // Periods Configuration
    periods: [
      {
        periodNumber: {
          type: Number,
          required: true,
        },
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
        },
        teacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        periodType: {
          type: String,
          enum: ['lecture', 'lab', 'practical', 'break', 'lunch', 'assembly', 'sports', 'library'],
          default: 'lecture',
        },
        roomNumber: {
          type: String,
          trim: true,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    
    // Time Settings
    timeSettings: {
      periodDuration: {
        type: Number, // in minutes
        default: 40,
      },
      breakDuration: {
        type: Number, // in minutes
        default: 10,
      },
      lunchDuration: {
        type: Number, // in minutes
        default: 30,
      },
      schoolStartTime: {
        type: String,
        default: '08:00',
      },
      schoolEndTime: {
        type: String,
        default: '14:00',
      },
    },
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'archived'],
      default: 'draft',
    },
    
    // Notes
    description: {
      type: String,
      trim: true,
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

// Indexes
timetableSchema.index({ branchId: 1 });
timetableSchema.index({ classId: 1 });
timetableSchema.index({ academicYear: 1 });
timetableSchema.index({ status: 1 });
timetableSchema.index({ branchId: 1, classId: 1, academicYear: 1 });

// Ensure virtuals are included in JSON
timetableSchema.set('toJSON', { virtuals: true });
timetableSchema.set('toObject', { virtuals: true });

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);

export default Timetable;
