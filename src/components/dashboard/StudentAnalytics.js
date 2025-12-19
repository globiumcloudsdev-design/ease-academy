'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StudentAnalytics({ data }) {
  // Enrollment trend
  const enrollmentTrend = data?.enrollmentTrend || [
    { month: 'Jul', students: 1200, new: 50 },
    { month: 'Aug', students: 1235, new: 35 },
    { month: 'Sep', students: 1278, new: 43 },
    { month: 'Oct', students: 1305, new: 27 },
    { month: 'Nov', students: 1342, new: 37 },
    { month: 'Dec', students: 1389, new: 47 },
  ];

  // Branch-wise distribution
  const branchDistribution = data?.branchDistribution || [
    { branch: 'Main Campus', students: 450, percentage: 32 },
    { branch: 'North Branch', students: 378, percentage: 27 },
    { branch: 'South Branch', students: 312, percentage: 23 },
    { branch: 'East Branch', students: 249, percentage: 18 },
  ];

  // Grade-wise enrollment
  const gradeEnrollment = data?.gradeEnrollment || [
    { grade: 'Grade 1', students: 156 },
    { grade: 'Grade 2', students: 142 },
    { grade: 'Grade 3', students: 138 },
    { grade: 'Grade 4', students: 151 },
    { grade: 'Grade 5', students: 147 },
    { grade: 'Grade 6', students: 134 },
    { grade: 'Grade 7', students: 128 },
    { grade: 'Grade 8', students: 143 },
  ];

  // Attendance rate trend
  const attendanceTrend = data?.attendanceTrend || [
    { month: 'Jul', rate: 92 },
    { month: 'Aug', rate: 94 },
    { month: 'Sep', rate: 91 },
    { month: 'Oct', rate: 95 },
    { month: 'Nov', rate: 93 },
    { month: 'Dec', rate: 96 },
  ];

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Student Analytics</CardTitle>
          <Users className="h-5 w-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enrollment Trend */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Enrollment Trend</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={enrollmentTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} name="Total Students" />
              <Line type="monotone" dataKey="new" stroke="#10b981" strokeWidth={2} name="New Admissions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Branch-wise Distribution</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={branchDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.branch}: ${entry.percentage}%`}
                outerRadius={70}
                dataKey="students"
              >
                {branchDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Grade-wise Enrollment */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Grade-wise Enrollment</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gradeEnrollment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="students" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Rate Trend */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Attendance Rate Trend</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[85, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
