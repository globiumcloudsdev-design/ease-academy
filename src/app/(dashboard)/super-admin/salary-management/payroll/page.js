'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import {
  DollarSign,
  Plus,
  Download,
  CheckCircle,
  Clock,
  Filter,
  Users,
  TrendingUp,
  XCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ButtonLoader from '@/components/ui/button-loader';
import FullPageLoader from '@/components/ui/full-page-loader';

export default function SuperAdminPayrollPage() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [markingPaid, setMarkingPaid] = useState({});
  
  // Filters
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Processing Settings
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [deductionType, setDeductionType] = useState('percentage');
  const [deductionValue, setDeductionValue] = useState(10);
  const [remarks, setRemarks] = useState('');
  const [showProcessModal, setShowProcessModal] = useState(false);

  const [stats, setStats] = useState({
    totalPayroll: 0,
    totalGross: 0,
    totalNet: 0,
    pendingCount: 0,
    paidCount: 0,
  });

  useEffect(() => {
    fetchData();
  }, [selectedBranch, selectedMonth, selectedYear, selectedStatus]);

  const fetchData = async () => {
    await Promise.all([
      fetchPayrolls(),
      fetchTeachers(),
      fetchBranches(),
      fetchStats(),
    ]);
  };

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = {
        month: selectedMonth,
        year: selectedYear,
        ...(selectedBranch !== 'all' && { branchId: selectedBranch }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        limit: 100,
      };
      
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.PAYROLL.LIST, params);
      if (response.success) {
        setPayrolls(response.data);
      }
    } catch (error) {
      console.error('Fetch payrolls error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      toast.error(error.response?.data?.error || error.message || 'Failed to fetch payroll records');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const params = {
        role: 'teacher',
        status: 'active',
        limit: 200,
        ...(selectedBranch !== 'all' && { branchId: selectedBranch }),
      };
      
      const response = await apiClient.get('/api/users', params);
      if (response.success) {
        setTeachers(response.data);
      }
    } catch (error) {
      console.error('Fetch teachers error:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { limit: 100 });
      if (response.success) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error('Fetch branches error:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {
        month: selectedMonth,
        year: selectedYear,
        ...(selectedBranch !== 'all' && { branchId: selectedBranch }),
      };
      
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.PAYROLL.REPORTS.SUMMARY, params);
      if (response.success) {
        setStats({
          totalPayroll: response.data.summary.totalPayrolls || 0,
          totalGross: response.data.summary.totalGrossSalary || 0,
          totalNet: response.data.summary.totalNetSalary || 0,
          pendingCount: response.data.summary.pendingPayrolls || 0,
          paidCount: response.data.summary.paidPayrolls || 0,
        });
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
    }
  };

  const handleProcessPayroll = async () => {
    if (selectedTeachers.length === 0) {
      toast.error('Please select at least one teacher');
      return;
    }

    if (!deductionValue || deductionValue < 0) {
      toast.error('Please enter a valid deduction value');
      return;
    }

    try {
      setProcessing(true);
      
      const payload = {
        teacherIds: selectedTeachers,
        branchId: selectedBranch,
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        deductionType,
        deductionValue: parseFloat(deductionValue),
        remarks,
      };

      const response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.PAYROLL.PROCESS, payload);
      
      if (response.success) {
        const { results } = response.data;
        
        toast.success(
          `Payroll processed successfully! Success: ${results.success.length}, Failed: ${results.failed.length}, Skipped: ${results.skipped.length}`
        );
        
        if (results.failed.length > 0) {
          console.log('Failed:', results.failed);
          toast.warning(`Some teachers failed: ${results.failed.map(f => f.reason).join(', ')}`);
        }
        
        if (results.skipped.length > 0) {
          console.log('Skipped:', results.skipped);
          toast.info(`Some teachers skipped: ${results.skipped.map(s => s.reason).join(', ')}`);
        }

        setShowProcessModal(false);
        setSelectedTeachers([]);
        setRemarks('');
        fetchData();
      }
    } catch (error) {
      console.error('Process payroll error:', error);
      toast.error(error.message || 'Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadSlip = async (payrollId) => {
    try {
      setDownloading(prev => ({ ...prev, [payrollId]: true }));
      
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.PAYROLL.SLIP(payrollId),);

      if (!response.ok) {
        throw new Error('Failed to download salary slip');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Salary_Slip_${selectedMonth}_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Salary slip downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download salary slip');
    } finally {
      setDownloading(prev => ({ ...prev, [payrollId]: false }));
    }
  };

  const handleMarkPaid = async (payrollId) => {
    try {
      setMarkingPaid(prev => ({ ...prev, [payrollId]: true }));
      
      const response = await apiClient.put(API_ENDPOINTS.SUPER_ADMIN.PAYROLL.MARK_PAID(payrollId), {
        paymentMethod: 'bank_transfer',
        paymentDate: new Date().toISOString(),
      });

      if (response.success) {
        toast.success('Payroll marked as paid successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Mark paid error:', error);
      toast.error('Failed to mark as paid');
    } finally {
      setMarkingPaid(prev => ({ ...prev, [payrollId]: false }));
    }
  };

  const handleSelectTeacher = (teacherId) => {
    setSelectedTeachers(prev => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  const handleSelectAllTeachers = () => {
    if (selectedTeachers.length === teachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(teachers.map(t => t._id));
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'warning', icon: Clock },
      processed: { variant: 'info', icon: CheckCircle },
      paid: { variant: 'success', icon: CheckCircle },
    };
    
    const { variant, icon: Icon } = variants[status] || variants.pending;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading && payrolls.length === 0) {
    return <FullPageLoader />;
  }


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Payroll Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Process monthly salaries and manage payments
          </p>
        </div>
        <Button
          onClick={() => setShowProcessModal(true)}
          size="lg"
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Process Payroll
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Payrolls</p>
              <p className="text-2xl font-bold">{stats.totalPayroll}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gross Salary</p>
              <p className="text-2xl font-bold">PKR {stats.totalGross.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Salary</p>
              <p className="text-2xl font-bold">PKR {stats.totalNet.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold">{stats.paidCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Branch</label>
            <Dropdown
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              options={[
                { value: 'all', label: 'All Branches' },
                ...branches.map(branch => ({
                  value: branch._id,
                  label: branch.name
                }))
              ]}
              placeholder="Select Branch"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Month</label>
            <Dropdown
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              options={monthNames.map((month, index) => ({
                value: index + 1,
                label: month
              }))}
              placeholder="Select Month"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Year</label>
            <Dropdown
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              options={[2024, 2025, 2026].map(year => ({
                value: year,
                label: year.toString()
              }))}
              placeholder="Select Year"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Dropdown
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'processed', label: 'Processed' },
                { value: 'paid', label: 'Paid' }
              ]}
              placeholder="Select Status"
            />
          </div>
        </div>
      </Card>

      {/* Payroll Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Payroll Records - {monthNames[selectedMonth - 1]} {selectedYear}
          </h2>
          <Badge variant="outline">{payrolls.length} Records</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Gross Salary</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No payroll records found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Process payroll for {monthNames[selectedMonth - 1]} {selectedYear}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                payrolls.map((payroll) => (
                  <TableRow key={payroll._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payroll.teacherId?.firstName} {payroll.teacherId?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payroll.teacherId?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{payroll.branchId?.name}</TableCell>
                    <TableCell>PKR {payroll.basicSalary.toLocaleString()}</TableCell>
                    <TableCell>PKR {payroll.grossSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">
                      PKR {payroll.totalDeductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      PKR {payroll.netSalary.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(payroll.paymentStatus)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadSlip(payroll._id)}
                          disabled={downloading[payroll._id]}
                          className="gap-1"
                        >
                          {downloading[payroll._id] ? (
                            <ButtonLoader />
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              PDF
                            </>
                          )}
                        </Button>
                        
                        {payroll.paymentStatus !== 'paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkPaid(payroll._id)}
                            disabled={markingPaid[payroll._id]}
                            className="gap-1 text-green-600"
                          >
                            {markingPaid[payroll._id] ? (
                              <ButtonLoader />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Mark Paid
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Process Payroll Modal */}
      <Modal
        open={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title={
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6" />
              <span className="text-2xl font-bold">Process Payroll</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </p>
          </div>
        }
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowProcessModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayroll}
              disabled={processing || selectedTeachers.length === 0}
              className="gap-2"
            >
              {processing ? (
                <>
                  <ButtonLoader />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Process Payroll
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">

              {/* Deduction Settings */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Absence Deduction Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Deduction Type</label>
                    <Dropdown
                      value={deductionType}
                      onChange={(e) => setDeductionType(e.target.value)}
                      options={[
                        { value: 'percentage', label: 'Percentage of Basic Salary' },
                        { value: 'fixed', label: 'Fixed Amount per Day' }
                      ]}
                      placeholder="Select Type"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {deductionType === 'percentage' ? 'Percentage (%)' : 'Amount (PKR)'}
                    </label>
                    <Input
                      type="number"
                      value={deductionValue}
                      onChange={(e) => setDeductionValue(e.target.value)}
                      placeholder={deductionType === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
                      min="0"
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  {deductionType === 'percentage' 
                    ? `${deductionValue}% of per-day basic salary will be deducted for each absent day`
                    : `PKR ${deductionValue} will be deducted for each absent day`
                  }
                </p>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-sm font-medium mb-2 block">Remarks (Optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any remarks or notes..."
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>

              {/* Teacher Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Select Teachers</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllTeachers}
                  >
                    {selectedTeachers.length === teachers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {teachers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2" />
                      <p>No active teachers found</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {teachers.map((teacher) => (
                        <label
                          key={teacher._id}
                          className="flex items-center gap-3 p-4 hover:bg-accent cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTeachers.includes(teacher._id)}
                            onChange={() => handleSelectTeacher(teacher._id)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="font-medium">
                              {teacher.firstName} {teacher.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {teacher.email} • {teacher.teacherProfile?.designation || 'Teacher'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              PKR {(teacher.teacherProfile?.salaryDetails?.basicSalary || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Basic Salary</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  {selectedTeachers.length} teacher(s) selected
                </p>
              </div>
            </div>
          </Modal>
    </div>
  );
}
