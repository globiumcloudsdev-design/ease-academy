import mongoose from 'mongoose';

const gssSchema = new mongoose.Schema(
  {
    gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
    streamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    isCompulsory: { type: Boolean, default: false },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

gssSchema.index({ gradeId: 1 });
gssSchema.index({ streamId: 1 });
gssSchema.index({ subjectId: 1 });

const GradeStreamSubject = mongoose.models.GradeStreamSubject || mongoose.model('GradeStreamSubject', gssSchema);

export default GradeStreamSubject;
