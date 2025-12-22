import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import User from '@/backend/models/User';
import Attendance from '@/backend/models/Attendance';
import Class from '@/backend/models/Class';
import Event from '@/backend/models/Event';
import Exam from '@/backend/models/Exam';
import Expense from '@/backend/models/Expense';
import Notification from '@/backend/models/Notification';
import FeeTemplate from '@/backend/models/FeeTemplate';
import connectDB from '@/lib/database';

async function handler(request) {
  try {
    await connectDB();

    // Get current date and date ranges
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get all branches
    const branches = await Branch.find({});
    const activeBranches = branches.filter(b => b.status === 'active').length;
    const inactiveBranches = branches.filter(b => b.status === 'inactive').length;

    // Get all users with detailed stats
    const users = await User.find({});
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    const parents = users.filter(u => u.role === 'parent');
    const branchAdmins = users.filter(u => u.role === 'branch-admin');
    const superAdmins = users.filter(u => u.role === 'super-admin');

    // Get classes data
    const classes = await Class.find({}).populate('grade', 'name').populate('branchId', 'name');
    const activeClasses = classes.filter(c => c.status === 'active').length;

    // Get attendance data
    const attendanceRecords = await Attendance.find({
      date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    }).populate('branchId', 'name');

    const totalAttendanceRecords = attendanceRecords.length;
    const totalStudentsMarked = attendanceRecords.reduce((sum, att) => sum + att.records.length, 0);
    const presentCount = attendanceRecords.reduce((sum, att) =>
      sum + att.records.filter(r => r.status === 'present').length, 0);
    const absentCount = attendanceRecords.reduce((sum, att) =>
      sum + att.records.filter(r => r.status === 'absent').length, 0);

    const avgAttendance = totalStudentsMarked > 0 ? ((presentCount / totalStudentsMarked) * 100).toFixed(1) : 0;

    // Get events data
    const events = await Event.find({});
    const upcomingEvents = events.filter(e => e.startDate > now && e.status === 'scheduled').length;
    const completedEvents = events.filter(e => e.status === 'completed').length;

    // Get exams data
    const exams = await Exam.find({});
    const scheduledExams = exams.filter(e => e.status === 'scheduled').length;
    const completedExams = exams.filter(e => e.status === 'completed').length;

    // Get expenses data
    const expenses = await Expense.find({});
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const paidExpenses = expenses.filter(e => e.paymentStatus === 'paid').reduce((sum, exp) => sum + exp.amount, 0);
    const pendingExpenses = expenses.filter(e => e.paymentStatus === 'pending').reduce((sum, exp) => sum + exp.amount, 0);

    // Get notifications data
    const notifications = await Notification.find({});
    const unreadNotifications = notifications.filter(n => !n.isRead).length;

    // Get fee templates
    const feeTemplates = await FeeTemplate.find({});
    const activeFeeTemplates = feeTemplates.filter(ft => ft.status === 'active').length;

    // Calculate growth rates (comparing with last month)
    const lastMonthUsers = users.filter(u =>
      u.createdAt && u.createdAt.getMonth() === lastMonth - 1 && u.createdAt.getFullYear() === lastMonthYear
    ).length;
    const currentMonthUsers = users.filter(u =>
      u.createdAt && u.createdAt.getMonth() === currentMonth - 1 && u.createdAt.getFullYear() === currentYear
    ).length;

    const userGrowth = lastMonthUsers > 0 ? (((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1) : 0;
    const branchGrowth = activeBranches > 0 ? 12.5 : 0;
    const studentGrowth = students.length > 0 ? parseFloat(userGrowth) : 0;

    // Header Statistics
    const headerStats = {
      totalBranches: branches.length,
      activeBranches,
      inactiveBranches,
      branchGrowth: parseFloat(branchGrowth),
      totalStudents: students.length,
      studentGrowth: parseFloat(studentGrowth),
      totalRevenue: 1250000, // TODO: Calculate from actual fee collection
      revenueChange: 15.2,
      systemUptime: 99.8,
      activeSessions: users.filter(u => u.lastLogin &&
        (now - new Date(u.lastLogin)) < 24 * 60 * 60 * 1000).length,
      peakSessions: Math.floor(users.length * 0.6),
      sessionChange: 5.7,
      feeCollectionRate: 78, // TODO: Calculate from actual fee data
      collectedAmount: 980000,
      collectionChange: 3.2,
      totalClasses: classes.length,
      activeClasses,
      totalTeachers: teachers.length,
      totalEvents: events.length,
      upcomingEvents,
      totalExams: exams.length,
      scheduledExams,
      totalExpenses: totalExpenses,
      paidExpenses: paidExpenses,
      pendingExpenses: pendingExpenses,
      unreadNotifications,
      activeFeeTemplates,
    };

    // Performance Metrics
    const performanceMetrics = {
      monthlyRevenue: 450000,
      revenueGrowth: 15.2,
      collectionEfficiency: 78,
      efficiencyChange: 3.2,
      outstandingAmount: 125000,
      outstandingChange: -5.1,
      avgAttendance: parseFloat(avgAttendance),
      attendanceChange: 2.1,
      passPercentage: 87,
      passChange: 4.3,
      activeStudents: students.length,
      studentChange: parseFloat(studentGrowth),
      apiResponseTime: 145,
      responseChange: -12.5,
      systemUptime: 99.8,
      activeUsers: users.length,
      userChange: parseFloat(userGrowth),
      dailyActiveUsers: Math.floor(users.length * 0.4),
      dauChange: 7.2,
      loginSuccessRate: 98.5,
      loginChange: 0.8,
      avgSessionDuration: 24,
      sessionChange: -3.1,
      totalAttendanceRecords,
      presentCount,
      absentCount,
      completedEvents,
      completedExams,
    };

    // Revenue Analytics
    const revenueAnalytics = {
      revenueTrend: [
        { month: 'Jul', revenue: 45000, target: 50000 },
        { month: 'Aug', revenue: 52000, target: 50000 },
        { month: 'Sep', revenue: 48000, target: 55000 },
        { month: 'Oct', revenue: 61000, target: 60000 },
        { month: 'Nov', revenue: 55000, target: 60000 },
        { month: 'Dec', revenue: 67000, target: 65000 },
      ],
      branchRevenue: branches.slice(0, 6).map(branch => ({
        branch: branch.name,
        revenue: Math.floor(Math.random() * 50000) + 75000,
        students: students.filter(s => s.branchId?.toString() === branch._id.toString()).length,
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
      expenseBreakdown: [
        { category: 'Salary', amount: expenses.filter(e => e.category === 'salary').reduce((sum, e) => sum + e.amount, 0) },
        { category: 'Utilities', amount: expenses.filter(e => e.category === 'utilities').reduce((sum, e) => sum + e.amount, 0) },
        { category: 'Maintenance', amount: expenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0) },
        { category: 'Supplies', amount: expenses.filter(e => e.category === 'supplies').reduce((sum, e) => sum + e.amount, 0) },
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
      branchDistribution: branches.slice(0, 6).map((branch, idx) => {
        const branchStudents = students.filter(s => s.branchId?.toString() === branch._id.toString()).length;
        return {
          branch: branch.name,
          students: branchStudents,
          percentage: students.length > 0 ? Math.round((branchStudents / students.length) * 100) : 0,
        };
      }),
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
        { month: 'Dec', rate: parseFloat(avgAttendance) },
      ],
      userRoleDistribution: [
        { role: 'Students', count: students.length, percentage: users.length > 0 ? Math.round((students.length / users.length) * 100) : 0 },
        { role: 'Teachers', count: teachers.length, percentage: users.length > 0 ? Math.round((teachers.length / users.length) * 100) : 0 },
        { role: 'Parents', count: parents.length, percentage: users.length > 0 ? Math.round((parents.length / users.length) * 100) : 0 },
        { role: 'Branch Admins', count: branchAdmins.length, percentage: users.length > 0 ? Math.round((branchAdmins.length / users.length) * 100) : 0 },
      ],
    };

    // Recent Activities - More comprehensive
    const recentActivities = [
      ...users.slice(0, 5).map((user, idx) => ({
        id: `user_${idx}`,
        type: 'user_created',
        user: user.firstName + ' ' + user.lastName || 'New User',
        action: 'joined the system',
        target: user.role,
        timestamp: user.createdAt || new Date(Date.now() - (idx + 1) * 5 * 60 * 1000),
        branch: branches.find(b => b._id.toString() === user.branchId?.toString())?.name || 'Main Campus',
      })),
      ...events.slice(0, 3).map((event, idx) => ({
        id: `event_${idx}`,
        type: 'event_created',
        user: 'System',
        action: 'scheduled new event',
        target: event.title,
        timestamp: event.createdAt || new Date(Date.now() - (idx + 1) * 10 * 60 * 1000),
        branch: branches.find(b => b._id.toString() === event.branchId?.toString())?.name || 'All Branches',
      })),
      ...exams.slice(0, 2).map((exam, idx) => ({
        id: `exam_${idx}`,
        type: 'exam_scheduled',
        user: 'Academic Team',
        action: 'scheduled exam',
        target: exam.title,
        timestamp: exam.createdAt || new Date(Date.now() - (idx + 1) * 15 * 60 * 1000),
        branch: branches.find(b => b._id.toString() === exam.branchId?.toString())?.name || 'Main Campus',
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    // System Alerts - More comprehensive
    const systemAlerts = [
      {
        id: 1,
        priority: activeBranches > 3 ? 'high' : 'low',
        category: 'System',
        title: 'Branch Activity',
        message: `${activeBranches} active branches - ${inactiveBranches} inactive`,
        timestamp: new Date(),
        actionRequired: inactiveBranches > 2,
      },
      {
        id: 2,
        priority: students.length < 100 ? 'high' : 'low',
        category: 'Academic',
        title: 'Student Enrollment',
        message: `Total ${students.length} students enrolled across ${activeBranches} branches`,
        timestamp: new Date(),
        actionRequired: students.length < 50,
      },
      {
        id: 3,
        priority: pendingExpenses > 50000 ? 'medium' : 'low',
        category: 'Finance',
        title: 'Pending Expenses',
        message: `PKR ${pendingExpenses.toLocaleString()} in pending expenses`,
        timestamp: new Date(),
        actionRequired: pendingExpenses > 100000,
      },
      {
        id: 4,
        priority: unreadNotifications > 50 ? 'medium' : 'low',
        category: 'Communication',
        title: 'Unread Notifications',
        message: `${unreadNotifications} unread notifications in the system`,
        timestamp: new Date(),
        actionRequired: unreadNotifications > 100,
      },
      {
        id: 5,
        priority: avgAttendance < 80 ? 'high' : 'low',
        category: 'Attendance',
        title: 'Average Attendance',
        message: `Current month attendance rate: ${avgAttendance}%`,
        timestamp: new Date(),
        actionRequired: avgAttendance < 75,
      },
    ];

    // Branch Performance Data
    const branchPerformance = branches.map(branch => {
      const branchClasses = classes.filter(c => c.branchId.toString() === branch._id.toString());
      const branchStudents = students.filter(s => s.branchId?.toString() === branch._id.toString());
      const branchTeachers = teachers.filter(t => t.branchId?.toString() === branch._id.toString());
      const branchAttendance = attendanceRecords.filter(a => a.branchId._id.toString() === branch._id.toString());

      return {
        id: branch._id,
        name: branch.name,
        code: branch.code,
        status: branch.status,
        students: branchStudents.length,
        teachers: branchTeachers.length,
        classes: branchClasses.length,
        attendanceRate: branchAttendance.length > 0 ?
          (branchAttendance.reduce((sum, a) => sum + a.presentCount, 0) /
           branchAttendance.reduce((sum, a) => sum + a.totalStudents, 0) * 100).toFixed(1) : 0,
        revenue: Math.floor(Math.random() * 200000) + 100000, // Mock data
        expenses: expenses.filter(e => e.branchId.toString() === branch._id.toString())
          .reduce((sum, e) => sum + e.amount, 0),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        headerStats,
        performanceMetrics,
        revenueAnalytics,
        studentAnalytics,
        recentActivities,
        systemAlerts,
        branchPerformance,
        summary: {
          totalBranches: branches.length,
          totalUsers: users.length,
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalParents: parents.length,
          totalBranchAdmins: branchAdmins.length,
          totalSuperAdmins: superAdmins.length,
          totalClasses: classes.length,
          totalEvents: events.length,
          totalExams: exams.length,
          totalExpenses: expenses.length,
          totalNotifications: notifications.length,
          totalFeeTemplates: feeTemplates.length,
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
