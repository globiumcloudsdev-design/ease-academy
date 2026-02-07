'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminBranchWiseStudents = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchBranchWiseStudents();
  }, []);

  const fetchBranchWiseStudents = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.BRANCH_WISE_STUDENTS);

      if (response.success && response.data && response.data.length > 0) {
        setData(response.data);
      } else {
        // No data available - show empty state
        setData([]);
        setError('No data available for the selected filters');
      }
    } catch (err) {
      console.error('Failed to fetch branch-wise students:', err);
      setData([]);
      setError('Failed to load branch-wise students data');
    } finally {
      setLoading(false);
    }
  };



  const totalStudents = data.reduce((sum, item) => sum + (item.students || 0), 0);

  // Get selected branch name
  const selectedBranchName = 'All Branches';

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            Branch-wise Student Distribution
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
    <Card
      className="hover:shadow-lg transition-shadow relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* {isHovered && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
          <span className="text-black text-lg font-semibold">Test White</span>
        </div>
      )} */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            Branch-wise Student Distribution
          </CardTitle>

        </div>
        <div className="text-sm text-muted-foreground">
          Total Students: {totalStudents} • All Branches
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="branch"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
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
              labelFormatter={(label) => `Branch: ${label}`}
            />
            <Bar
              dataKey="students"
              fill="#8B5CF6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SuperAdminBranchWiseStudents;
