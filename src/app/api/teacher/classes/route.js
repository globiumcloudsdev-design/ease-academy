import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Timetable from '@/backend/models/Timetable';
import Class from '@/backend/models/Class';

const getTeacherClasses = async (req, user, userDoc) => {
  try {
    await connectDB();

    const teacherId = userDoc._id;

    // Find all timetables where this teacher has periods
    const timetables = await Timetable.find({
      'periods.teacherId': teacherId,
      status: 'active'
    }).populate('classId', 'name code grade sections');

    // Extract unique classes
    const classesMap = new Map();
    timetables.forEach(tt => {
      if (tt.classId && !classesMap.has(tt.classId._id.toString())) {
        classesMap.set(tt.classId._id.toString(), {
          _id: tt.classId._id,
          name: tt.classId.name,
          code: tt.classId.code,
          grade: tt.classId.grade,
          sections: tt.classId.sections
        });
      }
    });

    const classes = Array.from(classesMap.values());

    return NextResponse.json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch classes' }, { status: 500 });
  }
};

export const GET = withAuth(getTeacherClasses, [requireRole(['teacher', 'branch_admin', 'super_admin'])]);
