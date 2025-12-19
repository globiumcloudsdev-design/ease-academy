import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import Event from '@/backend/models/Event';

async function getDashboard(request, authenticatedUser, userDoc) {
  try {
    // Check if user is branch admin
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Branch admin role required.' },
        { status: 403 }
      );
    }

    // Check if branch admin has a branch assigned
    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned to this admin.' },
        { status: 400 }
      );
    }

    await connectDB();

    const branchId = authenticatedUser.branchId;

    // Get dashboard statistics
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalClasses,
      totalSubjects,
      recentEvents,
      studentsThisMonth,
      teachersThisMonth,
    ] = await Promise.all([
      // Total students in branch
      User.countDocuments({ role: 'student', branchId }),
      
      // Active students
      User.countDocuments({ role: 'student', branchId, status: 'active' }),
      
      // Total teachers in branch
      User.countDocuments({ role: 'teacher', branchId }),
      
      // Active teachers
      User.countDocuments({ role: 'teacher', branchId, status: 'active' }),
      
      // Total classes
      Class.countDocuments({ branchId }),
      
      // Total subjects
      Subject.countDocuments({ classId: { $exists: true } }),
      
      // Recent events (next 7 days)
      Event.find({
        $or: [{ branchId }, { branchId: null }],
        startDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        status: { $in: ['scheduled', 'ongoing'] },
      })
        .sort({ startDate: 1 })
        .limit(5)
        .lean(),
      
      // Students added this month
      User.countDocuments({
        role: 'student',
        branchId,
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
      
      // Teachers added this month
      User.countDocuments({
        role: 'teacher',
        branchId,
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
    ]);

    // Get class-wise student distribution
    const classDistribution = await Class.aggregate([
      { $match: { branchId: branchId } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'studentProfile.classId',
          as: 'students',
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          studentCount: { $size: '$students' },
        },
      },
      { $sort: { name: 1 } },
    ]);

    // Calculate growth percentages (dummy for now, can be improved)
    const studentGrowth = studentsThisMonth > 0 ? Math.round((studentsThisMonth / totalStudents) * 100) : 0;
    const teacherGrowth = teachersThisMonth > 0 ? Math.round((teachersThisMonth / totalTeachers) * 100) : 0;

    const dashboardData = {
      stats: {
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
          thisMonth: studentsThisMonth,
          growth: studentGrowth,
        },
        teachers: {
          total: totalTeachers,
          active: activeTeachers,
          inactive: totalTeachers - activeTeachers,
          thisMonth: teachersThisMonth,
          growth: teacherGrowth,
        },
        classes: {
          total: totalClasses,
        },
        subjects: {
          total: totalSubjects,
        },
      },
      classDistribution,
      upcomingEvents: recentEvents,
      branchInfo: {
        branchId: authenticatedUser.branchId,
        branchName: authenticatedUser.branchName || 'My Branch',
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully',
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboard);
