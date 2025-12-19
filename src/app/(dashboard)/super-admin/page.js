'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import HeaderStats from '@/components/dashboard/HeaderStats';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import RevenueAnalytics from '@/components/dashboard/RevenueAnalytics';
import StudentAnalytics from '@/components/dashboard/StudentAnalytics';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import SystemAlerts from '@/components/dashboard/SystemAlerts';
import QuickActions from '@/components/dashboard/QuickActions';

export default function SuperAdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { execute } = useApi();

  useEffect(() => {
    loadDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real-time dashboard statistics
      const response = await execute({ url: API_ENDPOINTS.SUPER_ADMIN.DASHBOARD_STATS });
      
      if (response?.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set default data in case of error
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Use real API data or fallback to default values
  const headerStats = dashboardData?.headerStats || {
    totalBranches: 0,
    activeBranches: 0,
    inactiveBranches: 0,
    branchGrowth: 0,
    totalStudents: 0,
    studentGrowth: 0,
    totalRevenue: 0,
    revenueChange: 0,
    systemUptime: 99.9,
    activeSessions: 0,
    peakSessions: 0,
    sessionChange: 0,
    feeCollectionRate: 0,
    collectedAmount: 0,
    collectionChange: 0,
  };

  const performanceMetrics = dashboardData?.performanceMetrics || {
    monthlyRevenue: 0,
    revenueGrowth: 0,
    collectionEfficiency: 0,
    efficiencyChange: 0,
    outstandingAmount: 0,
    outstandingChange: 0,
    avgAttendance: 0,
    attendanceChange: 0,
    passPercentage: 0,
    passChange: 0,
    activeStudents: 0,
    studentChange: 0,
    apiResponseTime: 0,
    responseChange: 0,
    systemUptime: 99.9,
    activeUsers: 0,
    userChange: 0,
    dailyActiveUsers: 0,
    dauChange: 0,
    loginSuccessRate: 0,
    loginChange: 0,
    avgSessionDuration: 0,
    sessionChange: 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening across all branches 
          </p>
        </div>
        <Button onClick={loadDashboardData}>
          Refresh Data
        </Button>
      </div>


      {/* Row 1: Header Statistics - 6 Widgets */}
      <HeaderStats stats={headerStats} />

      {/* Row 2: Performance Metrics - 4 Cards */}
      <PerformanceMetrics metrics={performanceMetrics} />

      {/* Row 3: Analytics Charts - 2 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueAnalytics data={dashboardData?.revenueAnalytics} />
        <StudentAnalytics data={dashboardData?.studentAnalytics} />
      </div>

      {/* Row 4: Activity & Alerts - 2 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={dashboardData?.recentActivities} />
        <SystemAlerts alerts={dashboardData?.systemAlerts} />
      </div>

      {/* Row 5: Quick Actions Panel */}
      <QuickActions />
    </div>
  );
}


