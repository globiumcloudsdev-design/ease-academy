# Comprehensive Feature & Role Definition — Ease Academy

This document provides the **ultimate detailed breakdown** of every module, feature, and action available in the Ease Academy School Management System. It is the single source of truth for "what the system can do" for each user role.

---

## 🏗️ 1. Core Architecture & Modules
The system is built on a **Role-Based Access Control (RBAC)** architecture.
*   **Total Roles:** 6 (Super Admin, Branch Admin, Teacher, Student, Parent, Staff)
*   **Authentication:** JWT with secure HTTP-only cookies.
*   **Multi-Tenancy:** One system supports unlimited branches/campuses with strict data isolation.

---

## 👑 SUPER ADMIN (The Owner)
**Authority:** Absolute Control over the entire SaaS/Organization.

### 🔹 Module: Branch Management
*   **Create Branch:** Define new campus (Name, Code, Address, Contact, GPS Location).
*   **Manage Branch Admins:** Assign a specific user as the "Head" of a branch.
*   **Branch Status:** Activate/Deactivate a branch (e.g., for non-payment of subscription).
*   **Global Layout:** View all branches on a map or list.

### 🔹 Module: Financial Oversight (Global)
*   **Global Dashboard:** View total revenue across *all* branches.
*   **Subscription Plans:** Create packages (e.g., Basic, Premium) for branches to buy.
*   **Pending Payments:** See a consolidated list of fee payments waiting for approval across the network.
*   **Reject/Approve Power:** Override local branch decisions on payments (e.g., verify bank transfers directly).

### 🔹 Module: User Control & Security
*   **Master User List:** Search any user (Student, Teacher, Admin) by email or phone globally.
*   **Ban/Unban:** Revoke access for any user instantly.
*   **Reset Credentials:** Force password resets for Branch Admins.
*   **Activity Logs:** (Planned) View system-wide audit logs.

### 🔹 Module: System Configuration
*   **Email Templates:** Customize the HTML templates for Welcome Emails, Fee Reminders, etc.
*   **SMS Gateway:** Configure Twilio or local SMS provider credentials.
*   **Notification Rules:** Set rules for when push notifications are sent (e.g., "Notify parent immediately on absence").

---

## 🏢 BRANCH ADMIN (The Principal/Manager)
**Authority:** Full control *within* their assigned Branch.

### 🔹 Module: Academic Setup
*   **Classes:** Create classes (e.g., "Grade 1", "O-Levels").
*   **Sections:** Create sections (e.g., "Blue", "Green", "Boys", "Girls").
*   **Subjects:** specific subjects (Math, Sci, Isl) and assign them to Classes.
*   **Timetable:**
    *   Create weekly schedules.
    *   Assign teachers to slots.
    *   Detect conflicts (two teachers in one room).
*   **Syllabus:** Upload annual/term syllabus plans for teachers to follow.

### 🔹 Module: Human Resources (HR)
*   **Staff Onboarding:** Register Teachers, Accountants, Clerks, Peons.
*   **Role Assignment:** Designate a user as "Teacher" or "Staff".
*   **Payroll System:**
    *   **Salary Templates:** Define base pay + allowances (House Rent, Medical) + Deductions (Tax).
    *   **Generate Payslips:** Bulk generate monthly slips.
    *   **Process Salary:** Mark salaries as "Paid".
*   **Attendance Monitoring:**
    *   View "Late Comers" report for staff.
    *   Edit attendance manually if biometric/app fails.
*   **Leave Management:** Review and approve/reject leave applications from staff.

### 🔹 Module: Student Lifecycle
*   **Admission:**
    *   Enrol new student with full bio-data.
    *   Assign "Roll Number" and "Registration Number".
    *   Upload documents (B-Form, Previous result).
*   **Promotion:** Bulk promote students from Class 1 -> Class 2 at year-end.
*   **Certificates:**
    *   Generate "School Leaving Certificate" (SLC).
    *   Generate "Character Certificate".
*   **ID Cards (Planned):** Generate printable Student ID cards with QR codes.

### 🔹 Module: Fee Management (The Cash Flow)
*   **Fee Structures:** Create templates (e.g., "Grade 1 Monthly Fee = 5000").
*   **Vouchers:**
    *   **Bulk Generation:** Create vouchers for the whole school in 1 click.
    *   **Ad-hoc Vouchers:** Create a single voucher for a fine or specific charge.
*   **Collection:**
    *   **Manual:** Mark voucher as "Paid via Cash" at the counter.
    *   **Online Verification:** Approve bank transfer screenshots uploaded by parents.
*   **Defaulters:** One-click report of students with outstanding dues > 30 days.

