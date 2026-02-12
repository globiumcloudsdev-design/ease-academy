'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserCheck } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminStudentAttendance = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('current_month');
  const [selectedChartBranch, setSelectedChartBranch] = useState(selectedBranch);

  useEffect(() => {
    setSelectedChartBranch(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    fetchStudentAttendance();
  }, [selectedChartBranch, selectedTimeRange]);

  const fetchStudentAttendance = async () => {
    try {
      setLoading(true);
      const params = {
        branch: selectedChartBranch,
        timeRange: selectedTimeRange
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.STUDENT_ATTENDANCE, { params });

      if (response.success && response.data && response.data.length > 0) {
        setData(response.data);
      } else {
        // No data available - show empty state
        setData([]);
        setError('No attendance data available for the selected filters');
      }
    } catch (err) {
      console.error('Failed to fetch student attendance:', err);
      setData([]);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];
    return classes.map(className => ({
      class: className,
      percentage: Math.floor(Math.random() * 30) + 70 // 70-100%
    }));
  };

  const averageAttendance = data.length > 0
    ? (data.reduce((sum, item) => sum + (item.percentage || 0), 0) / data.length).toFixed(1)
    : 0;

  // Get selected branch name
  const selectedBranchName = selectedChartBranch === 'all'
    ? 'All Branches'
    : branchPerformance.find(branch => branch.id === selectedChartBranch)?.name || selectedChartBranch;

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <UserCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            Student Attendance Percentage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <UserCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            Student Attendance Percentage
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dropdown
              value={selectedChartBranch}
              onChange={(e) => setSelectedChartBranch(e.target.value)}
              options={[
                { value: 'all', label: 'All Branches' },
                ...branchPerformance.map(branch => ({
                  value: branch.id,
                  label: branch.name
                }))
              ]}
              placeholder="Select Branch"
              className="w-32"
            />
            <Dropdown
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              options={[
                { value: 'current_week', label: 'Current Week' },
                { value: 'current_month', label: 'Current Month' },
                { value: 'last_month', label: 'Last Month' }
              ]}
              placeholder="Select Time Range"
              className="w-36"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Average Attendance: {averageAttendance}% •
          {selectedBranchName}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="class"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value, name) => [
                `${value}%`,
                'Attendance Rate'
              ]}
              labelFormatter={(label) => `Class: ${label}`}
            />
            <Bar
              dataKey="percentage"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SuperAdminStudentAttendance;
