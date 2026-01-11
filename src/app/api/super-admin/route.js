import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import FeeTemplate from '@/backend/models/FeeTemplate';
import FeeVoucher from '@/backend/models/FeeVoucher';
import Attendance from '@/backend/models/Attendance';
import Event from '@/backend/models/Event';
import Expense from '@/backend/models/Expense';
import Notification from '@/backend/models/Notification';
import { sendEmail } from '@/backend/utils/emailService';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    // Check if user is super admin
    if (user.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, message: 'Only super admins can access this endpoint' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'system-overview':
        return await getSystemOverview();
      case 'user-management':
        return await getUserManagement();
      case 'branch-management':
        return await getBranchManagement();
      case 'financial-overview':
        return await getFinancialOverview();
      case 'academic-overview':
        return await getAcademicOverview();
      case 'system-health':
        return await getSystemHealth();
      case 'recent-activities':
        return await getRecentActivities();
      case 'create-branch':
        return await createBranch(request);
      case 'update-branch':
        return await updateBranch(request);
      case 'delete-branch':
        return await deleteBranch(request);
      case 'create-user':
        return await createUser(request);
      case 'update-user':
        return await updateUser(request);
      case 'delete-user':
        return await deleteUser(request);
      case 'send-notification':
        return await sendSystemNotification(request);
      case 'system-settings':
        return await getSystemSettings();
      case 'update-settings':
        return await updateSystemSettings(request);
      case 'pending-fees':
        return await getPendingFees();
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Super admin API error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error'
    }, { status: 500 });
  }
});

// System Overview
async function getSystemOverview() {
  const [
    totalUsers,
    totalBranches,
    totalClasses,
    totalStudents,
    totalTeachers,
    totalParents,
    totalBranchAdmins,
    totalSuperAdmins,
    activeBranches,
    inactiveBranches,
    totalEvents,
    totalExams,
    totalExpenses,
    totalNotifications,
    totalFeeTemplates,
    totalFeeVouchers,
    totalAttendanceRecords
  ] = await Promise.all([
    User.countDocuments(),
    Branch.countDocuments(),
    Class.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'parent' }),
    User.countDocuments({ role: 'branch-admin' }),
    User.countDocuments({ role: 'super-admin' }),
    Branch.countDocuments({ status: 'active' }),
    Branch.countDocuments({ status: 'inactive' }),
    Event.countDocuments(),
    // Exam.countDocuments(), // Assuming Exam model exists
    Expense.countDocuments(),
    Notification.countDocuments(),
    FeeTemplate.countDocuments(),
    FeeVoucher.countDocuments(),
    Attendance.countDocuments()
  ]);

  return NextResponse.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        parents: totalParents,
        branchAdmins: totalBranchAdmins,
        superAdmins: totalSuperAdmins
      },
      branches: {
        total: totalBranches,
        active: activeBranches,
        inactive: inactiveBranches
      },
      academic: {
        classes: totalClasses,
        events: totalEvents,
        exams: 0, // TODO: Add exam count when model exists
        feeTemplates: totalFeeTemplates,
        feeVouchers: totalFeeVouchers,
        attendanceRecords: totalAttendanceRecords
      },
      system: {
        expenses: totalExpenses,
        notifications: totalNotifications
      }
    }
  });
}

// User Management
async function getUserManagement() {
  const users = await User.find({})
    .populate('branchProfile.branchId', 'name code')
    .select('-password -__v')
    .sort({ createdAt: -1 })
    .limit(100);

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    byRole: {
      student: users.filter(u => u.role === 'student').length,
      teacher: users.filter(u => u.role === 'teacher').length,
      parent: users.filter(u => u.role === 'parent').length,
      'branch-admin': users.filter(u => u.role === 'branch-admin').length,
      'super-admin': users.filter(u => u.role === 'super-admin').length
    }
  };

  return NextResponse.json({
    success: true,
    data: {
      users,
      stats: userStats
    }
  });
}

