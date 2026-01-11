'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import apiClient from '@/lib/api-client';
import { Users, GraduationCap, BookOpen, Calendar, TrendingUp, TrendingDown, Clock, Library } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BranchAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'branch_admin') {
        router.push('/login');
        return;
      }
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.DASHBOARD);
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { stats, classDistribution, upcomingEvents, branchInfo } = dashboardData;

  const statsCards = [
    {
      title: 'Total Students',
      value: stats.students.total,
      active: stats.students.active,
      inactive: stats.students.inactive,
      thisMonth: stats.students.thisMonth,
      growth: stats.students.growth,
      icon: Users,
      color: 'bg-blue-500',
      href: '/branch-admin/students',
    },
    {
      title: 'Total Teachers',
      value: stats.teachers.total,
      active: stats.teachers.active,
      inactive: stats.teachers.inactive,
      thisMonth: stats.teachers.thisMonth,
      growth: stats.teachers.growth,
      icon: GraduationCap,
      color: 'bg-green-500',
      href: '/branch-admin/teachers',
    },
    {
      title: 'Total Classes',
      value: stats.classes.total,
      icon: BookOpen,
      color: 'bg-purple-500',
      href: '/branch-admin/classes',
    },
    {
      title: 'Total Subjects',
      value: stats.subjects.total,
      icon: Calendar,
      color: 'bg-orange-500',
      href: '/branch-admin/subjects',
    },
    {
      title: 'Library Books',
      value: stats.books?.total || 0,
      icon: Library,
      color: 'bg-indigo-500',
      href: '/branch-admin/library',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Branch Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Managing {branchInfo.branchName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statsCards.map((stat) => (
          <Card
            key={stat.title}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(stat.href)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                
                {stat.active !== undefined && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <span className="text-green-600">Active: {stat.active}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-red-600">Inactive: {stat.inactive}</span>
                  </div>
                )}
                
                {stat.thisMonth !== undefined && stat.thisMonth > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    {stat.growth > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={stat.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                      +{stat.thisMonth} this month ({stat.growth}%)
                    </span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Class Distribution and Upcoming Events */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Class Distribution</h2>
          {classDistribution.length > 0 ? (
            <div className="space-y-3">
              {classDistribution.map((classItem) => (
                <div
                  key={classItem._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                  onClick={() => router.push(`/branch-admin/classes/${classItem._id}`)}
                >
                  <div>
                    <p className="font-medium">{classItem.name}</p>
                    <p className="text-sm text-muted-foreground">Code: {classItem.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{classItem.studentCount}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No classes found</p>
              <button
                onClick={() => router.push('/branch-admin/classes')}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Create Class
              </button>
            </div>
          )}
        </Card>

        {/* Upcoming Events */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event._id}
                  className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(event.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {event.eventType && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                          {event.eventType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming events</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <button
            onClick={() => router.push('/branch-admin/students')}
            className="p-4 text-left border rounded-lg hover:bg-muted transition-colors"
          >
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <p className="font-medium">Manage Students</p>
            <p className="text-sm text-muted-foreground">View and edit students</p>
          </button>
          <button
            onClick={() => router.push('/branch-admin/teachers')}
            className="p-4 text-left border rounded-lg hover:bg-muted transition-colors"
          >
            <GraduationCap className="w-8 h-8 text-green-500 mb-2" />
            <p className="font-medium">Manage Teachers</p>
            <p className="text-sm text-muted-foreground">View and edit teachers</p>
          </button>
          <button
            onClick={() => router.push('/branch-admin/classes')}
            className="p-4 text-left border rounded-lg hover:bg-muted transition-colors"
          >
            <BookOpen className="w-8 h-8 text-purple-500 mb-2" />
            <p className="font-medium">Manage Classes</p>
            <p className="text-sm text-muted-foreground">View and edit classes</p>
          </button>
          <button
            onClick={() => router.push('/branch-admin/subjects')}
            className="p-4 text-left border rounded-lg hover:bg-muted transition-colors"
          >
            <Calendar className="w-8 h-8 text-orange-500 mb-2" />
            <p className="font-medium">Manage Subjects</p>
            <p className="text-sm text-muted-foreground">View and edit subjects</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
