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
    ME: '/api/auth/me',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },

  // Super Admin Endpoints
  SUPER_ADMIN: {
    DASHBOARD: '/api/super-admin/dashboard', // GET
    DASHBOARD_STATS: '/api/super-admin/dashboard/stats', // GET
    NOTIFICATIONS: {
      LIST: '/api/notifications', // GET
      MARK_READ: '/api/notifications', // PATCH
    },

    // Branch Management
    BRANCHES: {
      CREATE: '/api/super-admin/branches', // POST
      LIST: '/api/super-admin/branches', // GET
      GET: '/api/super-admin/branches/:id', // GET
      UPDATE: '/api/super-admin/branches/:id', // PUT
      DELETE: '/api/super-admin/branches/:id', // DELETE
      STATS: '/api/super-admin/branches/stats', // GET
      ACTIVATE: '/api/super-admin/branches/:id/activate', // PATCH
      DEACTIVATE: '/api/super-admin/branches/:id/deactivate', // PATCH
    },

    // Branch Admin Management
    BRANCH_ADMINS: {
      CREATE: '/api/super-admin/branch-admins', // POST
      LIST: '/api/super-admin/branch-admins', // GET
      GET: '/api/super-admin/branch-admins/:id', // GET
      UPDATE: '/api/super-admin/branch-admins/:id', // PUT
      DELETE: '/api/super-admin/branch-admins/:id', // DELETE
      ASSIGN_BRANCH: '/api/super-admin/branch-admins/:id/assign-branch', // POST
    },
    SELF_ATTENDANCE: {
      CHECK_IN: '/api/teacher/self-attendance/check-in', // POST
      CHECK_OUT: '/api/teacher/self-attendance/check-out', // POST
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

    // Payroll Management
    PAYROLL: {
      PROCESS: '/api/payroll/process',
      LIST: '/api/payroll/list',
      GET: (id) => `/api/payroll/${id}`,
      SLIP: (id) => `/api/payroll/slip/${id}`,
      MARK_PAID: (id) => `/api/payroll/${id}/mark-paid`,
      REPORTS: {
        SUMMARY: '/api/payroll/reports/summary',
      },
    },

    // Employee Attendance Management
    EMPLOYEE_ATTENDANCE: {
      CHECK_IN: '/api/employee-attendance/check-in',
      CHECK_OUT: '/api/employee-attendance/check-out',
      MARK: '/api/employee-attendance/mark',
      LIST: '/api/employee-attendance/list',
      SUMMARY: '/api/employee-attendance/summary',
      TODAY: '/api/employee-attendance/today',
      REPORTS: '/api/employee-attendance/reports',
      UPDATE: '/api/employee-attendance', // PUT for [id]
    },

    // Users Management (Super Admin)
    USERS: {
      LIST: '/api/super-admin/users',
      GET: '/api/super-admin/users/:id',
      CREATE: '/api/super-admin/users',
      UPDATE: '/api/super-admin/users/:id',
      DELETE: '/api/super-admin/users/:id',
    },

    // Employees Management (Teachers & Staff only)
    EMPLOYEES: {
      LIST: '/api/super-admin/employees',
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
      SEARCH: '/api/super-admin/students/search',
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

    // Fee Categories
    FEE_CATEGORIES: {
      CREATE: '/api/super-admin/fee-categories',
      LIST: '/api/super-admin/fee-categories',
      GET: '/api/super-admin/fee-categories/:id',
      UPDATE: '/api/super-admin/fee-categories/:id',
      DELETE: '/api/super-admin/fee-categories/:id',
    },

    // Fee Vouchers
    FEE_VOUCHERS: {
      CREATE: '/api/super-admin/fee-vouchers',
      LIST: '/api/super-admin/fee-vouchers',
      GET: '/api/super-admin/fee-vouchers/:id',
      UPDATE: '/api/super-admin/fee-vouchers/:id',
      DELETE: '/api/super-admin/fee-vouchers/:id',
      APPROVE_PAYMENT: '/api/super-admin/fee-vouchers/:voucherId/approve-payment',
      // REJECT_PAYMENT: '/api/super-admin/fee-vouchers/:voucherId/reject-payment',
    },

    // Pending Fees Management
    PENDING_FEES: {
      LIST: '/api/super-admin/pending-fees',
      APPROVE: '/api/super-admin/pending-fees/approve',
      REJECT: '/api/super-admin/pending-fees/reject',
    },

    // Subjects Management
    SUBJECTS: {
      CREATE: '/api/super-admin/subjects',
      LIST: '/api/super-admin/subjects',
      GET: '/api/super-admin/subjects/:id',
      UPDATE: '/api/super-admin/subjects/:id',
      DELETE: '/api/super-admin/subjects/:id',
    },

    STAFF: {
      CREATE: '/api/super-admin/staff',
      LIST: '/api/super-admin/staff',
      GET: '/api/super-admin/staff/:id',
      UPDATE: '/api/super-admin/staff/:id',
      DELETE: '/api/super-admin/staff/:id',
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

    // Levels (alias to school endpoints)
    LEVELS: {
      LIST: '/api/school/levels',
      CREATE: '/api/school/levels',
      GET: '/api/school/levels/:id',
      UPDATE: '/api/school/levels/:id',
      DELETE: '/api/school/levels/:id',
    },

    // Streams (alias to school endpoints)
    STREAMS: {
      LIST: '/api/school/streams',
      CREATE: '/api/school/streams',
      GET: '/api/school/streams/:id',
      UPDATE: '/api/school/streams/:id',
      DELETE: '/api/school/streams/:id',
    },

    // Library Management
    LIBRARY: {
      BOOKS: '/api/super-admin/library/books', // GET, POST
      GET: '/api/super-admin/library/books/:id', // GET
      UPDATE: '/api/super-admin/library/books/:id', // PUT
      DELETE: '/api/super-admin/library/books/:id', // DELETE
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

    // Library Management
    LIBRARY: {
      BOOKS: '/api/super-admin/library/books', // GET, POST
      BOOK: (id) => `/api/super-admin/library/books/${id}`, // GET, PUT, DELETE
    },

    // Employees Management
    EMPLOYEES: {
      LIST: '/api/super-admin/employees',
      GET: '/api/super-admin/employees/:id',
    },

    // Parent Approval Management
    PENDING_PARENTS: '/api/super-admin/pending-parents',
    PARENTS: '/api/super-admin/parents',
    CHECK_CHILDREN_MATCHES: '/api/super-admin/check-children-matches',
    APPROVE_PARENT: '/api/super-admin/approve-parent/:id',
    REJECT_PARENT: '/api/super-admin/reject-parent/:id',

    // Charts and Analytics
    CHARTS: {
      STUDENT_TRENDS: '/api/super-admin/charts/student-trends', // GET
      CLASS_WISE_STUDENTS: '/api/super-admin/charts/class-wise-students', // GET
      BRANCH_WISE_STUDENTS: '/api/super-admin/charts/branch-wise-students', // GET
      STUDENT_ATTENDANCE: '/api/super-admin/charts/student-attendance', // GET
      REVENUE_EXPENSE: '/api/super-admin/charts/revenue-expense', // GET
      MONTHLY_FEE_COLLECTION: '/api/super-admin/charts/monthly-fee-collection', // GET
      PASS_FAIL_RATIO: '/api/super-admin/charts/pass-fail-ratio', // GET
      BRANCH_PERFORMANCE: '/api/super-admin/charts/branch-performance', // GET
      USER_DISTRIBUTION: '/api/super-admin/charts/user-distribution', // GET
      FINANCIAL_OVERVIEW: '/api/super-admin/charts/financial-overview', // GET
    },
  },

  // Branch Admin Endpoints
  BRANCH_ADMIN: {
    DASHBOARD: '/api/branch-admin/dashboard', // GET
    NOTIFICATIONS: {
      LIST: '/api/notifications', // GET
      MARK_READ: '/api/notifications', // PATCH
    },

    // Users Management (Branch Admin - restricted to their branch)
    USERS: {
      LIST: '/api/branch-admin/users', // GET
      GET: '/api/branch-admin/users/:id', // GET
      CREATE: '/api/branch-admin/users', // POST
      UPDATE: '/api/branch-admin/users/:id', // PUT
      DELETE: '/api/branch-admin/users/:id', // DELETE
    },

    // Employees Management (Teachers & Staff only from their branch)
    EMPLOYEES: {
      LIST: '/api/branch-admin/employees', // GET
    },

    // Timetables Management for branch admin (branch-limited)
    TIMETABLES: {
      CREATE: '/api/branch-admin/timetables', // POST
      LIST: '/api/branch-admin/timetables', // GET
      GET: (id) => `/api/branch-admin/timetables/${id}`, // GET
      UPDATE: (id) => `/api/branch-admin/timetables/${id}`, // PUT
      DELETE: (id) => `/api/branch-admin/timetables/${id}`, // DELETE
      CLASS_TIMETABLE: (classId) => `/api/branch-admin/timetables/class/${classId}`, // GET
      TEACHER_TIMETABLE: (teacherId) => `/api/branch-admin/timetables/teacher/${teacherId}`, // GET
    },

    // Teachers Management
    TEACHERS: {
      CREATE: '/api/branch-admin/teachers', // POST
      LIST: '/api/branch-admin/teachers', // GET
      GET: '/api/branch-admin/teachers/:id', // GET
      UPDATE: '/api/branch-admin/teachers/:id', // PUT
      DELETE: '/api/branch-admin/teachers/:id', // DELETE
      ASSIGN_SUBJECTS: '/api/branch-admin/teachers/:id/assign-subjects', // POST
      ASSIGN_CLASSES: '/api/branch-admin/teachers/:id/assign-classes', // POST
      SCHEDULE: '/api/branch-admin/teachers/:id/schedule', // GET
    },

    // Students Management
    STUDENTS: {
      CREATE: '/api/branch-admin/students', // POST
      LIST: '/api/branch-admin/students', // GET
      GET: '/api/branch-admin/students/:id', // GET
      UPDATE: '/api/branch-admin/students/:id', // PUT
      DELETE: '/api/branch-admin/students/:id', // DELETE
      ENROLL: '/api/branch-admin/students/enroll', // POST
      TRANSFER: '/api/branch-admin/students/:id/transfer', // POST
      PROMOTE: '/api/branch-admin/students/:id/promote', // POST
      BULK_UPLOAD: '/api/branch-admin/students/bulk-upload', // POST
      EXPORT: '/api/branch-admin/students/export', // GET
      SEARCH: '/api/branch-admin/students/search', // GET
    },

    // Classes Management
    CLASSES: {
      CREATE: '/api/branch-admin/classes', // POST
      LIST: '/api/branch-admin/classes', // GET
      GET: '/api/branch-admin/classes/:id', // GET
      UPDATE: '/api/branch-admin/classes/:id', // PUT
      DELETE: '/api/branch-admin/classes/:id', // DELETE
      ASSIGN_TEACHER: '/api/branch-admin/classes/:id/assign-teacher', // POST
      STUDENTS: '/api/branch-admin/classes/:id/students', // GET
      TIMETABLE: '/api/branch-admin/classes/:id/timetable', // GET
    },

    // Grades (alias to school endpoints)
    GRADES: {
      LIST: '/api/school/grades', // GET
      CREATE: '/api/school/grades', // POST
      GET: '/api/school/grades/:id', // GET
      UPDATE: '/api/school/grades/:id', // PUT
      DELETE: '/api/school/grades/:id', // DELETE
    },

    // Staff Management
    STAFF: {
      CREATE: '/api/branch-admin/staff', // POST
      LIST: '/api/branch-admin/staff', // GET
      GET: '/api/branch-admin/staff/:id', // GET
      UPDATE: '/api/branch-admin/staff/:id', // PUT
      DELETE: '/api/branch-admin/staff/:id', // DELETE
    },

    // Subjects Management
    SUBJECTS: {
      CREATE: '/api/branch-admin/subjects', // POST
      LIST: '/api/branch-admin/subjects', // GET
      GET: '/api/branch-admin/subjects/:id', // GET
      UPDATE: '/api/branch-admin/subjects/:id', // PUT
      DELETE: '/api/branch-admin/subjects/:id', // DELETE
    },

    // Events Management
    EVENTS: {
      CREATE: '/api/branch-admin/events', // POST
      LIST: '/api/branch-admin/events', // GET
      GET: '/api/branch-admin/events/:id', // GET
      UPDATE: '/api/branch-admin/events/:id', // PUT
      DELETE: '/api/branch-admin/events/:id', // DELETE
    },

    // Departments Management
    DEPARTMENTS: {
      CREATE: '/api/branch-admin/departments', // POST
      LIST: '/api/branch-admin/departments', // GET
      GET: '/api/branch-admin/departments/:id', // GET
      UPDATE: '/api/branch-admin/departments/:id', // PUT
      DELETE: '/api/branch-admin/departments/:id', // DELETE
    },

    // Syllabus Management
    SYLLABUS: {
      CREATE: '/api/branch-admin/syllabus', // POST
      LIST: '/api/branch-admin/syllabus', // GET
      GET: '/api/branch-admin/syllabus/:id', // GET
      UPDATE: '/api/branch-admin/syllabus/:id', // PUT
      DELETE: '/api/branch-admin/syllabus/:id', // DELETE
    },

    // Exams Management
    EXAMS: {
      CREATE: '/api/branch-admin/exams', // POST
      LIST: '/api/branch-admin/exams', // GET
      GET: '/api/branch-admin/exams/:id', // GET
      UPDATE: '/api/branch-admin/exams/:id', // PUT
      DELETE: '/api/branch-admin/exams/:id', // DELETE
    },

    // Attendance Management
    ATTENDANCE: {
      CREATE: '/api/branch-admin/attendance', // POST
      SCAN: '/api/branch-admin/attendance/scan', // POST
      LIST: '/api/branch-admin/attendance', // GET
      GET: '/api/branch-admin/attendance/:id', // GET
      UPDATE: '/api/branch-admin/attendance/:id', // PUT
      DELETE: '/api/branch-admin/attendance/:id', // DELETE
    },

    // Fee Management
    FEES: {
      CREATE: '/api/branch-admin/fees', // POST
      LIST: '/api/branch-admin/fees', // GET
      GET: '/api/branch-admin/fees/:id', // GET
      UPDATE: '/api/branch-admin/fees/:id', // PUT
      DELETE: '/api/branch-admin/fees/:id', // DELETE
    },

    // Fee Templates
    FEE_TEMPLATES: {
      CREATE: '/api/branch-admin/fee-templates', // POST
      LIST: '/api/branch-admin/fee-templates', // GET
      GET: '/api/branch-admin/fee-templates/:id', // GET
      UPDATE: '/api/branch-admin/fee-templates/:id', // PUT
      DELETE: '/api/branch-admin/fee-templates/:id', // DELETE
    },

    // Fee Categories
    FEE_CATEGORIES: {
      CREATE: '/api/branch-admin/fee-categories', // POST
      LIST: '/api/branch-admin/fee-categories', // GET
      GET: '/api/branch-admin/fee-categories/:id', // GET
      UPDATE: '/api/branch-admin/fee-categories/:id', // PUT
      DELETE: '/api/branch-admin/fee-categories/:id', // DELETE
    },

    // Fee Vouchers
    FEE_VOUCHERS: {
      CREATE: '/api/branch-admin/fee-vouchers', // POST
      LIST: '/api/branch-admin/fee-vouchers', // GET
      GET: '/api/branch-admin/fee-vouchers/:id', // GET
      UPDATE: '/api/branch-admin/fee-vouchers/:id', // PUT
      DELETE: '/api/branch-admin/fee-vouchers/:id', // DELETE
      APPROVE_PAYMENT: '/api/branch-admin/fee-vouchers/:voucherId/approve-payment', // POST
      // REJECT_PAYMENT: '/api/branch-admin/fee-vouchers/:voucherId/reject-payment', // POST
    },

    // Expenses Management
    EXPENSES: {
      CREATE: '/api/branch-admin/expenses', // POST
      LIST: '/api/branch-admin/expenses', // GET
      GET: '/api/branch-admin/expenses/:id', // GET
      UPDATE: '/api/branch-admin/expenses/:id', // PUT
      DELETE: '/api/branch-admin/expenses/:id', // DELETE
    },

    // Academic Structure (Read-only)
    LEVELS: {
      LIST: '/api/branch-admin/levels', // GET
    },
    STREAMS: {
      LIST: '/api/branch-admin/streams', // GET
    },
    GRADES_VIEW: {
      LIST: '/api/branch-admin/grades', // GET
    },

    // Reports
    REPORTS: {
      ATTENDANCE: '/api/branch-admin/reports/attendance', // GET
      PERFORMANCE: '/api/branch-admin/reports/performance', // GET
      FINANCIAL: '/api/branch-admin/reports/financial', // GET
      TEACHER_PERFORMANCE: '/api/branch-admin/reports/teacher-performance', // GET
      EXPORT: '/api/branch-admin/reports/export', // GET
    },

    // Finance
    FINANCE: {
      FEES: '/api/branch-admin/finance/fees', // GET
      PAYMENTS: '/api/branch-admin/finance/payments', // GET
      INVOICES: '/api/branch-admin/finance/invoices', // GET
      EXPENSES: '/api/branch-admin/finance/expenses', // GET
      SUMMARY: '/api/branch-admin/finance/summary', // GET
    },

    // Employees Management
    EMPLOYEES: {
      LIST: '/api/branch-admin/employees',
      GET: '/api/branch-admin/employees/:id',
    },

    // Payroll Management
    PAYROLL: {
      PROCESS: '/api/payroll/process', // POST
      LIST: '/api/payroll/list', // GET
      GET: (id) => `/api/payroll/${id}`, // GET
      SLIP: (id) => `/api/payroll/slip/${id}`, // GET
      MARK_PAID: (id) => `/api/payroll/${id}/mark-paid`, // PATCH
      REPORTS: {
        SUMMARY: '/api/payroll/reports/summary', // GET
      },
    },

    // Employee Attendance Management
    EMPLOYEE_ATTENDANCE: {
      CHECK_IN: '/api/employee-attendance/check-in', // POST
      CHECK_OUT: '/api/employee-attendance/check-out', // POST
      MARK: '/api/employee-attendance/mark', // POST
      LIST: '/api/employee-attendance/list', // GET
      SUMMARY: '/api/employee-attendance/summary', // GET
      TODAY: '/api/employee-attendance/today', // GET
      REPORTS: '/api/employee-attendance/reports', // GET
      UPDATE: '/api/employee-attendance', // PUT
    },

    // Teacher Attendance Management
    TEACHER_ATTENDANCE: {
      LIST: '/api/branch-admin/teacher-attendance', // GET
    },

    // Pending Fees Management
    PENDING_FEES: {
      LIST: '/api/branch-admin/pending-fees',
      APPROVE: '/api/branch-admin/pending-fees/approve',
      REJECT: '/api/branch-admin/pending-fees/reject',
    },

    // Library Management
    LIBRARY_MANAGEMENT: {
      BOOKS: '/api/branch-admin/library/books', // GET, POST, PUT, DELETE
    },

    // Parent Approval Management
    PENDING_PARENTS: '/api/branch-admin/pending-parents', // GET
    PARENTS: '/api/branch-admin/parents', // GET
    CHECK_CHILDREN_MATCHES: '/api/branch-admin/check-children-matches', // POST
    APPROVE_PARENT: '/api/branch-admin/approve-parent/:id', // POST
    REJECT_PARENT: '/api/branch-admin/reject-parent/:id', // POST

    // Library Management
    LIBRARY_MANAGEMENT: {
      BOOKS: '/api/branch-admin/library/books', // GET, POST
      GET: '/api/branch-admin/library/books/:id', // GET
      UPDATE: '/api/branch-admin/library/books/:id', // PUT
      DELETE: '/api/branch-admin/library/books/:id', // DELETE
    },

    // User Management for Dropdowns
    USERS: {
      LIST: '/api/branch-admin/users', // GET (search/filter by role)
    },

    // Notifications Management
    NOTIFICATIONS: {
      HISTORY: '/api/branch-admin/notifications/history', // GET
    },

    // Charts and Analytics
    CHARTS: {
      STUDENT_TRENDS: '/api/branch-admin/charts/student-trends', // GET
      CLASS_WISE_STUDENTS: '/api/branch-admin/charts/class-wise-students', // GET
      STUDENT_ATTENDANCE: '/api/branch-admin/charts/student-attendance', // GET
      FEES_COLLECTED_PENDING: '/api/branch-admin/charts/fees-collected-pending', // GET
      MONTHLY_FEE_COLLECTION: '/api/branch-admin/charts/monthly-fee-collection', // GET
      PASS_FAIL_RATIO: '/api/branch-admin/charts/pass-fail-ratio', // GET
    },
  },

  // Teacher Endpoints
  TEACHER: {
    DASHBOARD: '/api/teacher/dashboard', // GET
    NOTIFICATIONS: {
      LIST: '/api/notifications', // GET
      MARK_READ: '/api/notifications', // PATCH
    },

    // My Classes (app route: src/app/api/teacher/my-classes)
    MY_CLASSES: {
      LIST: '/api/teacher/my-classes', // GET
      GET: '/api/teacher/my-classes/:id', // GET
    },

    // Classes
    CLASSES: {
      LIST: '/api/teacher/classes', // GET
      GET: '/api/teacher/classes/:id', // GET
      STUDENTS: '/api/teacher/classes/:id/students', // GET
      SUBJECTS: '/api/teacher/classes/:id/subjects', // GET
      TIMETABLE: '/api/teacher/classes/:id/timetable', // GET
    },

    // Students
    STUDENTS: {
      LIST: '/api/teacher/students', // GET
      GET: '/api/teacher/students/:id', // GET
      DETAILS: '/api/teacher/student/details', // GET
      PERFORMANCE: '/api/student/details/:id/performance', // GET
    },

    // Attendance
    ATTENDANCE: {
      MARK: '/api/teacher/attendance/mark', // POST
      VIEW: '/api/teacher/attendance/view', // GET
      HISTORY: '/api/teacher/attendance/history', // GET
      REPORT: '/api/teacher/attendance/report', // GET
      BULK_MARK: '/api/teacher/attendance/bulk-mark', // POST
      SCAN: '/api/teacher/attendance/scan', // POST

    },
    //self-attendece
    SELF_ATTENDANCE: {
      STATUS: '/api/teacher/self-attendance/status', // GET
      CHECK_IN: '/api/teacher/self-attendance/check-in', // POST
      CHECK_OUT: '/api/teacher/self-attendance/check-out', // POST
      HISTORY: '/api/teacher/self-attendance/history', // GET
    },

    // Assignments
    ASSIGNMENTS: {
      CREATE: '/api/teacher/assignments', // POST
      LIST: '/api/teacher/assignments', // GET
      GET: '/api/teacher/assignments/:id', // GET
      UPDATE: '/api/teacher/assignments/:id', // PUT
      DELETE: '/api/teacher/assignments/:id', // DELETE
      SUBMISSIONS: '/api/teacher/assignments/:id/submissions', // GET
      GRADE: '/api/teacher/assignments/:id/grade', // POST
    },

    // Exams
    EXAMS: {
      CREATE: '/api/teacher/exams', // POST
      LIST: '/api/teacher/exams', // GET
      GET: '/api/teacher/exams/:id', // GET
      UPDATE: '/api/teacher/exams/:id', // PUT
      UPDATE_STATUS: '/api/teacher/exams/:id', // PATCH
      DELETE: '/api/teacher/exams/:id', // DELETE
      SCHEDULE: '/api/teacher/exams/:id/schedule', // GET
      RESULTS: '/api/teacher/exams/:id/results', // GET
    },

    // Grades
    GRADES: {
      CREATE: '/api/teacher/grades', // POST
      LIST: '/api/teacher/grades', // GET
      UPDATE: '/api/teacher/grades/:id', // PUT
      BULK_UPLOAD: '/api/teacher/grades/bulk-upload', // POST
      PUBLISH: '/api/teacher/grades/publish', // POST
    },

    // Leave Management
    LEAVE: {
      APPLY: '/api/teacher/leave/apply', // POST
      LIST: '/api/teacher/leave', // GET
      CANCEL: '/api/teacher/leave/:id/cancel', // POST
      HISTORY: '/api/teacher/leave/history', // GET
    },
  },


  // Student Endpoints
  STUDENT: {
    DASHBOARD: '/student/dashboard', // GET
    NOTIFICATIONS: {
      LIST: '/api/notifications', // GET
      MARK_READ: '/api/notifications', // PATCH
    },

    // Profile
    PROFILE: {
      GET: '/student/profile', // GET
      UPDATE: '/student/profile', // PUT
      AVATAR: '/student/profile/avatar', // POST
    },

    // Attendance
    ATTENDANCE: {
      VIEW: '/student/attendance', // GET
      REPORT: '/student/attendance/report', // GET
      SUMMARY: '/student/attendance/summary', // GET
    },

    // Grades
    GRADES: {
      VIEW: '/student/grades', // GET
      DETAILS: '/student/grades/:id', // GET
      REPORT: '/student/grades/report', // GET
      HISTORY: '/student/grades/history', // GET
    },

    // Assignments
    ASSIGNMENTS: {
      LIST: '/student/assignments', // GET
      GET: '/student/assignments/:id', // GET
      SUBMIT: '/student/assignments/:id/submit', // POST
      SUBMISSIONS: '/student/assignments/submissions', // GET
    },

    // Schedule
    SCHEDULE: {
      TIMETABLE: '/student/schedule/timetable', // GET
      EXAMS: '/student/schedule/exams', // GET
      EVENTS: '/student/schedule/events', // GET
    },

    // Fees
    FEES: {
      VIEW: '/student/fees', // GET
      HISTORY: '/student/fees/history', // GET
      INVOICES: '/student/fees/invoices', // GET
    },

    // Library
    LIBRARY: {
      BOOKS: '/student/library/books', // GET
      ISSUED: '/student/library/issued', // GET
      HISTORY: '/student/library/history', // GET
      SEARCH: '/student/library/search', // GET
    },
    // Branch Admin Library Management
    LIBRARY_MANAGEMENT: {
      BOOKS: '/branch-admin/library/books', // GET, POST, PUT, DELETE
    },
  },

  // Common/Shared Endpoints
  COMMON: {
    // File Upload
    UPLOAD: '/api/upload', // POST
    UPLOADS: {
      SINGLE: '/api/upload', // POST
      MULTIPLE: '/api/upload/multiple', // POST
    },

    // Notifications
    NOTIFICATIONS: {
      LIST: '/api/notifications', // GET
      MARK_READ: '/api/notifications', // PATCH
    },

    // Search
    SEARCH: {
      GLOBAL: '/common/search', // GET
      STUDENTS: '/common/search/students', // GET
      TEACHERS: '/common/search/teachers', // GET
      CLASSES: '/common/search/classes', // GET
    },
  },

  // School endpoints (grades/levels/streams/grade-stream-subjects)
  SCHOOL: {
    GRADES: {
      LIST: '/api/school/grades', // GET
      CREATE: '/api/school/grades', // POST
      GET: '/api/school/grades/:id', // GET
      UPDATE: '/api/school/grades/:id', // PUT
      DELETE: '/api/school/grades/:id', // DELETE
    },
    LEVELS: {
      LIST: '/api/school/levels', // GET
      CREATE: '/api/school/levels', // POST
      GET: '/api/school/levels/:id', // GET
      UPDATE: '/api/school/levels/:id', // PUT
      DELETE: '/api/school/levels/:id', // DELETE
    },
    STREAMS: {
      LIST: '/api/school/streams', // GET
      CREATE: '/api/school/streams', // POST
      GET: '/api/school/streams/:id', // GET
      UPDATE: '/api/school/streams/:id', // PUT
      DELETE: '/api/school/streams/:id', // DELETE
    },
    GRADE_STREAM_SUBJECTS: {
      LIST: '/api/school/grade-stream-subjects', // GET
      CREATE: '/api/school/grade-stream-subjects', // POST
      GET: '/api/school/grade-stream-subjects/:id', // GET
      UPDATE: '/api/school/grade-stream-subjects/:id', // PUT
      DELETE: '/api/school/grade-stream-subjects/:id', // DELETE
    },
  },

  // Shared Endpoints (Used by multiple roles)
  USERS: '/api/branch-admin/users', // GET
  NOTIFICATIONS: {
    SEND: '/api/notifications/send', // POST
    HISTORY: '/api/branch-admin/notifications/history', // GET
  },

  // Parent Portal Endpoints
  PARENT: {
    SIGNUP: '/api/parent/auth/signup', // POST

    // General Parent Notifications
    NOTIFICATIONS: {
      LIST: '/api/parent/notifications', // GET
      MARK_READ: '/api/parent/notifications', // PATCH
    },

    // Get all children of authenticated parent
    CHILDREN: '/api/parent', // GET

    // Child specific endpoints
    CHILD: {
      // Child details
      DETAILS: '/api/parent/:childId', // GET

      // Academic information
      ASSIGNMENTS: '/api/parent/:childId/assignments', // GET
      QUIZZES: '/api/parent/:childId/quizzes', // GET
      EXAMS: '/api/parent/:childId/exams', // GET
      SYLLABUS: '/api/parent/:childId/syllabus', // GET
      NOTES: '/api/parent/:childId/notes', // GET
      TIMETABLE: '/api/parent/:childId/timetable', // GET

      // School activities
      EVENTS: '/api/parent/:childId/events', // GET
      ANNOUNCEMENTS: '/api/parent/:childId/announcements', // GET

      // Communication
      MESSAGES: '/api/parent/:childId/messages', // GET
      NOTIFICATIONS: {
        LIST: '/api/parent/:childId/notifications', // GET
        MARK_READ: '/api/parent/:childId/notifications', // PATCH
      },

      // Progress tracking
      ATTENDANCE: '/api/parent/:childId/attendance', // GET

      // Resources
      LIBRARY: '/api/parent/:childId/library', // GET

      // Fee vouchers
      FEE_VOUCHERS: '/api/parent/:childId/fee-vouchers', // GET
      PAY_FEE_VOUCHER: '/api/parent/:childId/fee-vouchers/:id/pay', // POST

      // Assignment submission
      SUBMIT_ASSIGNMENT: '/api/parent/:childId/assignments/submit', // POST
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
