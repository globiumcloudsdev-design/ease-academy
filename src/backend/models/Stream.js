import mongoose from 'mongoose';

const streamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

streamSchema.index({ name: 1 });

const Stream = mongoose.models.Stream || mongoose.model('Stream', streamSchema);

export default Stream;
