import connectDB from '@/lib/database';
import { asyncHandler, successResponse, errorResponse } from '@/backend/middleware/response';
import { authenticate } from '@/backend/middleware/auth';

export const GET = asyncHandler(async (request) => {
  const auth = await authenticate(request);
  
  if (auth.error) {
    return errorResponse(auth.message, auth.status);
  }

  await connectDB();

  // Sample dashboard data
  const dashboardData = {
    stats: {
      totalStudents: 1234,
      totalTeachers: 89,
      totalClasses: 45,
      totalRevenue: 52340,
    },
    recentActivities: [
      {
        id: 1,
        type: 'enrollment',
        message: 'New student enrolled',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: 'attendance',
        message: 'Attendance marked for Class 10A',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ],
    upcomingEvents: [
      {
        id: 1,
        title: 'Annual Sports Day',
        date: '2025-12-15',
        location: 'Main Campus Ground',
      },
      {
        id: 2,
        title: 'Parent-Teacher Meeting',
        date: '2025-12-20',
        location: 'All Branches',
      },
    ],
  };

  return successResponse(dashboardData, 'Dashboard data fetched successfully');
});
