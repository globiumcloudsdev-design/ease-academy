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
    await connectDB();
    
    // console.log("---------------- API HIT (SECURE) ----------------");
    // console.log("Logged In Teacher:", user.fullName);

    // 1. Teacher ID ab direct User Document se milegi (Auth Middleware se)
    const teacherObjectId = userDoc._id;

    // console.log("Searching Timetable for Teacher ID:", teacherObjectId);

    // 2. Query: Active timetables fetch karo jahan ye teacher hai
    const timetables = await Timetable.find({
      'periods.teacherId': teacherObjectId,
      status: 'active' // Only active timetables
    })
    .populate('classId', 'name code grade sections')
    .populate('branchId', 'name code')
    .populate('periods.subjectId')
    .lean();

    // console.log("Timetables Found:", timetables);

    // 3. Data Formatting with complete schedule info
    const classesMap = new Map();

    timetables.forEach((tt) => {
      if (!tt.classId) return;

      tt.periods.forEach((period) => {
        // Teacher Match check
        if (period.teacherId && period.teacherId.toString() === teacherObjectId.toString()) {
          
          // Unique Key: ClassID + Section + SubjectID
          const key = `${tt.classId._id}-${tt.section || ''}-${period.subjectId?._id || ''}`;

          if (!classesMap.has(key)) {
            classesMap.set(key, {
              _id: key, // Use unique key as ID instead of timetable ID
              classId: tt.classId._id,
              name: `${tt.classId.name}${tt.section ? ` - Section ${tt.section}` : ''}`,
              code: tt.classId.code,
              className: tt.classId.name,
              section: tt.section || '',
              subjectId: period.subjectId?._id,
              subjectName: period.subjectId?.name || "Unknown Subject",
              branchName: tt.branchId?.name || '',
              timetableId: tt._id,
              academicYear: tt.academicYear,
              schedule: [],
              studentCount: 0,
              attendanceRate: null,
            });
          }

          // Add period to schedule if it's for this teacher
          const classData = classesMap.get(key);
          classData.schedule.push({
            day: period.day,
            startTime: period.startTime,
            endTime: period.endTime,
            periodNumber: period.periodNumber,
            periodType: period.periodType,
            roomNumber: period.roomNumber || '',
            subjectName: period.subjectId?.name || "Unknown Subject",
            subjectId: period.subjectId?._id,
          });
        }
      });
    });

    // 4. Convert map to array and get student details
    const dashboardData = await Promise.all(
      Array.from(classesMap.values()).map(async (classData) => {
        // Get student details for this class/section
        const students = await User.find({
          role: 'student',
          'studentProfile.classId': classData.classId,
          ...(classData.section ? { 'studentProfile.section': classData.section } : {}),
        })
        .select('firstName lastName fullName email phone profilePhoto studentProfile.rollNumber studentProfile.registrationNumber studentProfile.father studentProfile.mother studentProfile.guardian studentProfile.guardianType')
        .sort({ 'studentProfile.rollNumber': 1 });

        // Sort schedule by day and time
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        classData.schedule.sort((a, b) => {
          const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
          if (dayDiff !== 0) return dayDiff;
          return a.startTime.localeCompare(b.startTime);
        });

        // Calculate next class
        const nextClass = getNextClass(classData.schedule);

        return {
          ...classData,
          studentCount: students.length,
          students: students.map(student => {
            // Determine guardian information based on guardianType
            let guardianInfo = null;
            if (student.studentProfile?.guardianType === 'guardian' && student.studentProfile?.guardian) {
              guardianInfo = {
                name: student.studentProfile.guardian.name,
                relation: student.studentProfile.guardian.relation || 'Guardian',
                phone: student.studentProfile.guardian.phone,
                email: student.studentProfile.guardian.email,
                cnic: student.studentProfile.guardian.cnic,
              };
            } else if (student.studentProfile?.father) {
              guardianInfo = {
                name: student.studentProfile.father.name,
                relation: 'Father',
                phone: student.studentProfile.father.phone,
                email: student.studentProfile.father.email,
                cnic: student.studentProfile.father.cnic,
              };
            } else if (student.studentProfile?.mother) {
              guardianInfo = {
                name: student.studentProfile.mother.name,
                relation: 'Mother',
                phone: student.studentProfile.mother.phone,
                email: student.studentProfile.mother.email,
                cnic: student.studentProfile.mother.cnic,
              };
            }

            return {
              _id: student._id,
              name: student.fullName || `${student.firstName} ${student.lastName}`,
              rollNumber: student.studentProfile?.rollNumber,
              registrationNumber: student.studentProfile?.registrationNumber,
              email: student.email,
              phone: student.phone,
              profilePhoto: student.profilePhoto,
              guardian: guardianInfo,
            };
          }),
          nextClass,
        };
      })
    );

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

// Helper function to calculate next class
function getNextClass(schedule) {
  if (!schedule || schedule.length === 0) return null;

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDayIndex = dayOrder.indexOf(currentDay);

  // Check for class today
  const todayClasses = schedule.filter(s => s.day === currentDay);
  for (const cls of todayClasses) {
    const [hour, min] = cls.startTime.split(':').map(Number);
    const classTime = hour * 60 + min;
    
    if (classTime > currentTime) {
      return `Today at ${cls.startTime}`;
    }
    
    // Check if class is running now
    const [endHour, endMin] = cls.endTime.split(':').map(Number);
    const endTime = endHour * 60 + endMin;
    if (currentTime >= classTime && currentTime <= endTime) {
      return 'Now';
    }
  }

  // Check upcoming days
  for (let i = 1; i < 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = dayOrder[nextDayIndex];
    const nextDayClasses = schedule.filter(s => s.day === nextDay);
    
    if (nextDayClasses.length > 0) {
      const firstClass = nextDayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
      return `${nextDay} at ${firstClass.startTime}`;
    }
  }

  return null;
}

// Export with Auth Protection
// Sirf 'teacher', 'branch_admin', 'super_admin' hi access kar sakty hain
export const GET = withAuth(getMyClasses, [requireRole(['teacher', 'branch_admin', 'super_admin'])]);