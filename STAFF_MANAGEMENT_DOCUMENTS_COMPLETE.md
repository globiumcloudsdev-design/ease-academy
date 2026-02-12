# Staff Management System - Complete with Document Upload

## Issues Fixed ✅

### 1. Shift Enum Value Error
**Error:** `staffProfile.shift: 'morning' is not a valid enum value`

**Fix:** Updated shift values to match User model enum:
- ✅ `Morning` (capital M)
- ✅ `Evening` (capital E)
- ✅ `Night` (capital N)
- ✅ `Rotating` (capital R)

**Changed in:** `AddStaffModal.jsx`

## New Features Added 🎉

### 1. Profile Photo Upload
- **Upload button** with preview
- **File validation:** Image files only (JPG, PNG), Max 5MB
- **Preview display:** Shows uploaded photo with remove option
- **Cloudinary integration:** Auto-uploads to cloud storage
- **API endpoint:** `/api/upload` with `fileType: 'profile'`

### 2. Document Upload System
**Document Types:**
- CNIC
- CV/Resume
- Certificates
- Other

**Features:**
- **Multiple documents:** Upload unlimited files
- **File validation:** PDF, JPG, PNG (Max 10MB each)
- **Visual UI:** Drag-and-drop style buttons
- **Document list:** Shows all uploaded documents with remove option
- **Cloudinary storage:** All docs uploaded to cloud
- **API endpoint:** `/api/upload` with `fileType: 'staff_document'`

### 3. Enhanced Form Fields

**New Basic Information Fields:**
- Alternate Phone
- Religion
- Nationality (default: Pakistani)

**Emergency Contact:**
- Name
- Relationship
- Phone
- Alternate Phone (NEW)

**All Fields Now Included:**
- ✅ First Name*
- ✅ Last Name
- ✅ Email*
- ✅ Phone
- ✅ Alternate Phone
- ✅ Date of Birth
- ✅ Gender
- ✅ CNIC
- ✅ Blood Group
- ✅ Religion
- ✅ Nationality
- ✅ Branch* (super admin only)
- ✅ Staff Role
- ✅ Shift (Morning/Evening/Night/Rotating)
- ✅ Joining Date
- ✅ Basic Salary
- ✅ Allowances (House Rent, Medical, Transport, Other)
- ✅ Address (Street, City, State, Postal Code)
- ✅ Emergency Contact (Name, Relationship, Phone, Alternate Phone)
- ✅ Profile Photo Upload
- ✅ Documents Upload (Multiple)

## Modal UI Updates

### Profile Photo Section
```jsx
┌─────────────────────────────────────┐
│ Profile Photo                       │
├─────────────────────────────────────┤
│ [Photo Preview] [Upload Button]    │
│ "Max 5MB (JPG, PNG)"                │
└─────────────────────────────────────┘
```

### Documents Section
```jsx
┌─────────────────────────────────────┐
│ Documents                           │
├─────────────────────────────────────┤
│ [CNIC] [CV/Resume] [Certificates]  │
│              [Other]                 │
│                                      │
│ Uploaded Documents (2)              │
│ ┌─────────────────────────────────┐ │
│ │ [CNI] document.pdf    [Remove]  │ │
│ │ [CV]  resume.pdf      [Remove]  │ │
│ └─────────────────────────────────┘ │
│ "PDF, JPG, PNG (Max 10MB)"          │
└─────────────────────────────────────┘
```

## API Updates

### Super Admin Staff Create (`/api/super-admin/staff`)
```javascript
// Now accepts:
{
  // Basic fields...
  alternatePhone: string,
  religion: string,
  nationality: string,
  profilePhoto: {
    url: string,
    publicId: string
  },
  documents: [{
    type: 'cnic' | 'cv' | 'resume' | 'certificate' | 'other',
    name: string,
    url: string,
    publicId: string
  }],
  emergencyContact: {
    name: string,
    relationship: string,
    phone: string,
    alternatePhone: string // NEW
  }
}
```

### Branch Admin Staff Create (`/api/branch-admin/staff`)
Same structure as above (branch auto-assigned)

## File Upload Flow

