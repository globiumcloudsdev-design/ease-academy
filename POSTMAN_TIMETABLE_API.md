# Timetable API (Super Admin) - Postman Usage Guide

This guide explains how to use the Timetable API endpoints for CRUD and queries using Postman.

## Base URL
```
{{baseUrl}} = http://localhost:3000 (or your deployed URL)
```

## Authentication
- All endpoints require a Bearer token in the `Authorization` header.
- Set `{{accessToken}}` as an environment variable in Postman.

---

## Endpoints

### 1. Get All Timetables
- **GET** `/api/super-admin/timetables`
- Query params: `branchId`, `classId`, `academicYear`, `page`, `limit`

### 2. Create Timetable
- **POST** `/api/super-admin/timetables`
- Body (JSON):
```json
{
  "name": "Test Timetable",
  "academicYear": "2024-2025",
  "branchId": "<branchId>",
  "classId": "<classId>",
  "section": "A",
  "effectiveFrom": "2024-08-01",
  "effectiveTo": "2025-05-31",
  "status": "active",
  "periods": [
    {
      "periodNumber": 1,
      "day": "Monday",
      "startTime": "08:00",
      "endTime": "08:40",
      "subjectId": "<subjectId>",
      "teacherId": "<teacherId>",
      "periodType": "lecture",
      "roomNumber": "101",
      "notes": "Maths"
    }
  ],
  "timeSettings": {
    "periodDuration": 40,
    "breakDuration": 10,
    "lunchDuration": 30,
    "schoolStartTime": "08:00",
    "schoolEndTime": "14:00"
  }
}
```

### 3. Get Timetable By ID
- **GET** `/api/super-admin/timetables/:id`

### 4. Update Timetable
- **PUT** `/api/super-admin/timetables/:id`
- Body: Same as create, with updated fields

### 5. Delete Timetable
- **DELETE** `/api/super-admin/timetables/:id`

### 6. Get Class Timetable
- **GET** `/api/super-admin/timetables/class/:classId?academicYear=2024-2025`

### 7. Get Teacher Timetable
- **GET** `/api/super-admin/timetables/teacher/:teacherId?academicYear=2024-2025`

---

## Example Postman Environment
```json
{
  "baseUrl": "http://localhost:3000",
  "accessToken": "<your-jwt-token>"
}
```

---

## Notes
- Replace `<branchId>`, `<classId>`, `<subjectId>`, `<teacherId>` with actual IDs from your database.
- All requests must include the `Authorization: Bearer {{accessToken}}` header.
- See `postman-timetable-schema.json` for ready-to-import Postman collection.
