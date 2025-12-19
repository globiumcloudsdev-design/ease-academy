'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import apiClient from '@/lib/api-client';
import { Users, GraduationCap, BookOpen, Calendar, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'teacher') {
        router.push('/login');
        return;
      }
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.DASHBOARD);
      
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

  const { stats, myClasses, upcomingExams, branchInfo } = dashboardData;

  const statsCards = [
    {
      title: 'My Classes',
      value: stats.classes.total,
      icon: BookOpen,
      color: 'bg-blue-500',
      href: '/teacher/classes',
    },
    {
      title: 'Total Students',
      value: stats.students.total,
      icon: Users,
      color: 'bg-green-500',
      href: '/teacher/classes',
    },
    {
      title: 'Upcoming Exams',
      value: stats.exams.total,
      icon: Calendar,
      color: 'bg-purple-500',
      href: '/teacher/exams',
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendance.average}%`,
      icon: Clock,
      color: 'bg-orange-500',
      href: '/teacher/attendance',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}! Managing your classes at {branchInfo.branchName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              </div>
              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* My Classes and Upcoming Exams */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* My Classes */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">My Classes</h2>
          {myClasses.length > 0 ? (
            <div className="space-y-3">
              {myClasses.map((classItem) => (
                <div
                  key={classItem._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                  onClick={() => router.push(`/teacher/classes/${classItem._id}`)}
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
              <p>No classes assigned</p>
            </div>
          )}
        </Card>

        {/* Upcoming Exams */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Exams</h2>
          {upcomingExams.length > 0 ? (
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div
                  key={exam._id}
                  className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(exam.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{exam.classId?.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming exams</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => router.push('/teacher/classes')}
            className="p-4 text-left border rounded-lg hover:bg-muted transition-colors"
          >
            <BookOpen className="w-8 h-8 text-blue-500 mb-2" />
            <p className="font-medium">My Classes</p>
            <p className="text-sm text-muted-foreground">View and manage classes</p>
          </button>
          <button
            onClick={() => router.push('/teacher/attendance')}
            className="p-4 text-left border rounded-lg hover:bg-muted transition-colors"
          >
            <Clock className="w-8 h-8 text-green-500 mb-2" />
            <p className="font-medium">Mark Attendance</p>
            <p className="text-sm text-muted-foreground">Take student attendance</p>
          </button>
          <button
            onClick={() => router.push('/teacher/exams')}
            className="p-4 text-left border rounded-lg hover:bg-muted transition-colors"
          >
            <Calendar className="w-8 h-8 text-purple-500 mb-2" />
            <p className="font-medium">Manage Exams</p>
            <p className="text-sm text-muted-foreground">Create and grade exams</p>
          </button>
          <button
            onClick={() => router.push('/teacher/results')}
            className="p-4 text-left border rounded-lg hover:bg-muted transition-colors"
          >
            <GraduationCap className="w-8 h-8 text-orange-500 mb-2" />
            <p className="font-medium">View Results</p>
            <p className="text-sm text-muted-foreground">Check student results</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
