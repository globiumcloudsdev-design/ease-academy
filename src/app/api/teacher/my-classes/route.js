import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth'; // Middleware Import
import Timetable from '@/backend/models/Timetable';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Class from '@/backend/models/Class';
import Branch from '@/backend/models/Branch';
import Subject from '@/backend/models/Subject';

// Main Handler Function
const getMyClasses = async (req, user, userDoc) => {
  try {
    // Note: connectDB() middleware pehle hi kar chuka hai

    console.log("---------------- API HIT (SECURE) ----------------");
    console.log("Logged In Teacher:", user.fullName);

    // 1. Teacher ID ab direct User Document se milegi (Auth Middleware se)
    const teacherObjectId = userDoc._id;

    console.log("Searching Timetable for Teacher ID:", teacherObjectId);

    // 2. Query: Check karo k ye teacher kahan kahan periods me hai
    // Hum userDoc._id use kr rhy hain jo already ObjectId hai, convert krny ki zaroorat nahi
    const timetables = await Timetable.find({
      'periods.teacherId': teacherObjectId
    })
    .populate('classId', 'name code grade')
    .populate('periods.subjectId', 'name code');

    console.log("Timetables Found:", timetables.length);

    // 3. Data Formatting (Duplicates hatana)
    const dashboardData = [];
    const uniqueMap = new Set();

    timetables.forEach((tt) => {
      // Agar classId populate nahi hui (null hai), to skip kro
      if (!tt.classId) return;

      tt.periods.forEach((period) => {
        // Teacher Match check
        // Yahan hum ObjectId compare kr rhy hain, is liye .equals() ya string conversion use kren
        if (period.teacherId && period.teacherId.toString() === teacherObjectId.toString()) {
          
          // Unique Key: ClassID + Section + SubjectID
          const key = `${tt.classId._id}-${tt.section}-${period.subjectId?._id}`;

          if (!uniqueMap.has(key)) {
            dashboardData.push({
              classId: tt.classId._id,
              className: tt.classId.name,   // e.g. Class 3
              section: tt.section,          // e.g. A
              subjectId: period.subjectId?._id,
              subjectName: period.subjectId?.name || "Unknown Subject",
              timetableId: tt._id,
            });
            uniqueMap.add(key);
          }
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      count: dashboardData.length, 
      data: dashboardData 
    });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

// Export with Auth Protection
// Sirf 'teacher', 'branch_admin', 'super_admin' hi access kar sakty hain
export const GET = withAuth(getMyClasses, [requireRole(['teacher', 'branch_admin', 'super_admin'])]);