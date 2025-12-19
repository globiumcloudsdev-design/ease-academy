# 🎯 Seeders Complete Setup Guide

## 📍 Overview
This guide will help you create dummy users and branches in your database using Postman.

---

## ⚡ Quick Steps (2 Minutes)

### Step 1: Create Branches First
```
POST http://localhost:3000/api/seeders/create-branches
Body: {}
```

### Step 2: Create Users
```
POST http://localhost:3000/api/seeders/create-users
Body: {}
```

### Step 3: Login with Any User
Go to `http://localhost:3000/login` and use credentials below

---

## 👥 User Credentials

### Super Admin (👑 Full Access)
```
Email: superadmin@easeacademy.com
Password: SuperAdmin@123
```

### Branch Admin (👔 Branch Management)
```
Email: branchadmin@easeacademy.com
Password: BranchAdmin@123
```

### Teacher (👨‍🏫 Class Management)
```
Email: teacher@easeacademy.com
Password: Teacher@123
```

### Parent (👨‍👩‍👧 Student Tracking)
```
Email: parent@easeacademy.com
Password: Parent@123
```

### Student (👨‍🎓 Learning)
```
Email: student@easeacademy.com
Password: Student@123
```

---

## 🌿 Branch Details

| Branch | Code | City | Contact |
|--------|------|------|---------|
| Main Campus | MAIN-001 | Karachi | main@easeacademy.com |
| North Campus | NORTH-002 | Lahore | north@easeacademy.com |
| South Campus | SOUTH-003 | Multan | south@easeacademy.com |

---

## 📋 All API Endpoints

### Branches Seeder
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/seeders/create-branches` | Create 3 dummy branches |
| GET | `/api/seeders/create-branches` | View all branches |
| DELETE | `/api/seeders/create-branches` | Delete all branches |

### Users Seeder
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/seeders/create-users` | Create 5 dummy users |
| GET | `/api/seeders/create-users` | View all users |
| DELETE | `/api/seeders/create-users` | Delete all users |

---

## 🔧 Postman Setup Instructions

### Creating Branches

1. **Open Postman**
2. **Click "+" → New Request**
3. **Set to POST** method
4. **Enter URL:**
   ```
   http://localhost:3000/api/seeders/create-branches
   ```
5. **Go to Body tab** → Select **raw** → Select **JSON**
6. **Paste:**
   ```json
   {}
   ```
7. **Click Send** ✅
8. **Save response** - Copy branch IDs if needed

### Creating Users

1. **Click "+" → New Request**
2. **Set to POST** method
3. **Enter URL:**
   ```
   http://localhost:3000/api/seeders/create-users
   ```
4. **Go to Body tab** → Select **raw** → Select **JSON**
5. **Paste:**
   ```json
   {}
   ```
6. **Click Send** ✅
7. **Copy all credentials** from response

### Viewing Data

**View Branches:**
```
GET http://localhost:3000/api/seeders/create-branches
```

**View Users:**
```
GET http://localhost:3000/api/seeders/create-users
```

### Clearing Data

**Delete Branches:**
```
DELETE http://localhost:3000/api/seeders/create-branches
```

**Delete Users:**
```
DELETE http://localhost:3000/api/seeders/create-users
```

---

## 🧪 Testing Workflow

### 1. Seed Database
```bash
# Step 1: Create branches
POST /api/seeders/create-branches

# Step 2: Create users
POST /api/seeders/create-users
```

### 2. Test Login
- Go to: `http://localhost:3000/login`
- Use any credentials from above
- Click Sign In
- Should redirect to role-specific dashboard

### 3. Verify Features
- **Super Admin:** `/super-admin` - Manage branches, events, expenses
- **Branch Admin:** `/branch-admin` - Manage teachers, students
- **Teacher:** `/teacher` - View classes, mark attendance
- **Parent:** `/parent` - View child attendance, results
- **Student:** `/student` - View classes, results

### 4. Test Sidebar
- Check sidebar appears on left
- Verify menu items match user role
- Test hamburger menu on mobile
- Click menu items to navigate

---

## ⚠️ Important Notes

### Order Matters!
1. **Always create BRANCHES first**
2. **Then create USERS**
3. **Users need valid branch IDs**

### If Users Fail to Create
- Make sure branches exist first
- Check MongoDB is running
- Check connection string in `.env.local`

### Recreating Data
```
# Delete everything
DELETE /api/seeders/create-users
DELETE /api/seeders/create-branches

# Recreate fresh
POST /api/seeders/create-branches
POST /api/seeders/create-users
```

---

## 🚀 Production Considerations

⚠️ **IMPORTANT:** These seeder endpoints should be **removed or protected** before going to production!

**Options:**
1. **Delete the seeder files** from production
2. **Add authentication check** - Only allow super admin
3. **Use environment variable** - Only enable in development

**Example Protection:**
```javascript
if (process.env.NODE_ENV !== 'development') {
  return Response.json({ error: 'Not available in production' }, { status: 403 });
}
```

---

## 🎉 You're All Set!

Now you have:
- ✅ 3 branch records
- ✅ 5 user accounts (different roles)
- ✅ All passwords for testing
- ✅ Ready to test entire application
- ✅ Professional Sidebar UI
- ✅ Light theme for modal/dialogs

**Happy Testing! 🚀**

---

## 📞 Troubleshooting

| Problem | Solution |
|---------|----------|
| "MongoDB connection failed" | Check MONGODB_URI in .env.local |
| "Branches not found" | Create branches first! |
| "Users already exist" | DELETE users, then POST new ones |
| "Email already exists" | Delete all users, recreate them |
| "Permission denied" | Check user role and permissions |

---

## 📚 Related Files

- `/src/app/api/seeders/create-users/route.js` - User seeder API
- `/src/app/api/seeders/create-branches/route.js` - Branch seeder API
- `/src/backend/models/User.js` - User model
- `/src/backend/models/Branch.js` - Branch model
- `/QUICK_SEEDER.md` - Quick reference guide

