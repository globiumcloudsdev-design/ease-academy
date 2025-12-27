import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment ID is required'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    content: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        name: String,
        url: String,
        publicId: String,
      },
    ],
    marksObtained: {
      type: Number,
      min: 0,
    },
    feedback: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'graded', 'late'],
      default: 'submitted',
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    gradedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a student can only submit once per assignment
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
export default Submission;
