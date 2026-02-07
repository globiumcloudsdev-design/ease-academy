 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminClassWiseStudents = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedChartBranch, setSelectedChartBranch] = useState(selectedBranch);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setSelectedChartBranch(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    fetchClassWiseStudents();
  }, [selectedChartBranch, selectedFilter]);

  const fetchClassWiseStudents = async () => {
    try {
      setLoading(true);
      const params = {
        branch: selectedChartBranch,
        filter: selectedFilter
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.CLASS_WISE_STUDENTS, { params });

      if (response.success && response.data && response.data.length > 0) {
        setData(response.data);
      } else {
        // No data available - show empty state
        setData([]);
        setError('No data available for the selected filters');
      }
    } catch (err) {
      console.error('Failed to fetch class-wise students:', err);
      setData([]);
      setError('Failed to load class-wise students data');
    } finally {
      setLoading(false);
    }
  };



  const totalStudents = data.reduce((sum, item) => sum + (item.students || 0), 0);

  // Get selected branch name
  const selectedBranchName = selectedChartBranch === 'all'
    ? 'All Branches'
    : branchPerformance.find(branch => branch.id === selectedChartBranch)?.name || selectedChartBranch;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Class-wise Student Distribution
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Class-wise Student Distribution
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
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Classes' },
                { value: 'primary', label: 'Primary' },
                { value: 'secondary', label: 'Secondary' }
              ]}
              placeholder="Select Filter"
              className="w-32"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Students: {totalStudents} • {selectedBranchName}
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value, name) => [
                `${value} students`,
                'Students'
              ]}
              labelFormatter={(label) => `Class: ${label}`}
            />
            <Bar
              dataKey="students"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SuperAdminClassWiseStudents;
