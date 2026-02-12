'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Target } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminPassFailRatio = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('current_academic_year');
  const [selectedChartBranch, setSelectedChartBranch] = useState(selectedBranch);

  useEffect(() => {
    setSelectedChartBranch(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    fetchPassFailRatio();
  }, [selectedChartBranch, selectedTimeRange]);

  const fetchPassFailRatio = async () => {
    try {
      setLoading(true);
      const params = {
        branch: selectedChartBranch,
        timeRange: selectedTimeRange
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.PASS_FAIL_RATIO, { params });

      if (response.success && response.data && response.data.length > 0) {
        setData(response.data);
      } else {
        // No data available - show empty state
        setData([]);
        setError('No data available for the selected filters');
      }
    } catch (err) {
      console.error('Failed to fetch pass fail ratio:', err);
      setData([]);
      setError('Failed to load pass fail ratio data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const passPercentage = Math.floor(Math.random() * 30) + 70; // 70-100%
    const failPercentage = 100 - passPercentage;
    return [
      { name: 'Pass', value: passPercentage, color: '#10b981' },
      { name: 'Fail', value: failPercentage, color: '#ef4444' }
    ];
  };

  const totalStudents = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const passRate = data.find(item => item.name === 'Pass')?.value || 0;

  // Get selected branch name
  const selectedBranchName = selectedChartBranch === 'all'
    ? 'All Branches'
    : branchPerformance.find(branch => branch.id === selectedChartBranch)?.name || selectedChartBranch;

  const COLORS = ['#10b981', '#ef4444'];

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-full">
              <Target className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            Pass vs Fail Ratio
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
            <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-full">
              <Target className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            Pass vs Fail Ratio
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
                { value: 'current_semester', label: 'Current Semester' },
                { value: 'current_academic_year', label: 'Academic Year' },
                { value: 'last_academic_year', label: 'Last Year' }
              ]}
              placeholder="Select Time Range"
              className="w-40"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Pass Rate: {passRate}% • Total Students: {totalStudents} •
          {selectedBranchName}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value, name) => [
                `${value}% (${Math.round((value / 100) * totalStudents)} students)`,
                name
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SuperAdminPassFailRatio;
