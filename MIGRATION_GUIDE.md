# Unified User Model - Migration Guide

## Overview
Successfully migrated from separate Student, Teacher, Staff models to a unified User model with role-based differentiation.

## What Changed

### 1. Database Schema
**Before:**
- Separate collections: `students`, `teachers`, `staff`
- Duplicate fields across models
- Inconsistent authentication

**After:**
- Single `users` collection
- Role field: `'student' | 'teacher' | 'staff' | 'admin' | 'parent'`
- Role-specific data in nested objects: `studentProfile`, `teacherProfile`, `staffProfile`

### 2. API Endpoints

#### Old Endpoints (Deprecated)
```
GET  /api/super-admin/students
POST /api/super-admin/students
GET  /api/super-admin/students/:id
PUT  /api/super-admin/students/:id
DELETE /api/super-admin/students/:id

GET  /api/super-admin/teachers
POST /api/super-admin/teachers
GET  /api/super-admin/teachers/:id
PUT  /api/super-admin/teachers/:id
DELETE /api/super-admin/teachers/:id
```

#### New Endpoints (Current)
```
# Generic User APIs
GET    /api/users?role=student&branchId=xxx
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id  # Soft delete

# Role-Specific Shortcuts
GET  /api/users/students
POST /api/users/students
GET  /api/users/teachers
POST /api/users/teachers
GET  /api/users/staff
POST /api/users/staff
```

### 3. Data Structure Changes

#### Student Data
**Before:**
```javascript
{
  firstName: "Ahmed",
  lastName: "Ali",
  email: "ahmed@example.com",
  classId: "...",
  father: { name: "...", phone: "..." },
  rollNumber: "001"
}
```

**After:**
```javascript
{
  role: "student",
  firstName: "Ahmed",
  lastName: "Ali",
  email: "ahmed@example.com",
  studentProfile: {
    registrationNumber: "SCH-25-0001",  // Auto-generated
    classId: "...",
    father: { name: "...", phone: "..." },
    mother: { name: "...", phone: "..." },
    rollNumber: "001",
    documents: [
      { type: "b-form", url: "...", publicId: "..." }
    ]
  }
}
```

#### Teacher Data
**Before:**
```javascript
{
  firstName: "Sara",
  lastName: "Khan",
  email: "sara@example.com",
  designation: "Senior Teacher",
  basicSalary: 50000,
  allowances: { houseRent: 10000 }
}
```

**After:**
```javascript
{
  role: "teacher",
  firstName: "Sara",
  lastName: "Khan",
  email: "sara@example.com",
  teacherProfile: {
    employeeId: "SCH-T-2025-001",  // Auto-generated
    designation: "Senior Teacher",
    departmentId: "...",
    salaryDetails: {
      basicSalary: 50000,
      allowances: { houseRent: 10000, medical: 5000 },
      deductions: { tax: 2000 }
    },
    qualifications: [...],
    experience: {...},
    documents: [
      { type: "cv", url: "...", publicId: "..." }
    ]
  }
}
```

## Updated Frontend Pages

### 1. Student Management
- ✅ `/super-admin/student-management/admissions/page.js`
  - Changed API: `/api/users?role=student`
  - Wraps data in `studentProfile` object
  - POST to `/api/users/students`
  
- ✅ `/super-admin/student-management/students/page.js`
  - Updated list API with `role=student` param
  - Updated create/edit handlers
  - Updated delete handler

### 2. Teacher Management
- ✅ `/super-admin/teacher-management/teachers/page.js`
  - Changed API: `/api/users?role=teacher`
  - Wraps data in `teacherProfile` object
  - Reads from `teacherProfile.designation`, `teacherProfile.salaryDetails`
  - POST to `/api/users/teachers`

### 3. Attendance Management
- ✅ `/super-admin/attendance-management/student/page.js`
  - Updated to `/api/users?role=student`
  
- ✅ `/super-admin/attendance-management/teacher/page.js`
  - Updated to `/api/users?role=teacher`
  
- ✅ `/super-admin/attendance/page.js`
  - Updated student fetching

### 4. Salary Management
- ✅ `/super-admin/salary-management/payroll/page.js`
  - Updated API with `role=teacher`
  - Reads from `teacherProfile.salaryDetails`
  
- ✅ `/super-admin/salary-management/reports/page.js`
  - Updated API and data access
  - Reads `teacherProfile.salaryDetails.basicSalary`

### 5. Analytics
- ✅ `/super-admin/analytics/operational/page.js`
  - Updated teacher API call
  
- ✅ `/super-admin/analytics/academic/page.js`
  - Updated student API call

## Cloudinary Integration

### Folder Structure
```
ease-academy/
  ├── profiles/{userId}/
  │   └── photo.jpg
  ├── students/{studentId}/
  │   ├── b-form/
  │   ├── medical-report/
  │   └── other/
  ├── teachers/{teacherId}/
  │   ├── cv/
  │   ├── resume/
  │   ├── degree/
  │   └── certificate/
  └── staff/{staffId}/
      ├── cv/
      ├── cnic/
      └── certificate/
```

