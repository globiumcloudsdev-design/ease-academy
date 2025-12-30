import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    examType: {
      type: String,
      enum: ['midterm', 'final', 'quiz', 'unit_test', 'mock', 'surprise', 'practical', 'oral'],
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    section: {
      type: String,
      trim: true,
    },
    subjects: [{
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
      },
      date: {
        type: Date,
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
      duration: {
        type: Number, // in minutes
        required: true,
      },
      totalMarks: {
        type: Number,
        required: true,
        default: 100,
      },
      passingMarks: {
        type: Number,
        required: true,
      },
      room: {
        type: String,
        trim: true,
      },
      instructions: {
        type: String,
        trim: true,
      },
      syllabus: {
        type: String,
        trim: true,
      },
    }],
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed', 'graded', 'active'],
      default: 'scheduled',
    },
    results: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User', // Changed from Student to User as students are Users
          required: true,
        },
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        marksObtained: {
          type: Number,
          min: 0,
        },
        grade: {
          type: String,
          trim: true,
        },
        remarks: {
          type: String,
          trim: true,
        },
        isAbsent: {
          type: Boolean,
          default: false,
        },
        attachments: [
          {
            name: String,
            url: String,
            publicId: String,
          },
        ],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ExamSchema.index({ branchId: 1, 'subjects.date': -1 });
ExamSchema.index({ classId: 1 });
ExamSchema.index({ status: 1 });

const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);

export default Exam;
