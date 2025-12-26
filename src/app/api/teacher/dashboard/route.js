import connectDB from '@/lib/database';
import { asyncHandler, successResponse, errorResponse } from '@/backend/middleware/response';
import { authenticate } from '@/backend/middleware/auth';

export const GET = asyncHandler(async (request) => {
  const auth = await authenticate(request);
  
  if (auth.error) {
    return errorResponse(auth.message, auth.status);
  }

  await connectDB();

  // Sample teacher dashboard data
  const dashboardData = {
    stats: {
      totalClasses: 5,
      totalStudents: 145,
      pendingAssignments: 12,
      upcomingExams: 3,
    },
    myClasses: [
      { id: 1, name: 'Class 10A', subject: 'eng', students: 35 },
      { id: 2, name: 'Class 10B', subject: 'Mathematics', students: 32 },
      { id: 3, name: 'Class 9A', subject: 'Mathematics', students: 40 },
    ],
    todaySchedule: [
      { time: '08:00 AM', class: 'Class 10A', subject: 'Mathematics' },
      { time: '10:00 AM', class: 'Class 10B', subject: 'Mathematics' },
      { time: '02:00 PM', class: 'Class 9A', subject: 'Mathematics' },
    ],
  };

  return successResponse(dashboardData, 'Teacher dashboard data fetched successfully');
});