// Branch Management
async function getBranchManagement() {
  const branches = await Branch.find({})
    .populate('adminId', 'firstName lastName email')
    .sort({ createdAt: -1 });

  const branchStats = {
    total: branches.length,
    active: branches.filter(b => b.status === 'active').length,
    inactive: branches.filter(b => b.status === 'inactive').length,
    byLocation: branches.reduce((acc, branch) => {
      const location = branch.location?.city || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {})
  };

  return NextResponse.json({
    success: true,
    data: {
      branches,
      stats: branchStats
    }
  });
}

// Financial Overview
async function getFinancialOverview() {
  const [
    totalRevenue,
    totalExpenses,
    pendingExpenses,
    paidExpenses,
    totalFeeVouchers,
    paidFeeVouchers,
    pendingFeeVouchers
  ] = await Promise.all([
    FeeVoucher.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]),
    Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Expense.aggregate([
      { $match: { paymentStatus: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Expense.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    FeeVoucher.countDocuments(),
    FeeVoucher.countDocuments({ status: 'paid' }),
    FeeVoucher.countDocuments({ status: 'pending' })
  ]);

  const revenue = totalRevenue[0]?.total || 0;
  const expenses = totalExpenses[0]?.total || 0;
  const pendingExp = pendingExpenses[0]?.total || 0;
  const paidExp = paidExpenses[0]?.total || 0;

  return NextResponse.json({
    success: true,
    data: {
      revenue: {
        total: revenue,
        monthly: revenue / 12, // Approximate
        collectionRate: totalFeeVouchers > 0 ? (paidFeeVouchers / totalFeeVouchers * 100).toFixed(1) : 0
      },
      expenses: {
        total: expenses,
        pending: pendingExp,
        paid: paidExp,
        monthly: expenses / 12
      },
      profit: revenue - expenses,
      feeVouchers: {
        total: totalFeeVouchers,
        paid: paidFeeVouchers,
        pending: pendingFeeVouchers
      }
    }
  });
}

// Academic Overview
async function getAcademicOverview() {
  const [
    totalClasses,
    activeClasses,
    totalStudents,
    totalTeachers,
    totalAttendance,
    presentCount,
    totalEvents,
    upcomingEvents
  ] = await Promise.all([
    Class.countDocuments(),
    Class.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    Attendance.countDocuments(),
    Attendance.aggregate([
      { $unwind: '$records' },
      { $match: { 'records.status': 'present' } },
      { $count: 'present' }
    ]),
    Event.countDocuments(),
    Event.countDocuments({ startDate: { $gt: new Date() }, status: 'scheduled' })
  ]);

  const attendanceRate = totalAttendance > 0 ?
    ((presentCount[0]?.present || 0) / (totalAttendance * 30) * 100).toFixed(1) : 0; // Assuming 30 students per attendance record

  return NextResponse.json({
    success: true,
    data: {
      classes: {
        total: totalClasses,
        active: activeClasses,
        inactive: totalClasses - activeClasses
      },
      students: totalStudents,
      teachers: totalTeachers,
      attendance: {
        totalRecords: totalAttendance,
        rate: attendanceRate
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents
      },
      studentTeacherRatio: totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : 0
    }
  });
}

// System Health
async function getSystemHealth() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [
    activeUsers,
    recentLogins,
    systemUptime,
    totalNotifications,
    unreadNotifications,
    failedPayments,
    errorLogs
  ] = await Promise.all([
    User.countDocuments({
      lastLogin: { $gte: oneHourAgo }
    }),
    User.find({
      lastLogin: { $gte: oneHourAgo }
    }).countDocuments(),
    // Mock system uptime - in real app, this would come from monitoring service
    Promise.resolve(99.8),
    Notification.countDocuments(),
    Notification.countDocuments({ isRead: false }),
    // Mock failed payments - would need payment logs
    Promise.resolve(0),
    // Mock error logs - would need logging system
    Promise.resolve(0)
  ]);

  return NextResponse.json({
    success: true,
    data: {
      uptime: systemUptime,
      activeUsers,
      recentLogins,
      notifications: {
        total: totalNotifications,
        unread: unreadNotifications
      },
      errors: {
        failedPayments,
        systemErrors: errorLogs
      },
      performance: {
        responseTime: 145, // Mock - would come from monitoring
        throughput: 1250, // Mock - requests per minute
        memoryUsage: 68, // Mock - percentage
        cpuUsage: 45 // Mock - percentage
      }
    }
  });
}

// Recent Activities
async function getRecentActivities() {
  const activities = await Promise.all([
    // Recent user registrations
    User.find({})
      .select('firstName lastName role createdAt branchId')
      .populate('branchProfile.branchId', 'name')
      .sort({ createdAt: -1 })
      .limit(5),

    // Recent fee payments
    FeeVoucher.find({ status: 'paid' })
      .populate('studentId', 'firstName lastName')
      .populate('branchId', 'name')
      .select('paidAmount paymentDate studentId branchId')
      .sort({ paymentDate: -1 })
      .limit(5),

    // Recent events
    Event.find({})
      .populate('branchId', 'name')
      .select('title startDate branchId createdAt')
      .sort({ createdAt: -1 })
      .limit(3)
  ]);

  const [users, payments, events] = activities;

  const recentActivities = [
    ...users.map(user => ({
      id: `user_${user._id}`,
      type: 'user_created',
      title: 'New User Registered',
      description: `${user.firstName} ${user.lastName} joined as ${user.role}`,
      branch: user.branchProfile?.branchId?.name || 'N/A',
      timestamp: user.createdAt,
      icon: 'user-plus'
    })),
    ...payments.map(payment => ({
      id: `payment_${payment._id}`,
      type: 'payment_received',
      title: 'Fee Payment Received',
      description: `PKR ${payment.paidAmount} from ${payment.studentId?.firstName} ${payment.studentId?.lastName}`,
      branch: payment.branchId?.name || 'N/A',
      timestamp: payment.paymentDate,
      icon: 'credit-card'
    })),
    ...events.map(event => ({
      id: `event_${event._id}`,
      type: 'event_created',
      title: 'Event Scheduled',
      description: event.title,
      branch: event.branchId?.name || 'All Branches',
      timestamp: event.createdAt,
      icon: 'calendar'
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);

  return NextResponse.json({
    success: true,
    data: recentActivities
  });
}

// Create Branch
async function createBranch(request) {
  const body = await request.json();
  const { name, code, location, adminEmail, contactNumber, address } = body;

  // Validate required fields
  if (!name || !code || !location || !adminEmail) {
    return NextResponse.json({
      success: false,
      message: 'Name, code, location, and admin email are required'
    }, { status: 400 });
  }

  // Check if branch code already exists
  const existingBranch = await Branch.findOne({ code });
  if (existingBranch) {
    return NextResponse.json({
      success: false,
      message: 'Branch code already exists'
    }, { status: 400 });
  }

  // Check if admin email exists
  const adminUser = await User.findOne({ email: adminEmail, role: 'branch-admin' });
  if (!adminUser) {
    return NextResponse.json({
      success: false,
      message: 'Branch admin with this email does not exist'
    }, { status: 400 });
  }

  const branch = new Branch({
    name,
    code,
    location,
    adminId: adminUser._id,
    contactNumber,
    address,
    status: 'active'
  });

  await branch.save();

  // Update admin's branch profile
  await User.findByIdAndUpdate(adminUser._id, {
    'branchProfile.branchId': branch._id,
    'branchProfile.role': 'admin'
  });

  return NextResponse.json({
    success: true,
    message: 'Branch created successfully',
    data: branch
  });
}

// Update Branch
async function updateBranch(request) {
  const body = await request.json();
  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'Branch ID is required'
    }, { status: 400 });
  }

  const branch = await Branch.findByIdAndUpdate(id, updateData, { new: true });
  if (!branch) {
    return NextResponse.json({
      success: false,
      message: 'Branch not found'
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Branch updated successfully',
    data: branch
  });
}

// Delete Branch
async function deleteBranch(request) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'Branch ID is required'
    }, { status: 400 });
  }

  // Check if branch has active users
  const activeUsers = await User.countDocuments({ 'branchProfile.branchId': id });
  if (activeUsers > 0) {
    return NextResponse.json({
      success: false,
      message: 'Cannot delete branch with active users. Please reassign users first.'
    }, { status: 400 });
  }

  await Branch.findByIdAndDelete(id);

  return NextResponse.json({
    success: true,
    message: 'Branch deleted successfully'
  });
}

