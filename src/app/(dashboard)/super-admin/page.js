'use client';
import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import Dropdown from '@/components/ui/dropdown';
import { Input } from '@/components/ui/input';
import FullPageLoader from '@/components/ui/full-page-loader';
import {
  Users,
  Building2,
  BookOpen,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Eye,
  Bell,
  GraduationCap,
  UserCheck,
  CreditCard,
  Receipt,
  Target,
  Zap,
  UserPlus,
  CalendarDays,
  FileCheck,
  Wallet,
  Settings,
  Shield,
  Database
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const { execute } = useApi();

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange, selectedBranch]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await execute({
        method: 'GET',
        url: '/api/super-admin/dashboard/stats',
        params: {
          timeRange: selectedTimeRange,
          branch: selectedBranch
        }
      });

      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-PK').format(num);
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return <FullPageLoader message="Loading comprehensive dashboard data..." />;
  }

  // Use real API data or fallback to default values
  const headerStats = dashboardData?.headerStats || {};
  const performanceMetrics = dashboardData?.performanceMetrics || {};
  const revenueAnalytics = dashboardData?.revenueAnalytics || {};
  const studentAnalytics = dashboardData?.studentAnalytics || {};
  const recentActivities = dashboardData?.recentActivities || [];
  const systemAlerts = dashboardData?.systemAlerts || [];
  const branchPerformance = dashboardData?.branchPerformance || [];
  const summary = dashboardData?.summary || {};

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Comprehensive overview of all branches, users, and system performance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Dropdown
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            options={[
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: '90days', label: 'Last 90 Days' },
              { value: '1year', label: 'Last Year' }
            ]}
            placeholder="Select Time Range"
            className="min-w-[140px]"
          />
          <Dropdown
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            options={[
              { value: 'all', label: 'All Branches' },
              ...branchPerformance.map(branch => ({
                value: branch.id,
                label: branch.name
              }))
            ]}
            placeholder="Select Branch"
            className="min-w-[140px]"
          />
          <Button onClick={loadDashboardData} className="whitespace-nowrap">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards - Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Branches */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Branches</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(headerStats.totalBranches || 0)}</p>
                <div className="flex items-center mt-1">
                  {getChangeIcon(headerStats.branchGrowth)}
                  <span className={`text-xs md:text-sm ml-1 ${getChangeColor(headerStats.branchGrowth)}`}>
                    {Math.abs(headerStats.branchGrowth || 0)}%
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              {headerStats.activeBranches || 0} Active • {headerStats.inactiveBranches || 0} Inactive
            </div>
          </CardContent>
        </Card>

        {/* Students */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(headerStats.totalStudents || 0)}</p>
                <div className="flex items-center mt-1">
                  {getChangeIcon(headerStats.studentGrowth)}
                  <span className={`text-xs md:text-sm ml-1 ${getChangeColor(headerStats.studentGrowth)}`}>
                    {Math.abs(headerStats.studentGrowth || 0)}%
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              Across {headerStats.activeBranches || 0} active branches
            </div>
          </CardContent>
        </Card>

        {/* Teachers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Teachers</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(headerStats.totalTeachers || 0)}</p>
                <div className="flex items-center mt-1">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-xs md:text-sm ml-1 text-blue-600">Active</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              Faculty members
            </div>
          </CardContent>
        </Card>

        {/* Classes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Classes</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(headerStats.totalClasses || 0)}</p>
                <div className="flex items-center mt-1">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs md:text-sm ml-1 text-indigo-600">{headerStats.activeClasses || 0} Active</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              Academic sections
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(headerStats.totalRevenue || 0)}</p>
                <div className="flex items-center mt-1">
                  {getChangeIcon(headerStats.revenueChange)}
                  <span className={`text-xs md:text-sm ml-1 ${getChangeColor(headerStats.revenueChange)}`}>
                    {Math.abs(headerStats.revenueChange || 0)}%
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              {headerStats.feeCollectionRate || 0}% collection rate
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">System Uptime</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{headerStats.systemUptime || 0}%</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs md:text-sm ml-1 text-green-600">Healthy</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              {headerStats.activeSessions || 0} active sessions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics & System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Average Attendance</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{performanceMetrics.avgAttendance || 0}%</div>
                  <div className={`text-xs flex items-center gap-1 ${getChangeColor(performanceMetrics.attendanceChange)}`}>
                    {getChangeIcon(performanceMetrics.attendanceChange)}
                    {Math.abs(performanceMetrics.attendanceChange || 0)}%
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">Pass Percentage</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{performanceMetrics.passPercentage || 0}%</div>
                  <div className={`text-xs flex items-center gap-1 ${getChangeColor(performanceMetrics.passChange)}`}>
                    {getChangeIcon(performanceMetrics.passChange)}
                    {Math.abs(performanceMetrics.passChange || 0)}%
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">API Response Time</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{performanceMetrics.apiResponseTime || 0}ms</div>
                  <div className={`text-xs flex items-center gap-1 ${getChangeColor(performanceMetrics.responseChange)}`}>
                    {getChangeIcon(performanceMetrics.responseChange)}
                    {Math.abs(performanceMetrics.responseChange || 0)}%
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium">Total Attendance Records</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatNumber(performanceMetrics.totalAttendanceRecords || 0)}</div>
                  <div className="text-xs text-gray-500">
                    {performanceMetrics.presentCount || 0} present, {performanceMetrics.absentCount || 0} absent
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalUsers || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.totalParents || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Parents</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.totalEvents || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.totalExams || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Exams</div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Upcoming Events
                </span>
                <span className="text-lg font-bold">{headerStats.upcomingEvents || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-green-500" />
                  Scheduled Exams
                </span>
                <span className="text-lg font-bold">{headerStats.scheduledExams || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-red-500" />
                  Pending Expenses
                </span>
                <span className="text-lg font-bold">{formatCurrency(headerStats.pendingExpenses || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4 text-yellow-500" />
                  Unread Notifications
                </span>
                <span className="text-lg font-bold">{headerStats.unreadNotifications || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Branch Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Teachers</TableHead>
                  <TableHead className="text-right">Classes</TableHead>
                  <TableHead className="text-right">Attendance Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchPerformance.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.code}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(branch.status)}`}>
                        {branch.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(branch.students)}</TableCell>
                    <TableCell className="text-right">{formatNumber(branch.teachers)}</TableCell>
                    <TableCell className="text-right">{formatNumber(branch.classes)}</TableCell>
                    <TableCell className="text-right">{branch.attendanceRate}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(branch.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(branch.expenses)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Role Distribution & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentAnalytics.userRoleDistribution?.map((role, index) => (
                <div key={role.role} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      index === 0 ? 'bg-blue-100 text-blue-600' :
                      index === 1 ? 'bg-green-100 text-green-600' :
                      index === 2 ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {index === 0 ? <GraduationCap className="w-4 h-4" /> :
                       index === 1 ? <UserCheck className="w-4 h-4" /> :
                       index === 2 ? <UserPlus className="w-4 h-4" /> :
                       <Shield className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{role.role}</div>
                      <div className="text-xs text-gray-500">{role.percentage}% of total users</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatNumber(role.count)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(headerStats.collectedAmount || 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Collected</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(performanceMetrics.outstandingAmount || 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Outstanding</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Expenses</span>
                  <span className="text-lg font-bold">{formatCurrency(headerStats.totalExpenses || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Paid Expenses</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(headerStats.paidExpenses || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Pending Expenses</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(headerStats.pendingExpenses || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.user}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activity.action} <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.branch}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 border rounded-lg ${getPriorityColor(alert.priority)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{alert.category}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          alert.priority === 'high' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                          alert.priority === 'medium' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                          'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                        }`}>
                          {alert.priority}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{alert.title}</h4>
                      <p className="text-sm opacity-90">{alert.message}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {alert.actionRequired && (
                      <Button size="sm" variant="outline" className="ml-2 flex-shrink-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-sm text-center">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200">
              <Building2 className="w-6 h-6 text-green-600" />
              <span className="text-sm text-center">Branch Settings</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200">
              <FileText className="w-6 h-6 text-purple-600" />
              <span className="text-sm text-center">Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-yellow-50 hover:border-yellow-200">
              <Bell className="w-6 h-6 text-yellow-600" />
              <span className="text-sm text-center">Notifications</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-200">
              <Receipt className="w-6 h-6 text-red-600" />
              <span className="text-sm text-center">Expenses</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-indigo-50 hover:border-indigo-200">
              <Calendar className="w-6 h-6 text-indigo-600" />
              <span className="text-sm text-center">Events</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


