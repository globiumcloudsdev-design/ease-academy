import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // ==================== COMMON FIELDS (ALL ROLES) ====================
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['super_admin', 'branch_admin', 'teacher', 'student', 'parent', 'staff'],
      index: true,
    },
    
    // Basic Information
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    religion: {
      type: String,
      trim: true,
    },
    nationality: {
      type: String,
      default: 'Pakistani',
      trim: true,
    },
    cnic: {
      type: String,
      trim: true,
      sparse: true,
    },
    
    // Profile Photo (Cloudinary)
    profilePhoto: {
      url: { type: String },
      publicId: { type: String },
      uploadedAt: { type: Date },
    },
    
    // Address Information
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, default: 'Pakistan', trim: true },
    },
    
    // Branch Association
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: function() {
        return this.role !== 'super_admin';
      },
    },

    // ==================== AUTHENTICATION ====================
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    loginHistory: [{
      timestamp: { type: Date, default: Date.now },
      ipAddress: String,
      userAgent: String,
      location: String,
      device: String,
    }],
    
    // ==================== STUDENT PROFILE ====================
    studentProfile: {
      registrationNumber: {
        type: String,
        uppercase: true,
        trim: true,
        sparse: true,
        unique: true,
      },
      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
      section: {
        type: String,
        trim: true,
      },
      rollNumber: {
        type: String,
        trim: true,
      },
      admissionDate: {
        type: Date,
      },
      academicYear: {
        type: String,
      },
      
      // Previous School Information
      previousSchool: {
        name: { type: String, trim: true },
        lastClass: { type: String, trim: true },
        marks: { type: Number },
        leavingDate: { type: Date },
      },
      
      // Parent/Guardian Information
      father: {
        name: { type: String, trim: true },
        occupation: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        cnic: { type: String, trim: true },
        income: { type: Number },
      },
      mother: {
        name: { type: String, trim: true },
        occupation: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        cnic: { type: String, trim: true },
      },
      guardian: {
        name: { type: String, trim: true },
        relation: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        cnic: { type: String, trim: true },
      },
      guardianType: {
        type: String,
        enum: ['parent', 'guardian'],
        default: 'parent',
      },
      
      // Fee Information
      feeDiscount: {
        type: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
        amount: { type: Number, default: 0, min: 0 },
        reason: { type: String, trim: true },
      },
      transportFee: {
        enabled: { type: Boolean, default: false },
        // routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute' },
        amount: { type: Number, default: 0 },
      },
      
      // Student Documents (Cloudinary)
      documents: [{
        type: {
          type: String,
          enum: ['b_form', 'birth_certificate', 'photo', 'previous_result', 'leaving_certificate', 'medical_certificate', 'other'],
        },
        name: { type: String, trim: true },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      }],
      // Generated QR for student (uploaded to Cloudinary)
      qr: {
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date },
      },
    },
    
    // ==================== TEACHER PROFILE ====================
    teacherProfile: {
      employeeId: {
        type: String,
        uppercase: true,
        trim: true,
        sparse: true,
        unique: true,
      },
      joiningDate: {
        type: Date,
      },
      designation: {
        type: String,
        enum: [
          'Principal',
          'Vice Principal',
          'Head Teacher',
          'Senior Teacher',
          'Teacher',
          'Junior Teacher',
          'Subject Specialist',
          'Lab Instructor',
          'Physical Instructor',
          'Art Teacher',
          'Music Teacher',
          'Other',
        ],
      },
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
      department: {
        type: String,
        enum: [
          'Science',
          'Mathematics',
          'English',
          'Urdu',
          'Islamiyat',
          'Social Studies',
          'Computer Science',
          'Physics',
          'Chemistry',
          'Biology',
          'Commerce',
          'Arts',
          'Physical Education',
          'Other',
        ],
      },
      
      // Qualifications
      qualifications: [{
        degree: { type: String },
        institution: { type: String },
        yearOfCompletion: { type: Number },
        grade: String,
        major: String,
      }],
      
      // Experience
      experience: {
        totalYears: { type: Number, default: 0 },
        previousInstitutions: [{
          institutionName: String,
          designation: String,
          fromDate: Date,
          toDate: Date,
          responsibilities: String,
        }],
      },
      
      // Subjects & Classes
      subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      }],
      classes: [{
        classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
        section: String,
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      }],
      
      // Salary Information
      salaryDetails: {
        basicSalary: { type: Number },
        allowances: {
          houseRent: { type: Number, default: 0 },
          medical: { type: Number, default: 0 },
          transport: { type: Number, default: 0 },
          other: { type: Number, default: 0 },
        },
        deductions: {
          tax: { type: Number, default: 0 },
          providentFund: { type: Number, default: 0 },
          insurance: { type: Number, default: 0 },
          other: { type: Number, default: 0 },
        },
      },
      
      // Leave Balance
      leaveBalance: {
        casual: { type: Number, default: 15 },
        sick: { type: Number, default: 10 },
        annual: { type: Number, default: 20 },
      },
      
      // Emergency Contact
      emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
        alternatePhone: String,
      },
      
      // Teacher Documents (CV, Resume, Certificates - Cloudinary)
      documents: [{
        type: {
          type: String,
          enum: ['cnic', 'cv', 'resume', 'degree', 'certificate', 'experience_letter', 'photo', 'other'],
        },
        name: { type: String, trim: true },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      }],
      
      // Generated QR for teacher (uploaded to Cloudinary)
      qr: {
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date },
      },
      
      // Bank Account Details for Payroll
      bankAccount: {
        bankName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        iban: { type: String, trim: true },
        branchCode: { type: String, trim: true },
      },
    },
    
    // ==================== STAFF PROFILE ====================
    staffProfile: {
      employeeId: {
        type: String,
        uppercase: true,
        trim: true,
        sparse: true,
        unique: true,
      },
      joiningDate: {
        type: Date,
      },
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
      role: {
        type: String,
        trim: true,
      },
      shift: {
        type: String,
        enum: ['Morning', 'Evening', 'Night', 'Rotating'],
      },
      
      // Salary Information
      salaryDetails: {
        basicSalary: { type: Number },
        allowances: {
          houseRent: { type: Number, default: 0 },
          medical: { type: Number, default: 0 },
          transport: { type: Number, default: 0 },
          other: { type: Number, default: 0 },
        },
        deductions: {
          tax: { type: Number, default: 0 },
          providentFund: { type: Number, default: 0 },
          insurance: { type: Number, default: 0 },
          other: { type: Number, default: 0 },
        },
      },
      
      // Leave Balance
      leaveBalance: {
        casual: { type: Number, default: 12 },
        sick: { type: Number, default: 10 },
        annual: { type: Number, default: 15 },
      },
      
      // Emergency Contact
      emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
        alternatePhone: String,
      },
      
      // Staff Documents (Cloudinary)
      documents: [{
        type: {
          type: String,
          enum: ['cnic', 'cv', 'resume', 'certificate', 'experience_letter', 'photo', 'other'],
        },
        name: { type: String, trim: true },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      }],
    },
    
    // ==================== ADMIN PROFILE ====================
    adminProfile: {
      permissions: [{
        type: String,
        enum: [
          'manage_users',
          'manage_branches',
          'manage_students',
          'manage_teachers',
          'manage_staff',
          'manage_fees',
          'manage_salaries',
          'manage_attendance',
          'manage_exams',
          'view_reports',
          'manage_settings',
        ],
      }],
      documents: [{
        type: { type: String, enum: ['cnic', 'id_card', 'cv', 'certificate', 'photo', 'other'] },
        name: { type: String, trim: true },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      }],
    },
    
    // ==================== PARENT PROFILE ====================
    parentProfile: {
      children: [{
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name: {
          type: String,
          trim: true,
        },
        registrationNumber: {
          type: String,
          uppercase: true,
          trim: true,
        },
        dateOfBirth: {
          type: Date,
        },
        cnic: {
          type: String,
          trim: true,
        },
        bFormNumber: {
          type: String,
          trim: true,
        },
        gender: {
          type: String,
          enum: ['male', 'female', 'other'],
        },
        classId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Class',
        },
        section: {
          type: String,
          trim: true,
        },
      }],
      occupation: String,
      income: Number,
      fullName: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      },
      cnic: {
        type: String,
        trim: true,
      },
      address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, default: 'Pakistan', trim: true },
      },
      dateOfBirth: {
        type: Date,
      },
    },
    
    // ==================== METADATA ====================
    status: {
      type: String,
      enum: ['pending', 'rejected', 'active', 'inactive', 'graduated', 'transferred', 'expelled', 'on_leave', 'terminated', 'resigned'],
      default: 'active',
    },
    remarks: {
      type: String,
      trim: true,
    },
    // Rejection fields for pending approvals
    rejectionReason: {
      type: String,
      trim: true,
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
// Note: email, studentProfile.registrationNumber, teacherProfile.employeeId, staffProfile.employeeId
// already have unique indexes defined in schema, so no need to add them again here
userSchema.index({ role: 1, branchId: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ 'studentProfile.classId': 1 });
userSchema.index({ 'teacherProfile.departmentId': 1 });
userSchema.index({ 'staffProfile.departmentId': 1 });
userSchema.index({ 'parentProfile.children.id': 1 });
userSchema.index({ isActive: 1 });


// ==================== METHODS ====================

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  if (this.role === 'branch_admin' && this.adminProfile?.permissions) {
    return this.adminProfile.permissions.includes(permission);
  }
  return false;
};

