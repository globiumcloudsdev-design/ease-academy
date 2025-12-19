# Parent App Input Fields Documentation

This document details all input fields across the Parent App, organized by page with headings for each page. For pages without input fields, it is noted. Each input field includes its type, placeholder (if applicable), state management, and behaviors.

## Signup Page (app/signup.tsx) Input Fields

### Parent Information Section
- **Full Name**: TextInput, placeholder "Full Name", value from `parent.name` state, onChangeText updates `parent.name`
- **Email Address**: TextInput, placeholder "Email Address", keyboardType "email-address", value from `parent.email`, onChangeText updates `parent.email`
- **Phone Number**: TextInput, placeholder "Phone Number", keyboardType "phone-pad", value from `parent.phone`, onChangeText updates `parent.phone`
- **Gender**: Two TouchableOpacity buttons for Male/Female, selected based on `parent.gender`, onPress sets `parent.gender` to 'Male' or 'Female', styled with primary color when selected
- **Address**: TextInput, placeholder "Address", multiline implied, value from `parent.address`, onChangeText updates `parent.address`
- **CNIC**: TextInput, placeholder "CNIC", keyboardType "numeric", value from `parent.cnic`, onChangeText updates `parent.cnic`

### Children Information Section (Dynamic for each child)
- **Child Name**: TextInput, placeholder "Child Name", value from `children[index].name`, onChangeText calls `updateChild(index, 'name', value)`
- **Registration Number**: TextInput, placeholder "Registration Number", value from `children[index].regNumber`, onChangeText calls `updateChild(index, 'regNumber', value)`
- **Date of Birth**: TextInput, placeholder "Date of Birth (DD/MM/YYYY)", value from `children[index].dob`, onChangeText calls `updateChild(index, 'dob', value)`
- **B-Form Number**: TextInput, placeholder "B-Form Number", value from `children[index].bform`, onChangeText calls `updateChild(index, 'bform', value)`
- **Class**: TextInput, placeholder "Class", value from `children[index].class`, onChangeText calls `updateChild(index, 'class', value)`

## Login Page (app/login.tsx) Input Fields
- **Email**: TextInput, placeholder "Enter email", keyboardType "email-address", autoCapitalize "none", value from `email` state, onChangeText sets `email`
- **Password**: TextInput, placeholder "Enter password", secureTextEntry true, value from `password` state, onChangeText sets `password`

### Forgot Password Modal (within Login Page)
- **Step 1 - Email**: TextInput, placeholder "Enter your email", value from `forgotEmail`, onChangeText sets `forgotEmail`
- **Step 2 - OTP**: 6 TextInputs, each maxLength 1, keyboardType "numeric", value from `otp[index]`, onChangeText calls `handleOtpChange(value, index)`, onKeyPress calls `handleOtpKeyPress` for backspace navigation and auto-focus
- **Step 3 - New Password**: TextInput, placeholder "Enter new password", secureTextEntry true, value from `newPassword`, onChangeText sets `newPassword`

## Settings Page (app/settings.tsx) Input Fields
- **Push Notifications**: Switch, value from `notifications` state, onValueChange sets `notifications`, trackColor false: '#334155' true: '#3B82F6', thumbColor value ? '#FFFFFF' : '#94A3B8'
- **Email Alerts**: Switch, value from `emailAlerts` state, onValueChange sets `emailAlerts`, trackColor false: '#334155' true: '#3B82F6', thumbColor value ? '#FFFFFF' : '#94A3B8'
- **Dark Mode**: Switch, value from `darkMode` state, onValueChange sets `darkMode`, trackColor false: '#334155' true: '#3B82F6', thumbColor value ? '#FFFFFF' : '#94A3B8'
- **Biometric Login**: Switch, value from `biometric` state, onValueChange sets `biometric`, trackColor false: '#334155' true: '#3B82F6', thumbColor value ? '#FFFFFF' : '#94A3B8'

## Compose Message Page (app/messages/compose.tsx) Input Fields
- **Recipient (To)**: TextInput, placeholder "Select Teacher or Admin", placeholderTextColor "#64748B", value from `recipient` state, onChangeText sets `recipient`
- **Subject**: TextInput, placeholder "What is this about?", placeholderTextColor "#64748B", value from `subject` state, onChangeText sets `subject`
- **Message**: TextInput, placeholder "Type your message here...", placeholderTextColor "#64748B", multiline true, style textAlignVertical 'top', leading-6, value from `message` state, onChangeText sets `message`

## Message Detail Page (app/messages/[id].tsx) Input Fields
- **Reply Text**: TextInput, placeholder "Write a message...", placeholderTextColor "#64748B", multiline true, max-h-24, value from `replyText` state, onChangeText sets `replyText`