### 🔹 Module: Examinations
*   **Exam Term Setup:** Define terms (Mid-Term, Final-Term).
*   **Date Sheet:** Publish exam dates for students.
*   **Grading:**
    *   Lock results (prevent teachers from changing marks).
    *   Publish results (make visible to parents).
*   **Report Cards:** Generate detailed mark sheets with positions in class.

### 🔹 Module: Library
*   **Inventory:** Add books (ISBN, Title, Author, Qty).
*   **Issue/Return:** Assign a book to a student/teacher and track due dates.
*   **Fines:** Auto-calculate fines for late returns.

---

## 👨‍🏫 TEACHER (The Educator)
**Authority:** Limited to their assigned Classes and Sections.

### 🔹 Module: Classroom Management
*   **Take Attendance:**
    *   Mark students (Present, Absent, Late, Leave).
    *   Submit attendance to lock it.
*   **Digital Diary:**
    *   Assign homework (Needs Text + Attachment support).
    *   Select specific subjects (e.g., "Math Homework").
*   **Student Behavior:** (Planned) Log positive/negative incidents for students.

### 🔹 Module: Academics & Results
*   **Enter Marks:** Input obtained marks for exams and monthly tests.
*   **View Results:** See the consolidated result sheet for their class.
*   **Syllabus:** Download the academic plan uploaded by Admin.

### 🔹 Module: Self-Service (Employee)
*   **Self-Attendance:**
    *   **Geo-Fencing:** Check-in only when physically inside school boundaries (`ATTENDANCE_RADIUS_METERS`).
    *   **QR Scan:** Scan a code at reception to mark presence.
*   **Leave Application:** Apply for causal/sick leave online.
*   **Salary Slip:** Download monthly payslip PDF.
*   **My Timetable:** View personal weekly teaching schedule.

---

## 👨‍👩‍👧‍👦 PARENT (The Guardian)
**Authority:** Read-only for assigned children, Write for Payments/Requests.

### 🔹 Module: Dashboard & Insights
*   **Sibling Support:** One login for all children. Switch profiles instantly.
*   **Notice Board:** View circulars (Holidays, Events, Exam Dates).

### 🔹 Module: Financials (Fees)
*   **Voucher List:** See "Unpaid" and "Paid" vouchers.
*   **Pay Online:**
    *   Select a voucher.
    *   Upload a screenshot of the bank transfer/EasyPaisa transaction.
    *   Add a transaction reference number.
*   **Ledger:** View detailed history of all payments made to date.

### 🔹 Module: Academic Tracking
*   **Attendance View:** Calendar view showing Absents/Lates.
*   **Result Cards:** Download finalized report cards (PDF).
*   **Diary/Homework:** Check what work the child has for today.
*   **Time Table:** View the child's class schedule.

### 🔹 Module: Communication
*   **Leave Request:** Send a "Sick Leave" request to the class teacher/admin.
*   **Notifications:** Receive Push/Email alerts for:
    *   Child Absent
    *   Fee Overdue
    *   Exam Result Announced

---

## 🎓 STUDENT (The Learner)
**Authority:** Personal Read-only Access.

### 🔹 Module: My Profile
*   **Timetable:** "Where do I need to be right now?"
*   **Attendance:** "What is my attendance percentage?"
*   **Diary:** "What is my homework?"

### 🔹 Module: Learning Management (LMS)
*   **Assignments:**
    *   View teacher-uploaded assignments.
    *   **Submit Solution:** Upload a file/photo of completed work (if enabled).
*   **Library:**
    *   Search for books in the school library.
    *   See "My Issued Books" and due dates.

### 🔹 Module: Results & Fees
*   **Result Card:** View/Print own marksheet.
*   **Fee Challan:** Download the fee voucher to take to the bank.

---

## 💼 STAFF (Non-Teaching)
**Authority:** Basic/Task-Specific.

### 🔹 Module: Self-Service
*   **Attendance:** Mark self-attendance (Check-in/Check-out).
*   **Salary:** View own salary slip.
*   **Leaves:** Apply for leave.

### 🔹 Module: Admin Assist (Permission Based)
*   **Gatekeeper:** Can be given access to "Scan Student QR" to mark entry/exit.
*   **Accountant:** Can be given restricted access to "Fee Collection" module only.
*   **Librarian:** Can be given access to "Inventory" and "Issue/Return" only.

---

## ⚙️ Technical Features
*   **Audit Logging:** Tracks who created/deleted records.
*   **Data Export:** Export detailed reports (Fees, Attendance, Results) to Excel/PDF.
*   **Backup:** Automated database backups (via MongoDB Atlas).
*   **Security:**
    *   Password Encryption (Bcrypt).
    *   Route Protection (Middleware checks for Token + Role).
    *   Input Validation (Mongoose Schema validation).

This document outlines the **complete functional scope** of the application as it stands in the codebase.
