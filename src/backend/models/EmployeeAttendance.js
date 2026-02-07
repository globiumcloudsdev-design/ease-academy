 import mongoose from 'mongoose';

const EmployeeAttendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['check-in', 'check-out', 'full-day'],
      default: 'full-day',
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'leave', 'excused', 'early_checkout'],
      required: true,
      default: 'present',
    },
    checkIn: {
      time: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['on-time', 'late'],
        default: 'on-time',
      },
      location: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
        address: {
          type: String,
          trim: true,
        },
      },
      device: {
        type: String,
        trim: true,
      },
      ipAddress: {
        type: String,
        trim: true,
      },
    },
    checkOut: {
      time: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['on-time', 'early'],
        default: 'on-time',
      },
      location: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
        address: {
          type: String,
          trim: true,
        },
      },
      device: {
        type: String,
        trim: true,
      },
      ipAddress: {
        type: String,
        trim: true,
      },
    },
    workingHours: {
      type: Number, // In hours
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    lateBy: {
      type: Number, // In minutes
      default: 0,
    },
    earlyLeaveBy: {
      type: Number, // In minutes
      default: 0,
    },
    leaveType: {
      type: String,
      enum: ['sick', 'casual', 'annual', 'unpaid', 'maternity', 'paternity', 'other'],
    },
    leaveReason: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isManualEntry: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
        changes: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
EmployeeAttendanceSchema.index({ userId: 1, date: -1 });
EmployeeAttendanceSchema.index({ branchId: 1, date: -1 });
EmployeeAttendanceSchema.index({ status: 1 });
EmployeeAttendanceSchema.index({ approvalStatus: 1 });

// Pre-save middleware to calculate working hours
EmployeeAttendanceSchema.pre('save', function (next) {
  if (this.checkIn?.time && this.checkOut?.time) {
    const checkInTime = new Date(this.checkIn.time);
    const checkOutTime = new Date(this.checkOut.time);
    
    // Calculate working hours
    const diffMs = checkOutTime - checkInTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    this.workingHours = Math.max(0, diffHours);

    // Calculate overtime (more than 8 hours)
    const standardHours = 8;
    this.overtimeHours = Math.max(0, this.workingHours - standardHours);

    // Calculate late arrival (if check-in is after 9:00 AM)
    const standardCheckInTime = new Date(checkInTime);
    standardCheckInTime.setHours(9, 0, 0, 0);
    
    if (checkInTime > standardCheckInTime) {
      const lateDiffMs = checkInTime - standardCheckInTime;
      this.lateBy = Math.floor(lateDiffMs / (1000 * 60));
      
      // Mark as late if more than 15 minutes late
      if (this.lateBy > 15 && this.status === 'present') {
        this.status = 'late';
      }
    }

    // Calculate early leave (if check-out is before 5:00 PM)
    const standardCheckOutTime = new Date(checkOutTime);
    standardCheckOutTime.setHours(17, 0, 0, 0);
    
    if (checkOutTime < standardCheckOutTime && this.workingHours < 8) {
      const earlyDiffMs = standardCheckOutTime - checkOutTime;
      this.earlyLeaveBy = Math.floor(earlyDiffMs / (1000 * 60));
      
      // Mark as half-day if less than 4 hours worked
      if (this.workingHours < 4 && this.status === 'present') {
        this.status = 'half-day';
      }
    }
  }
  
  next();
});

// Virtual for formatted check-in time (12-hour format)
EmployeeAttendanceSchema.virtual('checkInFormatted').get(function () {
  if (!this.checkIn?.time) return null;
  return new Date(this.checkIn.time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
});


// Virtual for formatted check-out time (12-hour format)
EmployeeAttendanceSchema.virtual('checkOutFormatted').get(function () {
  if (!this.checkOut?.time) return null;
  return new Date(this.checkOut.time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
});

// Method to mark check-in
EmployeeAttendanceSchema.methods.markCheckIn = function (location, device, ipAddress) {
  this.checkIn = {
    time: new Date(),
    location,
    device,
    ipAddress,
  };
  this.status = 'present';
  return this.save();
};

// Method to mark check-out
EmployeeAttendanceSchema.methods.markCheckOut = function (location, device, ipAddress) {
  this.checkOut = {
    time: new Date(),
    location,
    device,
    ipAddress,
  };
  return this.save();
};

// Static method to get monthly attendance summary
EmployeeAttendanceSchema.statics.getMonthlySummary = async function (userId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const records = await this.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  });

  const summary = {
    totalDays: records.length,
    presentDays: records.filter(r => r.status === 'present').length,
    absentDays: records.filter(r => r.status === 'absent').length,
    lateDays: records.filter(r => r.status === 'late').length,
    halfDays: records.filter(r => r.status === 'half-day').length,
    leaveDays: records.filter(r => r.status === 'leave').length,
    totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
    totalOvertimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
    averageWorkingHours: 0,
  };

  if (summary.totalDays > 0) {
    summary.averageWorkingHours = (summary.totalWorkingHours / summary.totalDays).toFixed(2);
  }

  return summary;
};

// Static method to get working days count
EmployeeAttendanceSchema.statics.getWorkingDaysCount = function (month, year) {
  const date = new Date(year, month - 1, 1);
  let workingDays = 0;

  while (date.getMonth() === month - 1) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0) { // 0 = Sunday
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }

  return workingDays;
};

const EmployeeAttendance = mongoose.models.EmployeeAttendance || mongoose.model('EmployeeAttendance', EmployeeAttendanceSchema);

export default EmployeeAttendance;
