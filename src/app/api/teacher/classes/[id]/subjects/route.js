import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Subject from '@/backend/models/Subject';
import User from '@/backend/models/User';
import Timetable from '@/backend/models/Timetable';

const getClassSubjects = async (req, user, userDoc, context) => {
  try {
    await connectDB();
    const { id } = await context.params;
    const teacherId = userDoc._id;

    // Find all timetables for this class where this teacher has periods
    const timetables = await Timetable.find({
      classId: id,
      'periods.teacherId': teacherId,
      status: 'active'
    }).populate('periods.subjectId', 'name code');

    // Extract unique subjects for this teacher in this class
    const subjectsMap = new Map();
    timetables.forEach(tt => {
      tt.periods.forEach(period => {
        if (period.teacherId?.toString() === teacherId.toString() && period.subjectId) {
          const sub = period.subjectId;
          if (!subjectsMap.has(sub._id.toString())) {
            subjectsMap.set(sub._id.toString(), {
              _id: sub._id,
              name: sub.name,
              code: sub.code
            });
          }
        }
      });
    });

    const subjects = Array.from(subjectsMap.values());

    // If no subjects found in timetable, maybe return all subjects for the class if user is admin
    if (subjects.length === 0 && userDoc.role !== 'teacher') {
        const allSubjects = await Subject.find({ classId: id }).select('name code');
        return NextResponse.json({ success: true, data: allSubjects });
    }

    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Error fetching class subjects:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch subjects' }, { status: 500 });
  }
};

export const GET = withAuth(getClassSubjects, [requireRole(['teacher', 'branch_admin', 'super_admin'])]);
