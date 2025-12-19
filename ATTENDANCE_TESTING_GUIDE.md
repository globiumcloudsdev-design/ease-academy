# Attendance System - Quick Testing Guide

## Prerequisites
1. Ensure development server is running: `npm run dev`
2. Login with appropriate credentials (branch-admin or super-admin)
3. Have a student QR code ready for testing (or use test data)

---

## Branch Admin Attendance Testing

### Access
Navigate to: `/branch-admin/attendance`

### Test Scenarios

#### 1. **Manual Attendance Marking**
```
Steps:
1. Select Date (default: today)
2. Select Class from dropdown
3. Select Section from dropdown
4. Optional: Select Subject
5. Switch to "Manual Attendance" tab
6. Use search to filter students (test: type student name)
7. Click Present/Absent/Late buttons for each student
8. Click "Save Attendance"
9. Verify success toast appears

Expected Result:
✅ Students load after class/section selection
✅ Search filters student list
✅ Button toggles work (only one status active per student)
✅ Save creates attendance record
```

#### 2. **QR Code Scanning**
```
Steps:
1. Select Date, Class, Section
2. Switch to "QR Code Scan" tab
3. Click "Open Scanner" button
4. Allow camera permission
5. Show student QR code to camera
6. Verify student appears in "Scanned Students" list
7. Scan multiple students without closing camera
8. Click X to close scanner
9. Verify all scanned students show "Present" badge
10. Click "Save Attendance"

Expected Result:
✅ Camera modal opens
✅ QR code detected and parsed
✅ Student marked present automatically
✅ Scanned students list updates
✅ Duplicate scans prevented
✅ Camera closes properly
```

#### 3. **Error Handling**
```
Test Cases:
1. Try to save without selecting class → Error toast
2. Scan QR from different branch → "Student belongs to different branch"
3. Scan QR from different class → "Student belongs to different class"
4. Scan invalid QR code → "Invalid QR Code"
5. Search for non-existent student → "No students found"

Expected Result:
✅ Appropriate error messages shown
✅ Invalid operations prevented
```

---

## Super Admin Attendance Testing

### Access
Navigate to: `/super-admin/attendance`

### Test Scenarios

#### 1. **Cross-Branch Attendance**
```
Steps:
1. Select Branch from dropdown
2. Wait for classes to load
3. Select Class
4. Select Section
5. Verify students from selected branch appear
6. Mark attendance (manual or QR)
7. Save attendance

Expected Result:
✅ Branch dropdown shows all branches
✅ Class updates when branch changes
✅ Students filtered by selected branch
✅ Attendance saves with correct branchId
```

#### 2. **Subject-wise Attendance**
```
Steps:
1. Select Branch, Class, Section
2. Select specific Subject from dropdown
3. Mark attendance
4. Save
5. Verify attendanceType = 'subject' in request

Expected Result:
✅ Subject dropdown populates with class subjects
✅ Attendance saved with subjectId
```

---

## QR Code Generation (For Testing)

### Sample QR Payload
```json
{
  "id": "60d5ec49f1b2c72b8c8e4f1a",
  "registrationNumber": "STU2024001",
  "rollNumber": "001",
  "firstName": "John",
  "lastName": "Doe",
  "branchId": "60d5ec49f1b2c72b8c8e4f1b",
  "classId": "60d5ec49f1b2c72b8c8e4f1c"
}
```

### Generate Test QR Code
Use online QR generator (e.g., qr-code-generator.com):
1. Copy above JSON (update IDs with actual database IDs)
2. Generate QR code
3. Print or display on screen
4. Scan with attendance system

**Note:** The QR payload must match:
- Valid student ID from database
- Correct branchId (matches selected branch)
- Correct classId (matches selected class)

---

## API Endpoint Testing (Optional)

### Branch Admin Create Attendance
```bash
POST /api/branch-admin/attendance
Headers: Authorization: Bearer <token>

Body:
{
  "branchId": "auto-injected",
  "classId": "60d5ec49f1b2c72b8c8e4f1c",
  "section": "A",
  "subjectId": null,
  "date": "2024-01-15",
  "attendanceType": "daily",
  "records": [
    { "studentId": "60d5ec49f1b2c72b8c8e4f1a", "status": "present" },
    { "studentId": "60d5ec49f1b2c72b8c8e4f1b", "status": "absent" }
  ]
}

Expected Response: 201 Created
```

