'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Receipt } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminMonthlyFeeCollection = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('6months');
  const [selectedChartBranch, setSelectedChartBranch] = useState(selectedBranch);

  useEffect(() => {
    setSelectedChartBranch(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    fetchMonthlyFeeCollection();
  }, [selectedChartBranch, selectedTimeRange]);

  const fetchMonthlyFeeCollection = async () => {
    try {
      setLoading(true);
      const params = {
        branch: selectedChartBranch,
        timeRange: selectedTimeRange
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.MONTHLY_FEE_COLLECTION, { params });

      if (response.success && response.data && response.data.length > 0) {
        setData(response.data);
      } else {
        // No data available - show empty state
        setData([]);
        setError('No data available for the selected filters');
      }
    } catch (err) {
      console.error('Failed to fetch monthly fee collection:', err);
      setData([]);
      setError('Failed to load fee collection data');
    } finally {
      setLoading(false);
    }
  };



  const totalCollected = data.reduce((sum, item) => sum + (item.approvedAmount || 0), 0);
  const totalPending = data.reduce((sum, item) => sum + (item.pendingAmount || 0), 0);
  const averageMonthly = data.length > 0 ? (totalCollected / data.length).toFixed(0) : 0;

  // Get selected branch name
  const selectedBranchName = selectedChartBranch === 'all'
    ? 'All Branches'
    : branchPerformance.find(branch => branch.id === selectedChartBranch)?.name || selectedChartBranch;

  if (loading) {
  return (
    <Card className="hover:shadow-lg transition-shadow bg-yellow-50 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Receipt className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            Monthly Fee Collection
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
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Receipt className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            Monthly Fee Collection
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
                { value: '1month', label: '1 Month' },
                { value: '3months', label: '3 Months' },
                { value: '6months', label: '6 Months' },
                { value: '1year', label: '1 Year' }
              ]}
              placeholder="Select Time Range"
              className="w-32"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Collected: PKR {totalCollected.toLocaleString()} •
          Total Pending: PKR {totalPending.toLocaleString()} •
          Avg Monthly: PKR {averageMonthly.toLocaleString()} •
          {selectedBranchName}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `PKR ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value, name) => [
                `PKR ${value.toLocaleString()}`,
                name === 'approvedAmount' ? 'Approved' : 'Pending'
              ]}
            />
            <Legend />
            <Bar
              dataKey="approvedAmount"
              fill="#10b981"
              name="Approved"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="pendingAmount"
              fill="#f59e0b"
              name="Pending"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SuperAdminMonthlyFeeCollection;
