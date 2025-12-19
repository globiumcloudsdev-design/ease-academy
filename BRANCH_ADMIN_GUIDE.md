# Branch Admin Setup - Complete Guide

## Overview
Branch Admin functionality has been fully implemented with proper authentication, authorization, and branch-specific data access.

## Features Implemented

### 1. **Authentication & Authorization**
- Branch admin can only access their assigned branch data
- Automatic redirect to `/branch-admin` after login
- All API routes verify branch ownership before returning data

### 2. **API Routes Created**

#### Dashboard
- **GET** `/api/branch-admin/dashboard`
  - Returns statistics for branch admin's branch only
  - Includes: students, teachers, classes, subjects counts
  - Shows class distribution and upcoming events

#### Students Management
- **GET** `/api/branch-admin/students`
  - Lists students from admin's branch only
  - Supports: search, pagination, filters
  
- **POST** `/api/branch-admin/students`
  - Creates student in admin's branch
  - Auto-assigns branchId
  
- **GET** `/api/branch-admin/students/:id`
  - Gets single student (only from admin's branch)
  
- **PUT** `/api/branch-admin/students/:id`
  - Updates student (only from admin's branch)
  - Cannot change branchId
  
- **DELETE** `/api/branch-admin/students/:id`
  - Deletes student (only from admin's branch)

#### Teachers Management
- **GET** `/api/branch-admin/teachers`
  - Lists teachers from admin's branch only
  
- **POST** `/api/branch-admin/teachers`
  - Creates teacher in admin's branch
  
- **GET** `/api/branch-admin/teachers/:id`
  - Gets single teacher
  
- **PUT** `/api/branch-admin/teachers/:id`
  - Updates teacher
  
- **DELETE** `/api/branch-admin/teachers/:id`
  - Deletes teacher

#### Classes Management
- **GET** `/api/branch-admin/classes`
  - Lists classes from admin's branch only
  - Includes student count per class
  
- **POST** `/api/branch-admin/classes`
  - Creates class in admin's branch
  
- **GET** `/api/branch-admin/classes/:id`
  - Gets single class
  
- **PUT** `/api/branch-admin/classes/:id`
  - Updates class
  
- **DELETE** `/api/branch-admin/classes/:id`
  - Deletes class

### 3. **Security Features**

#### Branch Isolation
```javascript
// All queries automatically filter by branchId
const query = { branchId: user.branchId };
```

#### Authorization Checks
- Role verification: `user.role === 'branch_admin'`
- Branch assignment verification: `user.branchId` must exist
- Data ownership verification on updates/deletes

#### Token-Based Authentication
- JWT tokens include branchId
- Tokens verified on every request
- Automatic token refresh supported

### 4. **Dashboard Features**

#### Statistics Cards
- Total Students (active/inactive breakdown)
- Total Teachers (active/inactive breakdown)
- Total Classes
- Total Subjects
- Growth indicators

#### Class Distribution
- Shows all classes with student counts
- Click to navigate to class details

#### Upcoming Events
- Shows events for the next 7 days
- Includes branch-specific and global events

#### Quick Actions
- Navigate to Students, Teachers, Classes, Subjects

## Login Process

### 1. User Logs In
```javascript
// Login page: /login
const response = await apiClient.post('/api/auth/login', {
  email: 'sajoodali486@gmail.com',
  password: '123456'
});
```

### 2. Server Verifies & Returns Data
```javascript
// Returns user with branch info
{
  user: {
    _id: '...',
    email: 'sajoodali486@gmail.com',
    role: 'branch_admin',
    branchId: '...',
    branchName: 'Main Branch',
    branchCode: 'MB001'
  },
  accessToken: 'jwt-token...',
  refreshToken: 'refresh-token...'
}
```

### 3. Automatic Redirect
```javascript
// useAuth hook redirects based on role
redirectToDashboard(user.role); // -> /branch-admin
```

### 4. Dashboard Loads
```javascript
// Fetches branch-specific data
GET /api/branch-admin/dashboard
// Returns only data for user's branchId
```

## API Endpoints Constants

All endpoints are defined in:
```
src/constants/api-endpoints.js
```

Example usage:
```javascript
import { API_ENDPOINTS } from '@/constants/api-endpoints';

// Fetch dashboard
apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.DASHBOARD);

// List students
apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST);

// Create teacher
apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.CREATE, teacherData);
```

## Test Login Credentials

### Branch Admin
- **Email**: `sajoodali486@gmail.com`
- **Password**: `123456`

After login, you'll be redirected to `/branch-admin` dashboard.

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── branch-admin/
│   │       ├── dashboard/
│   │       │   └── route.js
│   │       ├── students/
│   │       │   ├── route.js
│   │       │   └── [id]/
│   │       │       └── route.js
│   │       ├── teachers/
│   │       │   ├── route.js
│   │       │   └── [id]/
│   │       │       └── route.js
│   │       └── classes/
│   │           ├── route.js
│   │           └── [id]/
│   │               └── route.js
│   └── (dashboard)/
│       └── branch-admin/
│           └── page.js
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── branchController.js
│   └── middleware/
│       └── auth.js
├── components/
│   └── Sidebar.jsx
├── constants/
│   └── api-endpoints.js
└── hooks/
    └── useAuth.js
```

## How Branch Isolation Works

### 1. Login
- User logs in with branch admin credentials
- Server fetches user and populates `branchId`
- Returns user data with branch info

### 2. Token Generation
- JWT token includes `branchId`
- Token payload:
  ```javascript
  {
    userId: '...',
    email: '...',
    role: 'branch_admin',
    branchId: '...' // Important!
  }
  ```

### 3. Request Authentication
- Every API request includes token in header
- Middleware extracts and verifies token
- Middleware returns user object with `branchId`

### 4. Data Filtering
- All database queries filter by `branchId`
- Example:
  ```javascript
  const students = await Student.find({ 
    branchId: user.branchId // Only this branch!
  });
  ```

### 5. Data Creation
- New records automatically get admin's `branchId`
- Example:
  ```javascript
  const student = new Student({
    ...studentData,
    branchId: user.branchId // Force branch
  });
  ```

### 6. Data Updates
- Verify record belongs to admin's branch
- Prevent changing `branchId`
- Example:
  ```javascript
  const student = await Student.findOne({
    _id: studentId,
    branchId: user.branchId // Ownership check
  });
  ```

## Next Steps

### Additional Features to Implement
1. **Subjects Management** - Create API routes for subjects
2. **Attendance System** - Mark and view attendance
3. **Fee Management** - Manage fees and payments
4. **Reports** - Generate various reports
5. **Events Management** - Create and manage events
6. **Notifications** - Send notifications to students/teachers

### Pages to Create
- `/branch-admin/students` - Student list page
- `/branch-admin/teachers` - Teacher list page
- `/branch-admin/classes` - Class list page
- `/branch-admin/subjects` - Subject list page
- `/branch-admin/attendance` - Attendance management
- `/branch-admin/finance` - Finance management

## Troubleshooting

### Branch Admin Can't See Data
1. Check if user has `branchId` assigned
2. Verify token includes `branchId`
3. Check database records have correct `branchId`

### Getting "No branch assigned" Error
- User's `branchId` field is null/undefined
- Need super admin to assign branch to user

### Getting "Access denied" Error
- User role is not `branch_admin`
- Check user role in database

## Security Checklist

✅ All API routes require authentication  
✅ Branch admin role verified on all routes  
✅ Branch ownership checked on all data access  
✅ BranchId cannot be changed by branch admin  
✅ Tokens include branchId  
✅ Database queries filter by branchId  
✅ New records auto-assign correct branchId  

## Summary

The branch admin system is now fully functional with:
- ✅ Proper login and redirect
- ✅ Branch-specific data isolation
- ✅ Complete CRUD operations for students, teachers, classes
- ✅ Dashboard with statistics and insights
- ✅ Secure API routes with authorization
- ✅ Updated API endpoints constants

Branch admin can now login and manage only their assigned branch data!
