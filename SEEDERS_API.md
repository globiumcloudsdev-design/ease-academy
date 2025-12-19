# Seeders API Documentation

## Overview
This API provides endpoints to seed the database with dummy users for testing and development.

---

## Endpoints

### 1. **Create Dummy Users (POST)**
Creates 5 dummy users with different roles.

**Endpoint:**
```
POST http://localhost:3000/api/seeders/create-users
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{}
```
(Empty body is fine, just send POST request)

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Dummy users created successfully!",
  "count": 5,
  "users": [
    {
      "id": "676e6c7c7c7c7c7c7c7c7c01",
      "fullName": "Super Admin User",
      "email": "superadmin@easeacademy.com",
      "phone": "+92-300-1111111",
      "role": "super_admin",
      "password": "SuperAdmin@123"
    },
    {
      "id": "676e6c7c7c7c7c7c7c7c7c02",
      "fullName": "Branch Admin User",
      "email": "branchadmin@easeacademy.com",
      "phone": "+92-300-2222222",
      "role": "branch_admin",
      "password": "BranchAdmin@123"
    },
    {
      "id": "676e6c7c7c7c7c7c7c7c7c03",
      "fullName": "Teacher User",
      "email": "teacher@easeacademy.com",
      "phone": "+92-300-3333333",
      "role": "teacher",
      "password": "Teacher@123"
    },
    {
      "id": "676e6c7c7c7c7c7c7c7c7c04",
      "fullName": "Parent User",
      "email": "parent@easeacademy.com",
      "phone": "+92-300-4444444",
      "role": "parent",
      "password": "Parent@123"
    },
    {
      "id": "676e6c7c7c7c7c7c7c7c7c05",
      "fullName": "Student User",
      "email": "student@easeacademy.com",
      "phone": "+92-300-5555555",
      "role": "student",
      "password": "Student@123"
    }
  ]
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Users already exist in database. Clear them first if you want to recreate.",
  "count": 5
}
```

---

### 2. **Get All Users (GET)**
Fetch all users from the database.

**Endpoint:**
```
GET http://localhost:3000/api/seeders/create-users
```

**Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Users fetched successfully!",
  "count": 5,
  "users": [
    {
      "_id": "676e6c7c7c7c7c7c7c7c7c01",
      "fullName": "Super Admin User",
      "email": "superadmin@easeacademy.com",
      "role": "super_admin",
      "isActive": true
    },
    // ... more users
  ]
}
```

---

### 3. **Delete All Users (DELETE)**
⚠️ **Warning:** This will delete ALL users from the database!

**Endpoint:**
```
DELETE http://localhost:3000/api/seeders/create-users
```

**Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "All users deleted successfully!",
  "deletedCount": 5
}
```

---

## User Credentials for Testing

After creating users, you can login with these credentials:

| Role | Email | Password | Full Name |
|------|-------|----------|-----------|
| Super Admin | superadmin@easeacademy.com | SuperAdmin@123 | Super Admin User |
| Branch Admin | branchadmin@easeacademy.com | BranchAdmin@123 | Branch Admin User |
| Teacher | teacher@easeacademy.com | Teacher@123 | Teacher User |
| Parent | parent@easeacademy.com | Parent@123 | Parent User |
| Student | student@easeacademy.com | Student@123 | Student User |

---

## Steps to Use in Postman

### Step 1: Create Users
1. Open Postman
2. Click "New" → "Request"
3. Set method to **POST**
4. Enter URL: `http://localhost:3000/api/seeders/create-users`
5. Go to "Body" tab → select "raw" → select "JSON"
6. Paste empty JSON: `{}`
7. Click **Send**
8. Users will be created! Copy the passwords from response.

### Step 2: Login with Any User
1. Go to Login page: `http://localhost:3000/login`
2. Use any credential from the table above
3. Click Sign In
4. You'll be redirected to the role-specific dashboard

### Step 3: Verify Users in Database
1. Create a new GET request
2. Set method to **GET**
3. Enter URL: `http://localhost:3000/api/seeders/create-users`
4. Click **Send**
5. View all users in the response

### Step 4: Clear Users (If Needed)
1. Create a new DELETE request
2. Set method to **DELETE**
3. Enter URL: `http://localhost:3000/api/seeders/create-users`
4. Click **Send**
5. All users will be deleted

---

## Default Permissions by Role

### Super Admin
- manage_branches
- manage_admins
- manage_subscriptions
- manage_events
- manage_expenses
- manage_salaries
- view_reports
- system_settings

### Branch Admin
- manage_teachers
- manage_students
- manage_classes
- manage_attendance
- manage_exams
- manage_finance
- manage_events
- view_reports

### Teacher
- view_classes
- mark_attendance
- manage_exams
- enter_results
- view_profile

### Parent
- view_children
- view_attendance
- view_results
- view_fees
- view_profile

### Student
- view_classes
- view_attendance
- view_exams
- view_results
- view_profile

---

## Notes

- All users are created with `isActive: true` and `emailVerified: true`
- Passwords are hashed using bcryptjs before storing
- Super Admin doesn't have a branchId
- Other roles will have a default branchId (update as needed)
- If users already exist, you must DELETE them first before creating new ones
- This endpoint should be removed or protected in production!

---

## Troubleshooting

**Error: "Users already exist in database"**
- Solution: Call DELETE endpoint first to clear existing users

**Error: "MongoDB connection failed"**
- Solution: Make sure MongoDB is running and `MONGODB_URI` is correct in `.env.local`

**Error: "Failed to create dummy users"**
- Solution: Check the error message in response and MongoDB logs

