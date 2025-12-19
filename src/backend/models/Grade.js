import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    gradeNumber: { type: Number },
    levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Level' },
    code: { type: String, trim: true },
    academicYear: { type: String },
    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

gradeSchema.index({ levelId: 1 });
gradeSchema.index({ gradeNumber: 1 });

const Grade = mongoose.models.Grade || mongoose.model('Grade', gradeSchema);

export default Grade;
