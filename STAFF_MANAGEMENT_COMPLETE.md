# Staff Management System - Complete Implementation

## Overview
Complete Staff Management system implemented for both Super Admin and Branch Admin with proper access control, auto-generated Employee IDs, and QR codes.

## Features Implemented

### 1. API Endpoints

#### Super Admin Endpoints
- `GET /api/super-admin/staff` - List all staff across all branches
- `POST /api/super-admin/staff` - Create new staff with branch selection
- `GET /api/super-admin/staff/:id` - Get staff details
- `PUT /api/super-admin/staff/:id` - Update staff
- `DELETE /api/super-admin/staff/:id` - Delete staff

#### Branch Admin Endpoints
- `GET /api/branch-admin/staff` - List staff in their branch only
- `POST /api/branch-admin/staff` - Create staff (auto-assigned to their branch)
- `GET /api/branch-admin/staff/:id` - Get staff details (branch-restricted)
- `PUT /api/branch-admin/staff/:id` - Update staff (branch-restricted)
- `DELETE /api/branch-admin/staff/:id` - Delete staff (branch-restricted)

### 2. Auto-Generation Features

#### Employee ID Format
```
{BRANCH_CODE}-S-{YEAR}-{SEQUENCE}
Example: KHI-S-2026-001
```

#### QR Code Generation
- Auto-generates QR code on staff creation
- Contains: Employee ID, Name, Email, Type (staff)
- Uploaded to Cloudinary
- Accessible for download from staff listing

#### Default Password
```
Staff@{CURRENT_YEAR}
Example: Staff@2026
```

### 3. Frontend Pages

#### Super Admin Page
**Path:** `/super-admin/staff`
- View all staff across all branches
- Filter by:
  - Search (name, email, employee ID)
  - Branch
  - Status (active/inactive)
- Actions:
  - Add staff with branch selection
  - View details
  - Download QR code
  - Delete staff

#### Branch Admin Page
**Path:** `/branch-admin/staff`
- View staff in their branch only
- Filter by:
  - Search (name, email, employee ID)
  - Status (active/inactive)
- Actions:
  - Add staff (auto-assigned to their branch)
  - View details
  - Download QR code
  - Delete staff
- **No branch selector** - automatically uses their branch

### 4. Add Staff Modal Component

#### Fields Included

**Basic Information:**
- First Name* (required)
- Last Name
- Email* (required)
- Phone
- Date of Birth
- Gender (dropdown)
- CNIC (format: XXXXX-XXXXXXX-X)
- Blood Group (dropdown)

**Employment Information:**
- Branch* (only for super admin, required)
- Staff Role (dropdown):
  - Admin Assistant
  - Accountant
  - Receptionist
  - Security Guard
  - Janitor
  - IT Support
  - Librarian
  - Lab Assistant
  - Other
- Shift (dropdown):
  - Morning
  - Evening
  - Night
- Joining Date
- Basic Salary

**Allowances:**
- House Rent
- Medical
- Transport
- Other

**Address:**
- Street
- City
- State/Province
- Postal Code
- Country (default: Pakistan)

**Emergency Contact:**
- Name
- Relationship
- Phone

### 5. Access Control

#### Super Admin
- ✅ Can view all staff from all branches
- ✅ Can create staff for any branch
- ✅ Must select branch when creating staff
- ✅ Can update/delete any staff
- ✅ Can filter by branch

#### Branch Admin
- ✅ Can view only their branch staff
- ✅ Can create staff for their branch only
- ✅ Branch auto-assigned (no selector shown)
- ✅ Can update/delete only their branch staff
- ✅ Cannot access other branch staff

### 6. Sidebar Navigation

#### Super Admin Sidebar
```
Staff Management
  └─ All Staff
```

#### Branch Admin Sidebar
```
Academic Management
  ├─ Teachers
  ├─ Staff (NEW)
  ├─ Students
  └─ ...
```

### 7. API Endpoints Constants

Updated `src/constants/api-endpoints.js`:

```javascript
SUPER_ADMIN: {
  STAFF: {
    CREATE: '/api/super-admin/staff',
    LIST: '/api/super-admin/staff',
    GET: '/api/super-admin/staff/:id',
    UPDATE: '/api/super-admin/staff/:id',
    DELETE: '/api/super-admin/staff/:id',
  }
}

BRANCH_ADMIN: {
  STAFF: {
    CREATE: '/api/branch-admin/staff',
    LIST: '/api/branch-admin/staff',
    GET: '/api/branch-admin/staff/:id',
    UPDATE: '/api/branch-admin/staff/:id',
    DELETE: '/api/branch-admin/staff/:id',
  }
}
```

## Technical Implementation

### Backend Architecture

#### Authentication Middleware
```javascript
export const GET = withAuth(listStaff, [requireRole(['super_admin'])]);
export const POST = withAuth(createStaff, [requireRole(['super_admin'])]);
```

