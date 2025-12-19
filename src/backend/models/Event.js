import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['academic', 'sports', 'cultural', 'meeting', 'holiday', 'exam', 'other'],
      default: 'other',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    startTime: String,
    endTime: String,
    location: String,
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null, // null means global event for all branches
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    targetAudience: {
      type: [String],
      enum: ['students', 'teachers', 'parents', 'all'],
      default: ['all'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
    }],
    reminders: [{
      time: Date,
      sent: {
        type: Boolean,
        default: false,
      },
    }],
    color: {
      type: String,
      default: '#3B82F6', // blue
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ branchId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });

// Validate end date is after start date
eventSchema.pre('save', function (next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function (branchId = null) {
  const query = {
    startDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'ongoing'] },
  };
  
  if (branchId) {
    query.$or = [{ branchId }, { branchId: null }];
  }
  
  return this.find(query).sort({ startDate: 1 });
};

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

export default Event;
