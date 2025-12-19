# Quick Seeder Guide

## 🚀 Use in Postman (3 Easy Steps)

### Step 1️⃣: Create Users
```
POST http://localhost:3000/api/seeders/create-users
Body: {} (empty)
```
✅ 5 users created!

### Step 2️⃣: Login with Any Credential
```
Email: superadmin@easeacademy.com
Password: SuperAdmin@123
```

Or try other roles:
- 👔 **branchadmin@easeacademy.com** / BranchAdmin@123
- 👨‍🏫 **teacher@easeacademy.com** / Teacher@123
- 👨‍👩‍👧 **parent@easeacademy.com** / Parent@123
- 👨‍🎓 **student@easeacademy.com** / Student@123

### Step 3️⃣: Delete Users (if needed)
```
DELETE http://localhost:3000/api/seeders/create-users
Body: {} (empty)
```

---

## 📋 All Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Super Admin | superadmin@easeacademy.com | SuperAdmin@123 |
| 👔 Branch Admin | branchadmin@easeacademy.com | BranchAdmin@123 |
| 👨‍🏫 Teacher | teacher@easeacademy.com | Teacher@123 |
| 👨‍👩‍👧 Parent | parent@easeacademy.com | Parent@123 |
| 👨‍🎓 Student | student@easeacademy.com | Student@123 |

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/seeders/create-users` | Create 5 dummy users |
| GET | `/api/seeders/create-users` | View all users |
| DELETE | `/api/seeders/create-users` | Delete all users |

---

## ✨ What Gets Created

✅ 5 users with different roles
✅ Hashed passwords (bcryptjs)
✅ Default permissions per role
✅ Ready for login
✅ All users active & verified

---

## ⚠️ Important Notes

- **First time?** → POST to create users
- **Already have users?** → DELETE first, then POST
- **Just want to check?** → GET to view all
- **Production?** → Remove or protect this endpoint!

---

Jani! Bas Postman khol aur POST endpoint call kar do! 🎉
