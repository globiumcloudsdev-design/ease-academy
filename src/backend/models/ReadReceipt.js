import mongoose from 'mongoose';

const ReadReceiptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    readAt: { type: Date, default: Date.now }
});

// User + Event ka combination unique hona chahiye taaki ek hi record bar bar na bane
ReadReceiptSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.models.ReadReceipt || mongoose.model('ReadReceipt', ReadReceiptSchema);