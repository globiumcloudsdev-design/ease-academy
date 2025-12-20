import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    attendanceType: {
      type: String,
      enum: ['daily', 'subject', 'event'],
      default: 'daily',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent', 'late', 'half_day', 'excused', 'leave'],
          required: true,
        },
        remarks: {
          type: String,
          trim: true,
        },
        checkInTime: {
          type: String,
        },
        // checkOutTime: {
        //   type: String,
        // },
      },
    ],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AttendanceSchema.index({ branchId: 1, date: -1 });
AttendanceSchema.index({ classId: 1, date: -1 });
// Unique per branch+class+date+attendanceType+(subjectId|eventId) to allow multiple types per day
AttendanceSchema.index({ branchId: 1, classId: 1, date: -1, attendanceType: 1, subjectId: 1, eventId: 1 }, { unique: true });

// Virtual for total students
AttendanceSchema.virtual('totalStudents').get(function () {
  return this.records.length;
});

// Virtual for present count
AttendanceSchema.virtual('presentCount').get(function () {
  return this.records.filter((r) => r.status === 'present').length;
});

// Virtual for absent count
AttendanceSchema.virtual('absentCount').get(function () {
  return this.records.filter((r) => r.status === 'absent').length;
});

// Virtual for attendance percentage
AttendanceSchema.virtual('attendancePercentage').get(function () {
  if (this.records.length === 0) return 0;
  return ((this.presentCount / this.totalStudents) * 100).toFixed(2);
});

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

export default Attendance;
