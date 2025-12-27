import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    sectionId: {
      type: String, // Storing section name or ID if sections are sub-documents
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      min: 0,
    },
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        name: String,
        url: String,
        publicId: String,
        fileType: String, // 'image', 'pdf', 'doc', etc.
      },
    ],
    videoUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'published', 'archived', 'draft'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
export default Assignment;
