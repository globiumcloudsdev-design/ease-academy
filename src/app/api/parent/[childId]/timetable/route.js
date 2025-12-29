import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Timetable from '@/backend/models/Timetable';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import { uploadToCloudinary } from '@/lib/cloudinary';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    // Verify parent owns child
    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Get child's class information
    const child = await User.findById(childId).lean();
    if (!child || !child.studentProfile?.classId) {
      return NextResponse.json({ success: true, timetable: null, message: 'Child or class not found' });
    }

    // Fetch active timetable for the child's class
    const timetable = await Timetable.findOne({
      classId: child.studentProfile.classId,
      status: 'active'
    })
    .populate('periods.subjectId', 'name code')
    .populate('periods.teacherId', 'fullName firstName lastName profilePhoto')
    .lean();

    if (!timetable) {
      return NextResponse.json({ success: true, timetable: null, message: 'No active timetable found for this class' });
    }

    // Format the timetable data for the frontend
    const formattedTimetable = {
      id: timetable._id.toString(),
      name: timetable.name,
      academicYear: timetable.academicYear,
      effectiveFrom: timetable.effectiveFrom,
      timeSettings: timetable.timeSettings,
      periods: timetable.periods.map(period => ({
        id: period._id.toString(),
        periodNumber: period.periodNumber,
        day: period.day,
        startTime: period.startTime,
        endTime: period.endTime,
        periodType: period.periodType,
        roomNumber: period.roomNumber,
        notes: period.notes,
        subject: period.subjectId ? {
          id: period.subjectId._id.toString(),
          name: period.subjectId.name,
          code: period.subjectId.code
        } : null,
        teacher: period.teacherId ? {
          id: period.teacherId._id.toString(),
          name: period.teacherId.fullName || `${period.teacherId.firstName} ${period.teacherId.lastName}`.trim(),
          photo: period.teacherId.profilePhoto?.url
        } : null
      }))
    };

    return NextResponse.json({ 
      success: true, 
      timetable: formattedTimetable 
    });
  } catch (error) {
    console.error('Error fetching child timetable:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch timetable' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
