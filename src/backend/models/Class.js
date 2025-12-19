import mongoose from 'mongoose';
import Grade from './Grade';

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Class code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: [true, 'Grade is required'],
    },
    sections: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      capacity: {
        type: Number,
        default: 40,
        min: 1,
      },
      classTeacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      roomNumber: {
        type: String,
        trim: true,
      },
    }],
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
    },
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    }],
    feeTemplates: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeTemplate',
    }],
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
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
// classSchema.index({ code: 1 }); // Removed - unique: true already creates this index
classSchema.index({ branchId: 1 });
classSchema.index({ academicYear: 1 });
classSchema.index({ grade: 1 });

const Class = mongoose.models.Class || mongoose.model('Class', classSchema);

export default Class;
