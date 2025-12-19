'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import {
  DollarSign,
  Plus,
  Search,
  Download,
  CheckCircle,
  Clock,
  Filter,
  Calendar,
  Users,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

export default function PayrollProcessingPage() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const [stats, setStats] = useState({
    totalPayroll: 0,
    processedCount: 0,
    pendingCount: 0,
  });

  useEffect(() => {
    fetchPayrolls();
    fetchTeachers();
    fetchBranches();
  }, [selectedBranch, selectedMonth]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setPayrolls([]);
      setStats({ totalPayroll: 0, processedCount: 0, pendingCount: 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const params = new URLSearchParams({
        limit: '100',
        status: 'active',
        role: 'teacher',
        ...(selectedBranch && { branchId: selectedBranch }),
      });
      const response = await apiClient.get(`/api/users?${params}`);
      if (response.success) {
        setTeachers(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/branches?limit=100');
      if (response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const processPayroll = async () => {
    if (!selectedMonth) {
      toast.error('Please select a month');
      return;
    }

    try {
      setProcessing(true);
      toast.success(`Payroll processing initiated for ${selectedMonth}`);
      
      const processed = teachers.map(teacher => {
        const salaryDetails = teacher.teacherProfile?.salaryDetails || {};
        const basicSalary = salaryDetails.basicSalary || 0;
        const allowances = salaryDetails.allowances || {};
        const deductions = salaryDetails.deductions || {};
        
        return {
          teacherId: teacher._id,
          month: selectedMonth,
          basicSalary,
          allowances,
          deductions,
          netSalary: basicSalary + 
            Object.values(allowances).reduce((sum, val) => sum + (Number(val) || 0), 0) -
            Object.values(deductions).reduce((sum, val) => sum + (Number(val) || 0), 0),
          status: 'processed',
        };
      });

      setPayrolls(processed);
      const totalPayroll = processed.reduce((sum, p) => sum + p.netSalary, 0);
      setStats({
        totalPayroll,
        processedCount: processed.length,
        pendingCount: 0,
      });

      toast.success('Payroll processed successfully');
    } catch (error) {
      toast.error('Failed to process payroll');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-7 w-7" />
          Payroll Processing
        </h1>
        <p className="text-gray-600 mt-1">Process monthly salary for teachers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-green-600">PKR {stats.totalPayroll.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.processedCount}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>{branch.name}</option>
            ))}
          </select>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={processPayroll}
            disabled={processing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {processing ? 'Processing...' : 'Process Payroll'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : payrolls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p>No payroll processed yet. Select month and click Process Payroll</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrolls.map((payroll, idx) => {
                  const teacher = teachers.find(t => t._id === payroll.teacherId);
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher?.firstName} {teacher?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{teacher?.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        PKR {payroll.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        +PKR {Object.values(payroll.allowances).reduce((s, v) => s + (Number(v) || 0), 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -PKR {Object.values(payroll.deductions).reduce((s, v) => s + (Number(v) || 0), 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        PKR {payroll.netSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {payroll.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
