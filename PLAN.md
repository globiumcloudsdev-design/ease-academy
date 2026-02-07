# Teacher Self-Attendance System Implementation Plan

## Overview
Implement a comprehensive teacher self-attendance system with location validation, time-based rules, and admin monitoring capabilities.

## Current State Analysis
- **EmployeeAttendance Model**: Exists with check-in/check-out functionality
- **Branch Admin Attendance Page**: Currently shows student attendance
- **API Structure**: Established with JWT authentication
- **Frontend**: Next.js with existing UI components

## Required Features

### 1. Environment Variables Setup
BRANCH_LATITUDE=24.96136
BRANCH_LONGITUDE=67.07103
ATTENDANCE_RADIUS_METERS=100
- `WORK_START_TIME`: Working hours start (default 09:00am)
- `WORK_END_TIME`: Working hours end (default 23 : 00pm)
- `LATE_AFTER_MIN`: Late threshold in minutes (default 15)

### 2. Backend APIs
- **POST /api/teacher/self-attendance/check-in**: Teacher check-in with location
- **POST /api/teacher/self-attendance/check-out**: Teacher check-out with location
- **GET /api/branch-admin/teacher/-self-attendance**: List teacher attendance for admin

### 3. Frontend Components
- **Teacher Self-Attendance Page**: Check-in/check-out interface with location validation
- **Branch Admin  Attendance Page**: View and manage teacher attendance
- **Location Validation**: Geolocation API integration

### 4. Business Logic
- **Location Validation**: Haversine distance calculation
- **Time Rules**: Late check-in and early check-out detection
- **Duplicate Prevention**: Prevent multiple check-ins/check-outs per day

## Implementation Plan

### Phase 1: Backend API Development
1. **Update EmployeeAttendance Model** (if needed)
2. **Create Teacher Check-In API**
3. **Create Teacher Check-Out API**
4. **Create Branch Admin Teacher Attendance API**
5. **Implement Location Validation Logic**
6. **Implement Time Rules Logic**

### Phase 2: Frontend Development
1. **Create Teacher Self-Attendance api**
2. **Update Branch Admin Attendance Page**
3. **Implement Location Validation**
4. **Add Real-time Updates**

### Phase 3: Integration & Testing
1. **Environment Variables Setup**
2. **API Integration**
3. **UI/UX Testing**
4. **Location Testing**

## File Structure Changes

### Backend Files to Create/Update:
```
src/backend/controllers/
├── teacherAttendanceController.js (new)

src/backend/models/
├── EmployeeAttendance.js (update if needed)

src/app/api/teacher/attendance/
├── check-in/route.js (new)
├── check-out/route.js (new)

src/app/api/branch-admin/
├── teacher-attendance/route.js (new)
```

### Frontend Files to Create/Update:
```
src/app/(dashboard)/teacher/
├── attendance/page.js (new)

src/app/(dashboard)/branch-admin/
├── teacher-attendance/page.js (new)

src/components/teacher/
├── AttendanceCard.jsx (new)
├── LocationValidator.jsx (new)
```

## Data Structure

### Teacher Attendance Record
```javascript
{
  teacherId: ObjectId,
  branchId: ObjectId,
  date: Date,
  checkInTime: Date,
  checkOutTime: Date,
  latitude: Number,
  longitude: Number,
  distanceFromBranch: Number,
  status: "PRESENT | LATE | EARLY_CHECKOUT | ABSENT"
}
```

## API Endpoints

### Teacher APIs
- **POST /api/teacher/attendance/check-in**
  - Body: `{ latitude, longitude }`
  - Response: `{ success, message, data }`

- **POST /api/teacher/attendance/check-out**
  - Body: `{ latitude, longitude }`
  - Response: `{ success, message, data }`

### Branch Admin APIs
- **GET /api/branch-admin/teacher-attendance**
  - Query: `{ date, teacherId }`
  - Response: `{ success, data: { attendance: [] } }`

## Validation Rules

### Location Validation
- Calculate distance using Haversine formula
- Compare with `LOCATION_RADIUS_METERS`
- Allow check-in/check-out only within radius

### Time Validation
- **Late Check-In**: Check-in after `WORK_START_TIME + LATE_AFTER_MIN`
- **Early Check-Out**: Check-out before `WORK_END_TIME`

## UI/UX Requirements

### Teacher Self-Attendance Page
- Current location display
- Distance from branch
- Check-in/check-out buttons
- Status indicators
- Today's attendance summary

### Branch Admin Teacher Attendance Page
- Date selector
- Teacher list with attendance status
- Check-in/check-out times
- Location information
- Status badges (Present, Late, Early Checkout, Absent)

## Dependencies
- Existing: `jsqr`, `@radix-ui/react-checkbox`
- New: None required (using browser Geolocation API)

## Testing Checklist

### Backend Tests
- [ ] Check-in API with valid location
- [ ] Check-in API with invalid location
- [ ] Check-out API functionality
- [ ] Duplicate check-in prevention
- [ ] Late check-in detection
- [ ] Early check-out detection

### Frontend Tests
- [ ] Location permission handling
- [ ] Distance calculation accuracy
- [ ] Real-time status updates
- [ ] Admin attendance viewing

## Security Considerations
- JWT authentication for all APIs
- Location data validation
- Rate limiting for attendance APIs
- Branch isolation for admin views

## Performance Optimizations
- Database indexing on teacherId, date, branchId
- Efficient location calculations
- Minimal API calls for real-time updates

## Rollback Plan
- Keep existing student attendance functionality intact
- Gradual rollout of teacher attendance features
- Feature flags for enabling/disabling components

## Success Metrics
- Successful check-in/check-out operations
- Accurate location validation
- Proper time-based status detection
- Admin visibility of teacher attendance
- User-friendly interface adoption