#### Auto-Generation Logic
1. **Employee ID:**
   - Get branch code from Branch model
   - Count existing staff in branch
   - Format: `{BRANCH_CODE}-S-{YEAR}-{SEQUENCE}`

2. **QR Code:**
   - Generate using `generateStaffQR()` from qr-generator
   - Upload to Cloudinary using `uploadQR()`
   - Store URL and publicId in `staffProfile.qr`

#### Branch Admin Filtering
```javascript
// Automatic branch filtering
let filter = { 
  role: 'staff',
  branchId: currentUser.branchId // Only their branch
};
```

### Frontend Architecture

#### Component Structure
```
Page Component (Super Admin/Branch Admin)
  ├─ Staff Table
  ├─ Search & Filters
  ├─ Add Staff Modal
  └─ View Staff Modal
```

#### Modal Component
```javascript
<AddStaffModal
  open={showAddModal}
  onClose={() => setShowAddModal(false)}
  onSuccess={() => {
    setShowAddModal(false);
    loadStaff();
  }}
  branches={branches} // Only for super admin
  role="super_admin" // or "branch_admin"
/>
```

## Files Created/Modified

### New Files
1. `src/app/api/super-admin/staff/route.js`
2. `src/app/api/super-admin/staff/[id]/route.js`
3. `src/app/api/branch-admin/staff/route.js`
4. `src/app/api/branch-admin/staff/[id]/route.js`
5. `src/app/(dashboard)/super-admin/staff/page.js`
6. `src/app/(dashboard)/branch-admin/staff/page.js`
7. `src/components/modals/AddStaffModal.jsx`

### Modified Files
1. `src/constants/api-endpoints.js` - Added STAFF endpoints
2. `src/components/Sidebar.jsx` - Added Staff menu items

## Usage Examples

### Super Admin Creating Staff
1. Navigate to "Staff Management" → "All Staff"
2. Click "Add Staff" button
3. Fill form including **Branch selection**
4. Submit - Staff created with:
   - Auto-generated Employee ID (e.g., KHI-S-2026-001)
   - Auto-generated QR code
   - Default password (Staff@2026)

### Branch Admin Creating Staff
1. Navigate to "Academic Management" → "Staff"
2. Click "Add Staff" button
3. Fill form (no branch selector visible)
4. Submit - Staff created with:
   - Auto-assigned to branch admin's branch
   - Auto-generated Employee ID
   - Auto-generated QR code
   - Default password (Staff@2026)

### Downloading QR Code
1. Click download icon in staff table
2. QR code opens in new tab
3. Can be saved/printed for staff ID cards

## Security Features

1. ✅ Role-based access control via `withAuth` and `requireRole`
2. ✅ Branch isolation for branch admins
3. ✅ Email uniqueness validation
4. ✅ Password auto-hashing via User model pre-save hook
5. ✅ Proper error handling and logging

## Testing Checklist

### Super Admin Tests
- [ ] Can view all staff from all branches
- [ ] Can create staff with branch selection
- [ ] Employee ID generates correctly
- [ ] QR code generates and uploads
- [ ] Can filter by branch
- [ ] Can search staff
- [ ] Can view staff details
- [ ] Can download QR code
- [ ] Can delete staff

### Branch Admin Tests
- [ ] Can view only their branch staff
- [ ] Cannot see other branch staff
- [ ] Can create staff (auto-assigned to their branch)
- [ ] No branch selector appears in form
- [ ] Employee ID generates correctly
- [ ] QR code generates and uploads
- [ ] Can search staff
- [ ] Can view staff details
- [ ] Can download QR code
- [ ] Can delete only their branch staff

## Future Enhancements

1. Staff profile photo upload
2. Bulk import staff via CSV/Excel
3. Staff attendance tracking integration
4. Staff leave management
5. Performance evaluations
6. Document uploads (CV, certificates)
7. Edit staff functionality
8. Staff activity logs
9. Advanced filtering (department, joining date range)
10. Export staff list to Excel/PDF

## Notes

- Default password is sent via email (future enhancement)
- QR codes can be used for attendance scanning
- Staff salary details are stored in `staffProfile.salaryDetails`
- All monetary fields are stored as numbers
- Emergency contact info is optional but recommended
- Address and phone fields are optional
- CNIC format validation can be added later

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Staff created successfully",
  "data": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "staffProfile": {
      "employeeId": "KHI-S-2026-001",
      "qr": {
        "url": "https://cloudinary.com/...",
        "publicId": "ease-academy/qr/staff/..."
      },
      "joiningDate": "2026-01-09",
      "role": "Admin Assistant",
      "shift": "morning"
    },
    "branchId": {
      "_id": "...",
      "name": "Karachi Branch",
      "code": "KHI"
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

**Status:** ✅ Complete and Ready for Testing
**Date:** January 9, 2026