### Upload API
```javascript
// POST /api/upload
const formData = new FormData();
formData.append('file', file);
formData.append('fileType', 'student_document');
formData.append('documentType', 'b-form');
formData.append('userId', studentId);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

### Delete API
```javascript
// DELETE /api/upload?publicId=xxx&userId=xxx&fileType=student_document&documentId=xxx
const response = await fetch('/api/upload?publicId=...', {
  method: 'DELETE'
});
```

## Auto-Generated IDs

### Registration Numbers (Students)
- Format: `SCH-25-0001`
- Pattern: `SCH-{YY}-{NNNN}`
- Auto-increments based on current year

### Employee IDs (Teachers)
- Format: `SCH-T-2025-001`
- Pattern: `SCH-T-{YYYY}-{NNN}`
- Auto-increments per year

### Employee IDs (Staff)
- Format: `SCH-S-2025-001`
- Pattern: `SCH-S-{YYYY}-{NNN}`
- Auto-increments per year

## Migration Steps (For Existing Data)

### Step 1: Backup Existing Data
```bash
cd ease-academy
mongodump --uri="your-mongodb-uri" --out=./backup
```

### Step 2: Create Migration Script
Create `scripts/migrate-to-unified-user.js`:

```javascript
const Student = require('./src/backend/models/Student.backup');
const Teacher = require('./src/backend/models/Teacher.backup');
const User = require('./src/backend/models/User');

async function migrateStudents() {
  const students = await Student.find({});
  
  for (const student of students) {
    await User.create({
      role: 'student',
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      branchId: student.branchId,
      studentProfile: {
        classId: student.classId,
        father: student.father,
        mother: student.mother,
        // ... map other fields
      }
    });
  }
}

async function migrateTeachers() {
  const teachers = await Teacher.find({});
  
  for (const teacher of teachers) {
    await User.create({
      role: 'teacher',
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      cnic: teacher.cnic,
      branchId: teacher.branchId,
      teacherProfile: {
        designation: teacher.designation,
        salaryDetails: {
          basicSalary: teacher.basicSalary,
          allowances: teacher.allowances,
          deductions: teacher.deductions
        },
        // ... map other fields
      }
    });
  }
}

// Run migrations
migrateStudents()
  .then(() => migrateTeachers())
  .then(() => console.log('Migration complete'))
  .catch(console.error);
```

### Step 3: Run Migration
```bash
node scripts/migrate-to-unified-user.js
```

## Testing Checklist

### Create Operations
- [ ] Create student with all fields
- [ ] Create teacher with salary details
- [ ] Create staff member
- [ ] Upload student B-Form document
- [ ] Upload teacher CV/Resume
- [ ] Upload profile photo

### Read Operations
- [ ] List all students with filters
- [ ] List all teachers by department
- [ ] Get single student with populated relations
- [ ] Get single teacher with salary details
- [ ] Search across all roles

### Update Operations
- [ ] Edit student guardian information
- [ ] Edit teacher qualification
- [ ] Update salary details
- [ ] Upload additional documents
- [ ] Change profile photo

### Delete Operations
- [ ] Soft delete student (status=inactive)
- [ ] Soft delete teacher
- [ ] Delete uploaded document
- [ ] Delete profile photo

### Edge Cases
- [ ] Duplicate email handling
- [ ] Duplicate CNIC (teachers)
- [ ] Invalid branch ID
- [ ] Invalid class ID
- [ ] Missing required fields
- [ ] Large file uploads (>10MB)
- [ ] Invalid file types

## Common Issues & Solutions

### Issue 1: "Cannot read property 'classId' of undefined"
**Cause:** Accessing `student.classId` instead of `student.studentProfile.classId`

**Solution:**
```javascript
// ❌ Wrong
const classId = student.classId;

// ✅ Correct
const classId = student.studentProfile?.classId;
```

### Issue 2: "Salary not displaying"
**Cause:** Accessing `teacher.basicSalary` instead of nested path

**Solution:**
```javascript
// ❌ Wrong
const salary = teacher.basicSalary;

// ✅ Correct
const salary = teacher.teacherProfile?.salaryDetails?.basicSalary || 0;
```

### Issue 3: "404 on old API endpoints"
**Cause:** Old endpoints are deprecated

**Solution:**
```javascript
// ❌ Wrong
fetch('/api/super-admin/students');

// ✅ Correct
fetch('/api/users?role=student');
```

### Issue 4: "Validation error: branchId required"
**Cause:** Not passing branchId in create request

**Solution:**
```javascript
// ✅ Always include branchId
const payload = {
  role: 'student',
  branchId: selectedBranch,
  // ... other fields
};
```

## Benefits of Unified Model

1. **Single Authentication**: One auth system for all roles
2. **Code Reuse**: Shared logic for all user types
3. **Consistent APIs**: Same patterns for all operations
4. **Easier Permissions**: Role-based access control
5. **Better Relations**: Simplified queries with single collection
6. **Document Management**: Centralized file upload system
7. **Auto-ID Generation**: Consistent ID formats across roles

## Next Steps

1. **Test File Upload**: Create UI components for document upload
2. **Create Migration Script**: Convert existing data
3. **Add Parent Role**: Implement parent profile with child relations
4. **Staff Management**: Create staff management pages
5. **Permissions**: Implement role-based permissions
6. **Audit Logs**: Track changes to user profiles
7. **Email Verification**: Add email verification flow
8. **Password Reset**: Implement password reset functionality

## Support

For questions or issues:
- Check this migration guide
- Review `/src/backend/models/User.js` for schema details
- Check `/src/lib/cloudinary.js` for file upload functions
- Test with API endpoints in Postman
- Review updated page files for examples

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: ✅ Complete
