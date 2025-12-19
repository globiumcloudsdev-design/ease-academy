import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import User from '@/backend/models/User';
import dbConnect from '@/lib/database';

async function handler(request) {
  try {
    await dbConnect();

    // Get all branches
    const branches = await Branch.find({});
    const activeBranches = branches.filter(b => b.status === 'active').length;
    const inactiveBranches = branches.filter(b => b.status === 'inactive').length;

    // Get all users
    const users = await User.find({});
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    const parents = users.filter(u => u.role === 'parent');
    const admins = users.filter(u => u.role === 'branch-admin' || u.role === 'super-admin');

    // Calculate growth (mock data for now - you can implement real calculation)
    const branchGrowth = activeBranches > 0 ? 12.5 : 0;
    const studentGrowth = students.length > 0 ? 8.3 : 0;

    // Header Statistics
    const headerStats = {
      totalBranches: branches.length,
      activeBranches,
      inactiveBranches,
      branchGrowth,
      totalStudents: students.length,
      studentGrowth,
      totalRevenue: 1250000, // TODO: Calculate from fee collection
      revenueChange: 15.2,
      systemUptime: 99.8,
      activeSessions: users.filter(u => u.lastLogin && 
        (new Date() - new Date(u.lastLogin)) < 24 * 60 * 60 * 1000).length,
      peakSessions: Math.floor(users.length * 0.6),
      sessionChange: 5.7,
      feeCollectionRate: 78, // TODO: Calculate from actual fee data
      collectedAmount: 980000,
      collectionChange: 3.2,
    };

    // Performance Metrics
    const performanceMetrics = {
      monthlyRevenue: 450000,
      revenueGrowth: 15.2,
      collectionEfficiency: 78,
      efficiencyChange: 3.2,
      outstandingAmount: 125000,
      outstandingChange: -5.1,
      avgAttendance: 92,
      attendanceChange: 2.1,
      passPercentage: 87,
      passChange: 4.3,
      activeStudents: students.length,
      studentChange: studentGrowth,
      apiResponseTime: 145,
      responseChange: -12.5,
      systemUptime: 99.8,
      activeUsers: users.length,
      userChange: 5.7,
      dailyActiveUsers: Math.floor(users.length * 0.4),
      dauChange: 7.2,
      loginSuccessRate: 98.5,
      loginChange: 0.8,
      avgSessionDuration: 24,
      sessionChange: -3.1,
    };

    // Revenue Analytics
    const now = new Date();
    const revenueAnalytics = {
      revenueTrend: [
        { month: 'Jul', revenue: 45000, target: 50000 },
        { month: 'Aug', revenue: 52000, target: 50000 },
        { month: 'Sep', revenue: 48000, target: 55000 },
        { month: 'Oct', revenue: 61000, target: 60000 },
        { month: 'Nov', revenue: 55000, target: 60000 },
        { month: 'Dec', revenue: 67000, target: 65000 },
      ],
      branchRevenue: branches.slice(0, 4).map(branch => ({
        branch: branch.name,
        revenue: Math.floor(Math.random() * 50000) + 75000,
      })),
      collectionData: [
        { name: 'Collected', value: 780000, percentage: 78 },
        { name: 'Outstanding', value: 220000, percentage: 22 },
      ],
      paymentMethods: [
        { name: 'Online', value: 45 },
        { name: 'Cash', value: 30 },
        { name: 'Cheque', value: 15 },
        { name: 'Bank Transfer', value: 10 },
      ],
    };

    // Student Analytics
    const studentAnalytics = {
      enrollmentTrend: [
        { month: 'Jul', students: Math.max(1200, students.length - 150), new: 50 },
        { month: 'Aug', students: Math.max(1235, students.length - 120), new: 35 },
        { month: 'Sep', students: Math.max(1278, students.length - 90), new: 43 },
        { month: 'Oct', students: Math.max(1305, students.length - 60), new: 27 },
        { month: 'Nov', students: Math.max(1342, students.length - 30), new: 37 },
        { month: 'Dec', students: students.length, new: 47 },
      ],
      branchDistribution: branches.slice(0, 4).map((branch, idx) => ({
        branch: branch.name,
        students: Math.floor(students.length * [0.32, 0.27, 0.23, 0.18][idx] || 0.1),
        percentage: [32, 27, 23, 18][idx] || 10,
      })),
      gradeEnrollment: [
        { grade: 'Grade 1', students: Math.floor(students.length * 0.12) },
        { grade: 'Grade 2', students: Math.floor(students.length * 0.11) },
        { grade: 'Grade 3', students: Math.floor(students.length * 0.10) },
        { grade: 'Grade 4', students: Math.floor(students.length * 0.12) },
        { grade: 'Grade 5', students: Math.floor(students.length * 0.11) },
        { grade: 'Grade 6', students: Math.floor(students.length * 0.11) },
        { grade: 'Grade 7', students: Math.floor(students.length * 0.10) },
        { grade: 'Grade 8', students: Math.floor(students.length * 0.11) },
      ],
      attendanceTrend: [
        { month: 'Jul', rate: 92 },
        { month: 'Aug', rate: 94 },
        { month: 'Sep', rate: 91 },
        { month: 'Oct', rate: 95 },
        { month: 'Nov', rate: 93 },
        { month: 'Dec', rate: 96 },
      ],
    };

    // Recent Activities
    const recentActivities = users.slice(0, 10).map((user, idx) => ({
      id: idx + 1,
      type: ['user_created', 'branch_updated', 'fee_collected', 'settings_changed'][idx % 4],
      user: user.name || 'System User',
      action: ['created a new account', 'updated profile', 'made a payment', 'changed settings'][idx % 4],
      target: branches[idx % branches.length]?.name || 'System',
      timestamp: new Date(Date.now() - (idx + 1) * 5 * 60 * 1000),
      branch: branches[idx % branches.length]?.name || 'Main Campus',
    }));

    // System Alerts
    const systemAlerts = [
      {
        id: 1,
        priority: 'high',
        category: 'System',
        title: 'Server Load Notice',
        message: activeBranches > 3 ? 'Multiple branches active - monitor system resources' : 'System running normally',
        timestamp: new Date(),
        actionRequired: activeBranches > 5,
      },
      {
        id: 2,
        priority: students.length < 100 ? 'medium' : 'low',
        category: 'Academic',
        title: 'Student Enrollment',
        message: `Total ${students.length} students enrolled across all branches`,
        timestamp: new Date(),
        actionRequired: false,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        headerStats,
        performanceMetrics,
        revenueAnalytics,
        studentAnalytics,
        recentActivities,
        systemAlerts,
        summary: {
          totalBranches: branches.length,
          totalUsers: users.length,
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalParents: parents.length,
          totalAdmins: admins.length,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
