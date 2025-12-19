// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication Endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    CHANGE_PASSWORD: '/api/auth/change-password',
    ME: '/api/auth/me',
  },

  // Super Admin Endpoints
  SUPER_ADMIN: {
    DASHBOARD: '/api/super-admin/dashboard',
    DASHBOARD_STATS: '/api/super-admin/dashboard/stats',
    
    // Branch Management
    BRANCHES: {
      CREATE: '/api/super-admin/branches',
      LIST: '/api/super-admin/branches',
      GET: '/api/super-admin/branches/:id',
      UPDATE: '/api/super-admin/branches/:id',
      DELETE: '/api/super-admin/branches/:id',
      STATS: '/api/super-admin/branches/stats',
      ACTIVATE: '/api/super-admin/branches/:id/activate',
      DEACTIVATE: '/api/super-admin/branches/:id/deactivate',
    },
    
    // Branch Admin Management
    BRANCH_ADMINS: {
      CREATE: '/api/super-admin/branch-admins',
      LIST: '/api/super-admin/branch-admins',
      GET: '/api/super-admin/branch-admins/:id',
      UPDATE: '/api/super-admin/branch-admins/:id',
      DELETE: '/api/super-admin/branch-admins/:id',
      ASSIGN_BRANCH: '/api/super-admin/branch-admins/:id/assign-branch',
    },
    
    // Global Settings
    SETTINGS: {
      GET: '/api/super-admin/settings',
      UPDATE: '/api/super-admin/settings',
      RESET: '/api/super-admin/settings/reset',
    },

    // Events Management
    EVENTS: {
      CREATE: '/api/super-admin/events',
      LIST: '/api/super-admin/events',
      GET: '/api/super-admin/events/:id',
      UPDATE: '/api/super-admin/events/:id',
      DELETE: '/api/super-admin/events/:id',
    },

    // Expenses Management
    EXPENSES: {
      CREATE: '/api/super-admin/expenses',
      LIST: '/api/super-admin/expenses',
      GET: '/api/super-admin/expenses/:id',
      UPDATE: '/api/super-admin/expenses/:id',
      DELETE: '/api/super-admin/expenses/:id',
    },

    // Subscriptions Management
    SUBSCRIPTIONS: {
      CREATE: '/api/super-admin/subscriptions',
      LIST: '/api/super-admin/subscriptions',
      GET: '/api/super-admin/subscriptions/:id',
      UPDATE: '/api/super-admin/subscriptions/:id',
      DELETE: '/api/super-admin/subscriptions/:id',
    },

    // Salaries Management
    SALARIES: {
      CREATE: '/api/super-admin/salaries',
      LIST: '/api/super-admin/salaries',
      GET: '/api/super-admin/salaries/:id',
      UPDATE: '/api/super-admin/salaries/:id',
      DELETE: '/api/super-admin/salaries/:id',
      PROCESS: '/api/super-admin/salaries/:id/process',
    },

    // Teachers Management
    TEACHERS: {
      CREATE: '/api/super-admin/teachers',
      LIST: '/api/super-admin/teachers',
      GET: '/api/super-admin/teachers/:id',
      UPDATE: '/api/super-admin/teachers/:id',
      DELETE: '/api/super-admin/teachers/:id',
    },

    // Students Management
    STUDENTS: {
      CREATE: '/api/super-admin/users/students',
      LIST: '/api/super-admin/users/students',
      GET: '/api/super-admin/students/:id',
      UPDATE: '/api/super-admin/students/:id',
      DELETE: '/api/super-admin/students/:id',
    },

    // Classes Management
    CLASSES: {
      CREATE: '/api/super-admin/classes',
      LIST: '/api/super-admin/classes',
      GET: '/api/super-admin/classes/:id',
      UPDATE: '/api/super-admin/classes/:id',
      DELETE: '/api/super-admin/classes/:id',
    },

    // Fee Templates
    FEE_TEMPLATES: {
      CREATE: '/api/super-admin/fee-templates',
      LIST: '/api/super-admin/fee-templates',
      GET: '/api/super-admin/fee-templates/:id',
      UPDATE: '/api/super-admin/fee-templates/:id',
      DELETE: '/api/super-admin/fee-templates/:id',
    },

    // Fee Vouchers
    FEE_VOUCHERS: {
      CREATE: '/api/super-admin/fee-vouchers',
      LIST: '/api/super-admin/fee-vouchers',
      GET: '/api/super-admin/fee-vouchers/:id',
      UPDATE: '/api/super-admin/fee-vouchers/:id',
      DELETE: '/api/super-admin/fee-vouchers/:id',
    },

    // Subjects Management
    SUBJECTS: {
      CREATE: '/api/super-admin/subjects',
      LIST: '/api/super-admin/subjects',
      GET: '/api/super-admin/subjects/:id',
      UPDATE: '/api/super-admin/subjects/:id',
      DELETE: '/api/super-admin/subjects/:id',
    },

    // Timetables Management
    TIMETABLES: {
      CREATE: '/api/super-admin/timetables',
      LIST: '/api/super-admin/timetables',
      GET: (id) => `/api/super-admin/timetables/${id}`,
      UPDATE: (id) => `/api/super-admin/timetables/${id}`,
      DELETE: (id) => `/api/super-admin/timetables/${id}`,
      CLASS_TIMETABLE: (classId) => `/api/super-admin/timetables/class/${classId}`,
      TEACHER_TIMETABLE: (teacherId) => `/api/super-admin/timetables/teacher/${teacherId}`,
    },
    // Attendance Management
    ATTENDANCE: {
      CREATE: '/api/super-admin/attendance',
      SCAN: '/api/super-admin/attendance/scan',
      LIST: '/api/super-admin/attendance',
      GET: '/api/super-admin/attendance/:id',
      UPDATE: '/api/super-admin/attendance/:id',
      DELETE: '/api/super-admin/attendance/:id',
    },
    

    // Grades (alias to school endpoints)
    GRADES: {
      LIST: '/api/school/grades',
      CREATE: '/api/school/grades',
      GET: '/api/school/grades/:id',
      UPDATE: '/api/school/grades/:id',
      DELETE: '/api/school/grades/:id',
    },

    // Departments Management
    DEPARTMENTS: {
      CREATE: '/api/super-admin/departments',
      LIST: '/api/super-admin/departments',
      GET: '/api/super-admin/departments/:id',
      UPDATE: '/api/super-admin/departments/:id',
      DELETE: '/api/super-admin/departments/:id',
    },
    
    // Admins Management
    ADMINS: {
      CREATE: '/api/super-admin/admins',
      LIST: '/api/super-admin/admins',
      GET: '/api/super-admin/admins/:id',
      UPDATE: '/api/super-admin/admins/:id',
      DELETE: '/api/super-admin/admins/:id',
      ASSIGN_BRANCH: '/api/super-admin/admins/:id/assign-branch',
    },
    
    // Reports
    REPORTS: {
      OVERALL: '/api/super-admin/reports/overall',
      BRANCHES: '/api/super-admin/reports/branches',
      FINANCIAL: '/api/super-admin/reports/financial',
      ATTENDANCE: '/api/super-admin/reports/attendance',
      PERFORMANCE: '/api/super-admin/reports/performance',
      EXPORT: '/api/super-admin/reports/export',
    },
    
    // Users Management
    USERS: {
      LIST: '/api/super-admin/users',
      GET: '/api/super-admin/users/:id',
      CREATE: '/api/super-admin/users',
      UPDATE: '/api/super-admin/users/:id',
      DELETE: '/api/super-admin/users/:id',
      BULK_CREATE: '/api/super-admin/users/bulk',
      EXPORT: '/api/super-admin/users/export',
    },

    // Parent Approval Management
    PENDING_PARENTS: '/api/super-admin/pending-parents',
    APPROVE_PARENT: '/api/super-admin/approve-parent/:id',
    REJECT_PARENT: '/api/super-admin/reject-parent/:id',
  },

  // Branch Admin Endpoints
  BRANCH_ADMIN: {
    DASHBOARD: '/api/branch-admin/dashboard',
    // Timetables Management for branch admin (branch-limited)
    TIMETABLES: {
      CREATE: '/api/branch-admin/timetables',
      LIST: '/api/branch-admin/timetables',
      GET: (id) => `/api/branch-admin/timetables/${id}`,
      UPDATE: (id) => `/api/branch-admin/timetables/${id}`,
      DELETE: (id) => `/api/branch-admin/timetables/${id}`,
      CLASS_TIMETABLE: (classId) => `/api/branch-admin/timetables/class/${classId}`,
      TEACHER_TIMETABLE: (teacherId) => `/api/branch-admin/timetables/teacher/${teacherId}`,
    },
    
    // Teachers Management
    TEACHERS: {
      CREATE: '/api/branch-admin/teachers',
      LIST: '/api/branch-admin/teachers',
      GET: '/api/branch-admin/teachers/:id',
      UPDATE: '/api/branch-admin/teachers/:id',
      DELETE: '/api/branch-admin/teachers/:id',
      ASSIGN_SUBJECTS: '/api/branch-admin/teachers/:id/assign-subjects',
      ASSIGN_CLASSES: '/api/branch-admin/teachers/:id/assign-classes',
      SCHEDULE: '/api/branch-admin/teachers/:id/schedule',
    },
    
    // Students Management
    STUDENTS: {
      CREATE: '/api/branch-admin/students',
      LIST: '/api/branch-admin/students',
      GET: '/api/branch-admin/students/:id',
      UPDATE: '/api/branch-admin/students/:id',
      DELETE: '/api/branch-admin/students/:id',
      ENROLL: '/api/branch-admin/students/enroll',
      TRANSFER: '/api/branch-admin/students/:id/transfer',
      PROMOTE: '/api/branch-admin/students/:id/promote',
      BULK_UPLOAD: '/api/branch-admin/students/bulk-upload',
      EXPORT: '/api/branch-admin/students/export',
    },
    
    // Classes Management
    CLASSES: {
      CREATE: '/api/branch-admin/classes',
      LIST: '/api/branch-admin/classes',
      GET: '/api/branch-admin/classes/:id',
      UPDATE: '/api/branch-admin/classes/:id',
      DELETE: '/api/branch-admin/classes/:id',
      ASSIGN_TEACHER: '/api/branch-admin/classes/:id/assign-teacher',
      STUDENTS: '/api/branch-admin/classes/:id/students',
      TIMETABLE: '/api/branch-admin/classes/:id/timetable',
    },
    
    // Grades (alias to school endpoints)
    GRADES: {
      LIST: '/api/school/grades',
      CREATE: '/api/school/grades',
      GET: '/api/school/grades/:id',
      UPDATE: '/api/school/grades/:id',
      DELETE: '/api/school/grades/:id',
    },
    
    // Subjects Management
    SUBJECTS: {
      CREATE: '/api/branch-admin/subjects',
      LIST: '/api/branch-admin/subjects',
      GET: '/api/branch-admin/subjects/:id',
      UPDATE: '/api/branch-admin/subjects/:id',
      DELETE: '/api/branch-admin/subjects/:id',
    },
    
    // Events Management
    EVENTS: {
      CREATE: '/api/branch-admin/events',
      LIST: '/api/branch-admin/events',
      GET: '/api/branch-admin/events/:id',
      UPDATE: '/api/branch-admin/events/:id',
      DELETE: '/api/branch-admin/events/:id',
    },
    
    // Departments Management
    DEPARTMENTS: {
      CREATE: '/api/branch-admin/departments',
      LIST: '/api/branch-admin/departments',
      GET: '/api/branch-admin/departments/:id',
      UPDATE: '/api/branch-admin/departments/:id',
      DELETE: '/api/branch-admin/departments/:id',
    },
    
    // Syllabus Management
    SYLLABUS: {
      CREATE: '/api/branch-admin/syllabus',
      LIST: '/api/branch-admin/syllabus',
      GET: '/api/branch-admin/syllabus/:id',
      UPDATE: '/api/branch-admin/syllabus/:id',
      DELETE: '/api/branch-admin/syllabus/:id',
    },
    
    // Exams Management
    EXAMS: {
      CREATE: '/api/branch-admin/exams',
      LIST: '/api/branch-admin/exams',
      GET: '/api/branch-admin/exams/:id',
      UPDATE: '/api/branch-admin/exams/:id',
      DELETE: '/api/branch-admin/exams/:id',
    },
    
    // Attendance Management
    ATTENDANCE: {
      CREATE: '/api/branch-admin/attendance',
      SCAN: '/api/branch-admin/attendance/scan',
      LIST: '/api/branch-admin/attendance',
      GET: '/api/branch-admin/attendance/:id',
      UPDATE: '/api/branch-admin/attendance/:id',
      DELETE: '/api/branch-admin/attendance/:id',
    },
    
    // Fee Management
    FEES: {
      CREATE: '/api/branch-admin/fees',
      LIST: '/api/branch-admin/fees',
      GET: '/api/branch-admin/fees/:id',
      UPDATE: '/api/branch-admin/fees/:id',
      DELETE: '/api/branch-admin/fees/:id',
    },
    
    // Fee Templates
    FEE_TEMPLATES: {
      CREATE: '/api/branch-admin/fee-templates',
      LIST: '/api/branch-admin/fee-templates',
      GET: '/api/branch-admin/fee-templates/:id',
      UPDATE: '/api/branch-admin/fee-templates/:id',
      DELETE: '/api/branch-admin/fee-templates/:id',
    },
    
    // Fee Vouchers
    FEE_VOUCHERS: {
      CREATE: '/api/branch-admin/fee-vouchers',
      LIST: '/api/branch-admin/fee-vouchers',
      GET: '/api/branch-admin/fee-vouchers/:id',
      UPDATE: '/api/branch-admin/fee-vouchers/:id',
      DELETE: '/api/branch-admin/fee-vouchers/:id',
    },
    
    // Expenses Management
    EXPENSES: {
      CREATE: '/api/branch-admin/expenses',
      LIST: '/api/branch-admin/expenses',
      GET: '/api/branch-admin/expenses/:id',
      UPDATE: '/api/branch-admin/expenses/:id',
      DELETE: '/api/branch-admin/expenses/:id',
    },
    
    // Academic Structure (Read-only)
    LEVELS: {
      LIST: '/api/branch-admin/levels',
    },
    STREAMS: {
      LIST: '/api/branch-admin/streams',
    },
    GRADES_VIEW: {
      LIST: '/api/branch-admin/grades',
    },
    
    // Reports
    REPORTS: {
      ATTENDANCE: '/api/branch-admin/reports/attendance',
      PERFORMANCE: '/api/branch-admin/reports/performance',
      FINANCIAL: '/api/branch-admin/reports/financial',
      TEACHER_PERFORMANCE: '/api/branch-admin/reports/teacher-performance',
      EXPORT: '/api/branch-admin/reports/export',
    },
    
    // Finance
    FINANCE: {
      FEES: '/api/branch-admin/finance/fees',
      PAYMENTS: '/api/branch-admin/finance/payments',
      INVOICES: '/api/branch-admin/finance/invoices',
      EXPENSES: '/api/branch-admin/finance/expenses',
      SUMMARY: '/api/branch-admin/finance/summary',
    },

    // Parent Approval Management
    PENDING_PARENTS: '/api/branch-admin/pending-parents',
    APPROVE_PARENT: '/api/branch-admin/approve-parent/:id',
    REJECT_PARENT: '/api/branch-admin/reject-parent/:id',
  },

  // Teacher Endpoints
  TEACHER: {
    DASHBOARD: '/teacher/dashboard',
    
    // Classes
    CLASSES: {
      LIST: '/teacher/classes',
      GET: '/teacher/classes/:id',
      STUDENTS: '/teacher/classes/:id/students',
      TIMETABLE: '/teacher/classes/:id/timetable',
    },
    
    // Students
    STUDENTS: {
      LIST: '/teacher/students',
      GET: '/teacher/students/:id',
      PERFORMANCE: '/teacher/students/:id/performance',
    },
    
    // Attendance
    ATTENDANCE: {
      MARK: '/teacher/attendance/mark',
      VIEW: '/teacher/attendance/view',
      HISTORY: '/teacher/attendance/history',
      REPORT: '/teacher/attendance/report',
      BULK_MARK: '/teacher/attendance/bulk-mark',
    },
    
    // Assignments
    ASSIGNMENTS: {
      CREATE: '/teacher/assignments',
      LIST: '/teacher/assignments',
      GET: '/teacher/assignments/:id',
      UPDATE: '/teacher/assignments/:id',
      DELETE: '/teacher/assignments/:id',
      SUBMISSIONS: '/teacher/assignments/:id/submissions',
      GRADE: '/teacher/assignments/:id/grade',
    },
    
    // Exams
    EXAMS: {
      CREATE: '/teacher/exams',
      LIST: '/teacher/exams',
      GET: '/teacher/exams/:id',
      UPDATE: '/teacher/exams/:id',
      DELETE: '/teacher/exams/:id',
      SCHEDULE: '/teacher/exams/:id/schedule',
    },
    
    // Grades
    GRADES: {
      CREATE: '/teacher/grades',
      LIST: '/teacher/grades',
      UPDATE: '/teacher/grades/:id',
      BULK_UPLOAD: '/teacher/grades/bulk-upload',
      PUBLISH: '/teacher/grades/publish',
    },
    
    // Leave Management
    LEAVE: {
      APPLY: '/teacher/leave/apply',
      LIST: '/teacher/leave',
      CANCEL: '/teacher/leave/:id/cancel',
      HISTORY: '/teacher/leave/history',
    },
  },

  // Parent Endpoints
  PARENT: {
    // Profile
    PROFILE: {
      GET: '/api/parent/profile',
      UPDATE: '/api/parent/profile',
      SETTINGS: '/api/parent/profile/settings',
    },

    // Auth
    AUTH: {
      SIGNUP: '/api/parent/auth/signup',
    },

    // Announcements
    ANNOUNCEMENTS: '/api/parent/announcements',

    // Attendance
    ATTENDANCE: '/api/parent/attendance',

    // Children
    CHILDREN: {
      LIST: '/api/parent/children',
      GET: '/api/parent/children/[id]',
      ASSIGNMENTS: '/api/parent/children/assignments',
      NOTES: '/api/parent/children/notes',
      QUIZZES: '/api/parent/children/quizzes',
      ANNOUNCEMENTS: '/api/parent/children/[id]/announcements',
      ATTENDANCE: '/api/parent/children/[id]/attendance',
      MESSAGES: '/api/parent/children/[id]/messages',
    },

    // Events
    EVENTS: '/api/parent/events',

    // Messages
    MESSAGES: {
      LIST: '/api/parent/messages',
      COMPOSE: '/api/parent/messages/compose',
    },

    // Notifications
    NOTIFICATIONS: {
      LIST: '/api/parent/notifications',
      GET: '/api/parent/notifications/[id]',
    },

    // Academics
    ACADEMICS: {
      SYLLABUS: '/api/parent/academics/syllabus',
    },

    // Privacy
    PRIVACY: '/api/parent/privacy',

    // Support
    SUPPORT: '/api/parent/support',
  },

  // Student Endpoints
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    
    // Profile
    PROFILE: {
      GET: '/student/profile',
      UPDATE: '/student/profile',
      AVATAR: '/student/profile/avatar',
    },
    
    // Attendance
    ATTENDANCE: {
      VIEW: '/student/attendance',
      REPORT: '/student/attendance/report',
      SUMMARY: '/student/attendance/summary',
    },
    
    // Grades
    GRADES: {
      VIEW: '/student/grades',
      DETAILS: '/student/grades/:id',
      REPORT: '/student/grades/report',
      HISTORY: '/student/grades/history',
    },
    
    // Assignments
    ASSIGNMENTS: {
      LIST: '/student/assignments',
      GET: '/student/assignments/:id',
      SUBMIT: '/student/assignments/:id/submit',
      SUBMISSIONS: '/student/assignments/submissions',
    },
    
    // Schedule
    SCHEDULE: {
      TIMETABLE: '/student/schedule/timetable',
      EXAMS: '/student/schedule/exams',
      EVENTS: '/student/schedule/events',
    },
    
    // Fees
    FEES: {
      VIEW: '/student/fees',
      HISTORY: '/student/fees/history',
      INVOICES: '/student/fees/invoices',
    },
    
    // Library
    LIBRARY: {
      BOOKS: '/student/library/books',
      ISSUED: '/student/library/issued',
      HISTORY: '/student/library/history',
      SEARCH: '/student/library/search',
    },
  },

  // Common/Shared Endpoints
  COMMON: {
    // File Upload
    UPLOAD: '/api/upload',
    
    // Notifications
    NOTIFICATIONS: {
      LIST: '/common/notifications',
      READ: '/common/notifications/:id/read',
      READ_ALL: '/common/notifications/read-all',
      UNREAD_COUNT: '/common/notifications/unread-count',
      DELETE: '/common/notifications/:id',
    },
    
    // Search
    SEARCH: {
      GLOBAL: '/common/search',
      STUDENTS: '/common/search/students',
      TEACHERS: '/common/search/teachers',
      CLASSES: '/common/search/classes',
    },
  },

  // School endpoints (grades/levels/streams/grade-stream-subjects)
  SCHOOL: {
    GRADES: {
      LIST: '/api/school/grades',
      CREATE: '/api/school/grades',
      GET: '/api/school/grades/:id',
      UPDATE: '/api/school/grades/:id',
      DELETE: '/api/school/grades/:id',
    },
    LEVELS: {
      LIST: '/api/school/levels',
      CREATE: '/api/school/levels',
      GET: '/api/school/levels/:id',
      UPDATE: '/api/school/levels/:id',
      DELETE: '/api/school/levels/:id',
    },
    STREAMS: {
      LIST: '/api/school/streams',
      CREATE: '/api/school/streams',
      GET: '/api/school/streams/:id',
      UPDATE: '/api/school/streams/:id',
      DELETE: '/api/school/streams/:id',
    },
    GRADE_STREAM_SUBJECTS: {
      LIST: '/api/school/grade-stream-subjects',
      CREATE: '/api/school/grade-stream-subjects',
      GET: '/api/school/grade-stream-subjects/:id',
      UPDATE: '/api/school/grade-stream-subjects/:id',
      DELETE: '/api/school/grade-stream-subjects/:id',
    },
  },
};

// Helper function to build URL with parameters
export const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  
  // Replace path parameters
  Object.keys(params).forEach((key) => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// Helper function to build full API URL
export const getFullUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export default API_ENDPOINTS;