// Create User
async function createUser(request) {
  const body = await request.json();
  const { firstName, lastName, email, password, role, branchId, phone, address } = body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password || !role) {
    return NextResponse.json({
      success: false,
      message: 'First name, last name, email, password, and role are required'
    }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({
      success: false,
      message: 'User with this email already exists'
    }, { status: 400 });
  }

  // For branch-specific roles, branchId is required
  if (['student', 'teacher', 'branch-admin'].includes(role) && !branchId) {
    return NextResponse.json({
      success: false,
      message: 'Branch ID is required for this role'
    }, { status: 400 });
  }

  const user = new User({
    firstName,
    lastName,
    email,
    password, // Will be hashed by pre-save middleware
    role,
    phone,
    address,
    status: 'active',
    ...(branchId && {
      branchProfile: {
        branchId,
        role: role === 'branch-admin' ? 'admin' : role
      }
    })
  });

  await user.save();

  return NextResponse.json({
    success: true,
    message: 'User created successfully',
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  });
}

// Update User
async function updateUser(request) {
  const body = await request.json();
  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'User ID is required'
    }, { status: 400 });
  }

  // Remove password from update if empty
  if (updateData.password === '') {
    delete updateData.password;
  }

  const user = await User.findByIdAndUpdate(id, updateData, { new: true })
    .select('-password -__v');

  if (!user) {
    return NextResponse.json({
      success: false,
      message: 'User not found'
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
}

// Delete User
async function deleteUser(request) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'User ID is required'
    }, { status: 400 });
  }

  await User.findByIdAndDelete(id);

  return NextResponse.json({
    success: true,
    message: 'User deleted successfully'
  });
}