// Generate employee ID for teacher/staff
userSchema.methods.generateEmployeeId = async function(branchCode) {
  const prefix = this.role === 'teacher' ? 'T' : 'S';
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments({
    role: this.role,
    branchId: this.branchId,
  });
  
  return `${branchCode}-${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;
};

// Generate registration number for student
userSchema.methods.generateRegistrationNumber = async function(branchCode) {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await this.constructor.countDocuments({
    role: 'student',
    branchId: this.branchId,
  });
  
  return `${branchCode}-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Method to exclude sensitive fields from JSON response
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.verificationToken;
  delete obj.__v;
  return obj;
};

// ==================== STATIC METHODS ====================

// Find active users
userSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isActive: true });
};

// Find by role
userSchema.statics.findByRole = function(role, filter = {}) {
  return this.find({ ...filter, role });
};

// ==================== MIDDLEWARE ====================

// Pre-save: Auto-set fullName
userSchema.pre('save', function(next) {
  if (this.firstName && this.lastName) {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
  next();
});

// Pre-save: Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save: Generate IDs
userSchema.pre('save', async function(next) {
  try {
    // Auto-generate employee ID for teacher/staff
    if ((this.role === 'teacher' || this.role === 'staff') && this.isNew) {
      const profileKey = this.role === 'teacher' ? 'teacherProfile' : 'staffProfile';

      if (!this[profileKey]?.employeeId && this.branchId) {
        const Branch = mongoose.model('Branch');
        const branch = await Branch.findById(this.branchId);
        const branchCode = branch?.code || 'SCH';

        this[profileKey] = this[profileKey] || {};
        this[profileKey].employeeId = await this.generateEmployeeId(branchCode);
      }
    }

    // Auto-generate registration number for student
    if (this.role === 'student' && this.isNew) {
      if (!this.studentProfile?.registrationNumber && this.branchId) {
        const Branch = mongoose.model('Branch');
        const branch = await Branch.findById(this.branchId);
        const branchCode = branch?.code || 'SCH';

        this.studentProfile = this.studentProfile || {};
        this.studentProfile.registrationNumber = await this.generateRegistrationNumber(branchCode);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