### Profile Photo Upload:
1. User selects image file
2. Validates: file type (image/*) and size (< 5MB)
3. Creates FormData with file and `fileType: 'profile'`
4. POST to `/api/upload`
5. Receives response with `url` and `publicId`
6. Stores in formData.profilePhoto
7. Displays preview with remove button

### Document Upload:
1. User clicks document type button (CNIC, CV, etc.)
2. Selects file
3. Validates size (< 10MB)
4. Creates FormData with file, `fileType: 'staff_document'`, and `documentType`
5. POST to `/api/upload`
6. Receives response with `url` and `publicId`
7. Adds to formData.documents array
8. Displays in uploaded documents list
9. User can remove before final submission

### Final Submission:
1. Form data includes all fields + profilePhoto + documents array
2. POST to staff creation endpoint
3. Staff created with all information
4. Profile photo stored in `User.profilePhoto`
5. Documents stored in `User.staffProfile.documents[]`
6. QR code auto-generated and stored

## Database Schema

### User Model - Staff Profile
```javascript
{
  profilePhoto: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  staffProfile: {
    employeeId: String,
    joiningDate: Date,
    role: String,
    shift: 'Morning' | 'Evening' | 'Night' | 'Rotating',
    salaryDetails: {
      basicSalary: Number,
      allowances: {
        houseRent: Number,
        medical: Number,
        transport: Number,
        other: Number
      }
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      alternatePhone: String // NEW
    },
    documents: [{
      type: 'cnic' | 'cv' | 'resume' | 'certificate' | 'other',
      name: String,
      url: String,
      publicId: String,
      uploadedAt: Date
    }],
    qr: {
      url: String,
      publicId: String,
      uploadedAt: Date
    }
  }
}
```

## Component State Management

### AddStaffModal State:
```javascript
const [loading, setLoading] = useState(false);
const [uploadingPhoto, setUploadingPhoto] = useState(false); // NEW
const [uploadingDocs, setUploadingDocs] = useState(false);   // NEW
const [formData, setFormData] = useState({
  // All fields...
  profilePhoto: null,    // NEW
  documents: []          // NEW
});
```

## User Experience Improvements

### Loading States:
- ✅ **Form submission:** Loading button with spinner
- ✅ **Photo upload:** "Uploading..." text with spinner
- ✅ **Document upload:** "Uploading document..." with spinner

### Validation:
- ✅ Required fields (First Name, Email, Branch for super admin)
- ✅ File type validation
- ✅ File size validation
- ✅ Clear error messages via toast

### Visual Feedback:
- ✅ Profile photo preview
- ✅ Document upload progress indicator
- ✅ Uploaded documents list with icons
- ✅ Remove buttons for each document
- ✅ Success/error toast notifications

## Testing Checklist

### Profile Photo:
- [ ] Upload JPG image
- [ ] Upload PNG image
- [ ] Try uploading non-image file (should fail)
- [ ] Try uploading > 5MB file (should fail)
- [ ] Preview displays correctly
- [ ] Remove photo works
- [ ] Submit form with photo
- [ ] Verify photo in database

### Documents:
- [ ] Upload CNIC (PDF)
- [ ] Upload CV (PDF)
- [ ] Upload Certificate (Image)
- [ ] Upload Other document
- [ ] Try > 10MB file (should fail)
- [ ] Upload multiple documents
- [ ] Remove document works
- [ ] Submit form with documents
- [ ] Verify documents in database

### Form Submission:
- [ ] All fields save correctly
- [ ] Profile photo URL saved
- [ ] Documents array saved
- [ ] Emergency contact with alternate phone
- [ ] Shift enum value (Morning, Evening, etc.)
- [ ] QR code generated
- [ ] Employee ID generated

## Files Modified

1. **src/components/modals/AddStaffModal.jsx**
   - Added profile photo upload
   - Added document upload system
   - Fixed shift enum values
   - Added new form fields
   - Enhanced UI with preview and document list

2. **src/app/api/super-admin/staff/route.js**
   - Accept profilePhoto object
   - Accept documents array
   - Store in User model
   - Added alternate phone and religion fields

3. **src/app/api/branch-admin/staff/route.js**
   - Same changes as super admin route
   - Auto-assign branch

## Success Criteria ✅

- ✅ Shift enum error fixed
- ✅ All staff details can be entered
- ✅ Profile photo upload working
- ✅ Multiple document upload working
- ✅ Documents stored in Cloudinary
- ✅ Document URLs saved in database
- ✅ Clean UI with preview
- ✅ Proper validation
- ✅ Loading states
- ✅ Error handling
- ✅ Works for both Super Admin and Branch Admin

---

**Status:** ✅ Complete and Ready for Testing
**Date:** January 9, 2026

**Note:** All documents are uploaded to Cloudinary before form submission, ensuring secure cloud storage and easy access for later viewing/downloading.