## Assignment Notification Detail Page (app/notifications/assignment/[id].tsx) Input Fields
- No input fields on this page. It displays static assignment information and buttons for actions like "Submit Assignment" and "Download Template", but no editable inputs.
- **Displayed Data**: Uses NOTIFICATIONS array from mockData.ts, finds assignment type notification by id, shows title, message, time, subject (hardcoded as "Science"), topic (hardcoded as "Microorganisms"), due date (hardcoded as "Friday"), submission (hardcoded as "Online Portal"), requirements list, and resources list.

## Quiz Notification Detail Page (app/notifications/quiz/[id].tsx) Input Fields
- No input fields on this page. It displays static quiz information and buttons for actions like "Start Practice Quiz" and "Quiz Guidelines", but no editable inputs.
- **Displayed Data**: Uses NOTIFICATIONS array from mockData.ts, finds quiz type notification by id, shows title, message, time, subject (hardcoded as "Mathematics"), chapters (hardcoded as "4 & 5"), date (hardcoded as "Tomorrow, 10:00 AM"), duration (hardcoded as "45 minutes"), preparation checklist, sample questions.

## Academics Resources Page (app/academics/resources.tsx) Input Fields
- No input fields on this page. It displays a list of resources with TouchableOpacity items for downloading/opening, but no editable inputs.
- **Displayed Data**: Receives resources array via params from navigation, parses JSON, displays courseName, and lists resources with title, type (PDF/Video), and download icon. Data comes from SUBJECTS.resources in mockData.ts.

## Announcements Page (app/announcements.tsx) Input Fields
- No input fields on this page. It lists announcements from mock data with no user input.
- **Displayed Data**: Uses ANNOUNCEMENTS array from mockData.ts, displays each announcement with title, date, type, and icon based on type (General/Activity/Sports/Academic/Admin).

## Attendance History Page (app/attendance-history.tsx) Input Fields
- No input fields on this page. It displays attendance records from mock data.
- **Displayed Data**: Uses ATTENDANCE_DATA from mockData.ts for selected child, displays attendance records with date, status (Present/Absent/Late), check-in/check-out times, and remarks. Shows current day first, then historical data.

## Help & Support Page (app/help-support.tsx) Input Fields
- No input fields on this page. It contains static FAQs and contact information, possibly with collapsible sections but no editable inputs.
- **Displayed Data**: Static content with FAQ sections (Account, Payments, Technical Issues, General), each with questions and answers. Contact information includes email support@parentapp.com.

## Privacy & Security Page (app/privacy-security.tsx) Input Fields
- No input fields on this page. It displays toggles for permissions and data export options, but based on structure, likely switches similar to settings (not detailed in code review).
- **Displayed Data**: Static content with privacy policy sections, data usage information, and permission toggles (not implemented in code).

## Notification Page (app/notification.tsx) Input Fields
- No input fields on this page. It lists notifications from mock data with swipe actions for read/unread.
- **Displayed Data**: Uses NOTIFICATIONS array from mockData.ts, displays each notification with type, title, message, time, read status, icon, and color. Supports swipe to mark as read/unread.

## Syllabus Page (app/academics/syllabus.tsx) Input Fields
- No input fields on this page. It displays syllabus topics with progress bars and lists.
- **Displayed Data**: Uses SUBJECTS from mockData.ts for selected child, displays each subject with name, teacher, textbook, progress percentage, upcoming test date, syllabus topics with status (Completed/In Progress/Pending), and resources list.

## Messages List Page (app/messages/index.tsx) Input Fields
- No input fields on this page. It lists conversations from mock data.
- **Displayed Data**: Uses MESSAGES array from mockData.ts, displays each message with from, role, initials, subject, time, read status, priority, and avatar. Shows unread count and supports navigation to detail view.

## Home Dashboard Page (app/(drawer)/index.tsx) Input Fields
- No input fields on this page. It displays welcome message, notifications button, and dashboard widgets.
- **Displayed Data**: Uses TOP_USER from mockData.ts for user name and quick stats (totalDue, upcomingEvents, unreadMessages, recentAnnouncements). Uses STUDENTS array for selected child info. Displays welcome message, child selector, quick stats cards, recent activity from RECENT_ACTIVITY, upcoming events from EVENTS, and recent announcements from ANNOUNCEMENTS.

## Data Flow Summary
- Signup collects parent/children data via inputs, passes to AuthContext.signup() which logs it but doesn't persist storage.
- Login validates email/password inputs against hardcoded credentials to set isLoggedIn in AuthContext.
- Forgot Password modal handles OTP and password reset with dummy validation (OTP '123456').
- Settings toggles manage local state for preferences like notifications and dark mode.
- Compose Message and Message Detail handle text inputs for sending/replying messages, with mock sending via Alert.
- Other pages are read-only, displaying mock data without user input.
- ChildContext manages selectedChild from mock STUDENTS, no integration with signup inputs.