### Super Admin Create Attendance
```bash
POST /api/super-admin/attendance
Headers: Authorization: Bearer <token>

Body:
{
  "branchId": "60d5ec49f1b2c72b8c8e4f1b",
  "classId": "60d5ec49f1b2c72b8c8e4f1c",
  "section": "A",
  "subjectId": null,
  "date": "2024-01-15",
  "attendanceType": "daily",
  "records": [
    { "studentId": "60d5ec49f1b2c72b8c8e4f1a", "status": "present" }
  ]
}

Expected Response: 201 Created
```

---

## Mobile Device Testing

### Recommended Tests
1. Open on iPhone/Android
2. Test camera permission flow
3. Verify QR scanner works
4. Test responsive layout
5. Check touch interactions

### Known Issues to Watch For
- iOS Safari requires HTTPS for camera
- Android Chrome may need mic permission
- Landscape mode layout adjustments
- Virtual keyboard covering inputs

---

## Performance Testing

### Load Testing
```
Test with:
- 10 students → Fast response
- 50 students → Should load smoothly
- 100+ students → Check for lag

Optimization:
- Pagination (if needed)
- Virtual scrolling (react-window)
- Debounced search (already implemented)
```

---

## Database Verification

### Check Attendance Collection
```javascript
// MongoDB query to verify attendance saved
db.attendance.find({
  branchId: ObjectId("..."),
  classId: ObjectId("..."),
  date: ISODate("2024-01-15")
})

// Verify records array
{
  _id: ObjectId("..."),
  branchId: ObjectId("..."),
  classId: ObjectId("..."),
  section: "A",
  date: ISODate("2024-01-15"),
  attendanceType: "daily",
  records: [
    { studentId: ObjectId("..."), status: "present" },
    { studentId: ObjectId("..."), status: "absent" }
  ],
  statistics: {
    totalStudents: 30,
    presentCount: 25,
    absentCount: 5,
    attendancePercentage: 83.33
  }
}
```

---

## Troubleshooting Common Issues

### Issue: Camera Not Opening
**Solution:**
1. Check browser supports getUserMedia API
2. Ensure HTTPS (or localhost)
3. Grant camera permission
4. Try different browser

### Issue: QR Code Not Scanning
**Solution:**
1. Ensure good lighting
2. Hold QR code steady
3. Check QR code is valid JSON
4. Verify payload structure matches expected format

### Issue: Students Not Loading
**Solution:**
1. Check class/section selected
2. Verify API endpoint returns data
3. Check console for errors
4. Ensure students exist in database

### Issue: Save Fails
**Solution:**
1. Check authentication token
2. Verify all required fields selected
3. Check network tab for error response
4. Ensure backend attendance routes exist

---

## Success Criteria Checklist

### Branch Admin
- [ ] Page loads without errors
- [ ] Class/section dropdowns populated
- [ ] Students load after selection
- [ ] Manual marking buttons work
- [ ] QR scanner opens camera
- [ ] QR codes scan successfully
- [ ] Search filters students
- [ ] Save creates attendance record
- [ ] Success toast appears

### Super Admin
- [ ] Branch dropdown shows all branches
- [ ] Classes update on branch change
- [ ] Students filtered by branch
- [ ] All features work same as branch-admin
- [ ] Cross-branch attendance saves correctly

### QR Scanner
- [ ] Camera permission requested
- [ ] Video stream displays
- [ ] QR codes detected accurately
- [ ] Invalid QRs rejected with error
- [ ] Batch scanning works
- [ ] Camera closes properly

---

## Next Steps After Testing

1. **If All Tests Pass:**
   - Deploy to staging environment
   - Test on production-like data
   - User acceptance testing (UAT)
   - Document known limitations
   - Train users on QR scanning

2. **If Issues Found:**
   - Document bugs with steps to reproduce
   - Fix critical issues first
   - Re-test after fixes
   - Consider rollback plan

---

## Contact & Support

For issues or questions:
- Check ATTENDANCE_SYSTEM_SUMMARY.md
- Review browser console errors
- Check network tab for API failures
- Verify database connection
- Test with different browsers/devices

---

## Conclusion

This guide covers all major test scenarios for the attendance system. Follow the steps systematically to ensure complete functionality. Happy testing! 🎉
