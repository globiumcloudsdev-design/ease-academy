# Email Template & System Integration Guide

## Setup Instructions

### 1. Environment Variables
Add these to your `.env.local` file:

```env
# Email Service Configuration (choose one)
# Option A: Using Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@easeacademy.com

# Option B: Using Custom SMTP
EMAIL_HOST=smtp.your-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@easeacademy.com
```

### 2. Install Nodemailer
```bash
npm install nodemailer
```

### 3. How It Works

#### Email Templates (`src/backend/templates/studentEmail.js`)
- **STUDENT_CREATED**: Sent when a student is enrolled
  - Welcome message
  - Student information
  - Academic details
  - Admission date
  
- **STUDENT_UPDATED**: Sent when student record is updated
  - Update notification
  - Changed details
  - Current status

- **STUDENT_DEACTIVATED**: Sent when student is deactivated
  - Deactivation notice
  - Account status
  - Contact information

#### Email Service (`src/backend/utils/emailService.js`)
- **sendEmail(to, subject, html)**: Send email to single recipient
- **sendBulkEmail(to[], subject, html)**: Send email to multiple recipients
- Non-blocking: Emails sent asynchronously without blocking API response

#### Integration Points
1. **Student Creation** (`src/app/api/users/students/route.js`)
   - Sends STUDENT_CREATED template email
   - Called after successful student creation
   - Recipient: student email

2. **Student Deactivation** (`src/app/api/users/[id]/route.js`)
   - Sends STUDENT_DEACTIVATED template email
   - Called on DELETE request
   - Recipient: student email

### 4. Email Template Customization

Edit `src/backend/templates/studentEmail.js` to:
- Change colors (hex codes in style attributes)
- Add/remove fields
- Modify subject lines
- Change school name
- Add logo or images

### 5. Features

✅ **Professional HTML Templates**
- Responsive design (mobile-friendly)
- Gradient headers
- Color-coded sections
- Proper spacing and typography

✅ **Non-Blocking Architecture**
- Emails sent asynchronously
- API responds immediately
- No performance impact

✅ **Error Handling**
- Graceful fallback if email fails
- Detailed logging
- User-friendly error messages

✅ **Button Loading States**
- Visual feedback on form submission
- Spinner animation while saving
- Disabled state while processing
- "Saving..." / "Deactivating..." text

### 6. Testing

To test emails locally:
1. Use a test email service like Mailtrap.io
2. Or use Gmail with app-specific password
3. Check console logs for confirmation: "Email sent successfully to..."

### 7. Future Enhancements

Possible additions:
- Email templates for teachers, staff, parents
- Bulk email sending to class/branch
- Email scheduling
- Email templates dashboard to customize designs
- Email logs/audit trail