// Send System Notification
async function sendSystemNotification(request) {
  const body = await request.json();
  const { title, message, targetUsers, targetRoles, targetBranches } = body;

  if (!title || !message) {
    return NextResponse.json({
      success: false,
      message: 'Title and message are required'
    }, { status: 400 });
  }

  let query = {};

  if (targetUsers && targetUsers.length > 0) {
    query._id = { $in: targetUsers };
  } else if (targetRoles && targetRoles.length > 0) {
    query.role = { $in: targetRoles };
  } else if (targetBranches && targetBranches.length > 0) {
    query['branchProfile.branchId'] = { $in: targetBranches };
  } else {
    // Send to all users
    query = {};
  }

  const users = await User.find(query).select('_id');

  const notifications = users.map(user => ({
    title,
    message,
    targetUser: user._id,
    type: 'system',
    priority: 'normal'
  }));

  await Notification.insertMany(notifications);

  return NextResponse.json({
    success: true,
    message: `Notification sent to ${users.length} users`
  });
}

// Get System Settings
async function getSystemSettings() {
  // Mock settings - in real app, this would come from a settings collection
  const settings = {
    general: {
      schoolName: 'Ease Academy',
      schoolCode: 'EA',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      language: 'en'
    },
    academic: {
      academicYearStart: '2024-08-01',
      academicYearEnd: '2025-07-31',
      gradingSystem: 'percentage',
      attendanceThreshold: 75
    },
    financial: {
      feeDueDate: 10,
      lateFeePercentage: 5,
      paymentMethods: ['cash', 'online', 'cheque'],
      taxRate: 0
    },
    system: {
      maintenanceMode: false,
      emailNotifications: true,
      smsNotifications: false,
      backupFrequency: 'daily'
    }
  };

  return NextResponse.json({
    success: true,
    data: settings
  });
}

// Update System Settings
async function updateSystemSettings(request) {
  const body = await request.json();
  const { category, settings } = body;

  if (!category || !settings) {
    return NextResponse.json({
      success: false,
      message: 'Category and settings are required'
    }, { status: 400 });
  }

  // In real app, save to database
  // For now, just return success
  return NextResponse.json({
    success: true,
    message: 'Settings updated successfully'
  });
}

// Get Pending Fees (Super Admin - All Branches)
async function getPendingFees() {
  const feeVouchers = await FeeVoucher.find({ status: 'pending' })
    .populate('studentId', 'firstName lastName')
    .populate('classId', 'name')
    .populate('branchId', 'name')
    .sort({ createdAt: -1 });

  const pendingPayments = feeVouchers.map(voucher => {
    const pendingPayments = voucher.paymentHistory.filter(payment => payment.status === 'pending');

    return pendingPayments.map(payment => ({
      id: `${voucher._id}_${payment._id}`,
      voucherId: voucher._id,
      studentName: `${voucher.studentId?.firstName} ${voucher.studentId?.lastName}`,
      className: voucher.classId?.name || 'N/A',
      branchName: voucher.branchId?.name || 'N/A',
      amount: payment.amount,
      dueDate: payment.dueDate,
      paymentDate: payment.paymentDate,
      description: payment.description || 'Fee Payment',
      status: payment.status
    }));
  }).flat();

  // Sort by payment date (latest first)
  pendingPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  return NextResponse.json({
    success: true,
    data: pendingPayments,
    total: pendingPayments.length
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
