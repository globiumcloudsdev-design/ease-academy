import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['assignment', 'quiz', 'announcement', 'general'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Parent or student
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // If targeted to a specific child
    },
    subject: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // For additional data like quiz duration, assignment resources
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ targetUser: 1, createdAt: -1 });
notificationSchema.index({ childId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
