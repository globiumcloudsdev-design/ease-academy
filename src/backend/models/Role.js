import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Role name must be at least 2 characters'],
      maxlength: [50, 'Role name cannot exceed 50 characters'],
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isSystem: {
      type: Boolean,
      default: false, // System roles cannot be deleted
    },
    permissions: {
      // User Management
      users: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      // Role Management
      roles: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      // Branch Management
      branches: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      // Student Management
      students: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        admit: { type: Boolean, default: false },
        promote: { type: Boolean, default: false },
      },
      // Teacher Management
      teachers: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        assign: { type: Boolean, default: false },
      },
      // Class Management
      classes: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      // Fee Management
      fees: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        collect: { type: Boolean, default: false },
      },
      // Salary Management
      salaries: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        process: { type: Boolean, default: false },
      },
      // Examination Management
      examinations: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        publish: { type: Boolean, default: false },
      },
      // Attendance Management
      attendance: {
        view: { type: Boolean, default: false },
        mark: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        reports: { type: Boolean, default: false },
      },
      // Timetable Management
      timetable: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      // Event Management
      events: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      // Library Management
      library: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        issue: { type: Boolean, default: false },
      },
      // Transport Management
      transport: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      // Reports & Analytics
      reports: {
        view: { type: Boolean, default: false },
        financial: { type: Boolean, default: false },
        academic: { type: Boolean, default: false },
        operational: { type: Boolean, default: false },
      },
      // System Configuration
      configuration: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
      // Audit Logs
      auditLogs: {
        view: { type: Boolean, default: false },
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
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

// Index for faster queries
roleSchema.index({ name: 1 });
roleSchema.index({ status: 1 });

const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

export default Role;
