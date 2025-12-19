'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Plus, Search, DollarSign, Trash2, Eye, ChevronDown, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function FeeVouchersPage() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    templateId: '',
    classId: '',
    studentIds: [],
    selectAllStudents: false,
    dueDate: '',
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    remarks: '',
  });

  useEffect(() => {
    fetchVouchers();
  }, [search, statusFilter, monthFilter, yearFilter, pagination.page]);

  useEffect(() => {
    if (isGenerateModalOpen) {
      fetchTemplates();
      fetchClasses();
    }
  }, [isGenerateModalOpen]);

  useEffect(() => {
    if (formData.classId) {
      fetchStudents();
    }
  }, [formData.classId]);

  // Close student dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (studentDropdownOpen && !e.target.closest('.student-dropdown-container')) {
        setStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [studentDropdownOpen]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (statusFilter) params.status = statusFilter;
      if (monthFilter) params.month = monthFilter;
      if (yearFilter) params.year = yearFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.LIST, params);
      if (response.success) {
        setVouchers(response.data.vouchers || []);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_TEMPLATES.LIST, { limit: 200, status: 'active' });
      if (response.success) {
        setTemplates(response.data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, { limit: 200 });
      if (response.success) {
        setClasses(response.data.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchStudents = async () => {
    try {
      const params = { limit: 500, classId: formData.classId };
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST, params);
      if (response.success) {
        setStudents(response.data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const handleGenerateVouchers = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.templateId) {
        toast.error('Please select a fee template');
        return;
      }

      if (!formData.dueDate) {
        toast.error('Please select a due date');
        return;
      }

      const studentIds = formData.selectAllStudents 
        ? students.map(s => s._id) 
        : formData.studentIds;

      if (studentIds.length === 0) {
        toast.error('Please select at least one student');
        return;
      }

      const payload = {
        templateId: formData.templateId,
        studentIds,
        dueDate: formData.dueDate,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        remarks: formData.remarks,
      };

      const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.CREATE, payload);
      if (response.success) {
        toast.success(response.message || 'Fee vouchers generated successfully!');
        if (response.data.errors && response.data.errors.length > 0) {
          toast.warning(`${response.data.errors.length} vouchers skipped (already exist)`);
        }
        setIsGenerateModalOpen(false);
        resetForm();
        fetchVouchers();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate vouchers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelVoucher = async (id) => {
    if (!confirm('Are you sure you want to cancel this voucher?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.DELETE.replace(':id', id));
      if (response.success) {
        toast.success('Voucher cancelled successfully!');
        fetchVouchers();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to cancel voucher');
    }
  };

  const resetForm = () => {
    setFormData({
      templateId: '',
      classId: '',
      studentIds: [],
      selectAllStudents: false,
      dueDate: '',
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      remarks: '',
    });
    setStudents([]);
  };

  const handleOpenGenerateModal = () => {
    resetForm();
    setIsGenerateModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading && vouchers.length === 0) {
    return <FullPageLoader message="Loading fee vouchers..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Vouchers Management</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Generate and manage fee vouchers for students</p>
            </div>
            <Button onClick={handleOpenGenerateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Vouchers
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search vouchers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
            <Dropdown
              placeholder="Filter by month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              options={[{ value: '', label: 'All Months' }, ...MONTHS]}
            />
            <Input
              type="number"
              placeholder="Year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    No fee vouchers found
                  </TableCell>
                </TableRow>
              ) : (
                vouchers.map((voucher) => (
                  <TableRow key={voucher._id}>
                    <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{voucher.studentId?.name}</div>
                        <div className="text-xs text-gray-500">{voucher.studentId?.rollNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{voucher.templateId?.name}</div>
                      <div className="text-xs text-gray-500">{voucher.templateId?.code}</div>
                    </TableCell>
                    <TableCell>
                      {MONTHS.find(m => m.value === voucher.month.toString())?.label} {voucher.year}
                    </TableCell>
                    <TableCell>
                      {new Date(voucher.dueDate).toLocaleDateString('en-PK')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      PKR {voucher.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      PKR {voucher.paidAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(voucher.status)}`}>
                        {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {voucher.status !== 'paid' && voucher.status !== 'cancelled' && (
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            onClick={() => handleCancelVoucher(voucher._id)}
                            title="Cancel Voucher"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {vouchers.length} of {pagination.total} vouchers
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Vouchers Modal */}
      <Modal
        open={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Fee Vouchers"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateVouchers} disabled={submitting}>
              {submitting ? <ButtonLoader /> : 'Generate Vouchers'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleGenerateVouchers} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fee Template *</label>
              <Dropdown
                value={formData.templateId}
                onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                options={[
                  { value: '', label: 'Select Template' },
                  ...templates.map(template => ({
                    value: template._id,
                    label: `${template.name} - PKR ${template.amount}`
                  }))
                ]}
                placeholder="Select Template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Class *</label>
              <Dropdown
                value={formData.classId}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, classId: e.target.value, studentIds: [], selectAllStudents: false }));
                }}
                options={[
                  { value: '', label: 'Select Class' },
                  ...classes.map(cls => ({
                    value: cls._id,
                    label: `${cls.name} (${cls.code})`
                  }))
                ]}
                placeholder="Select Class"
              />
            </div>
          </div>

          {/* Student Selection */}
          {formData.classId && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Students *</label>
              
              <div className="mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.selectAllStudents}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      selectAllStudents: e.target.checked,
                      studentIds: e.target.checked ? students.map(s => s._id) : []
                    }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Select All Students ({students.length})</span>
                </label>
              </div>

              {!formData.selectAllStudents && (
                <div className="relative student-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <span className="text-gray-700">
                      {formData.studentIds.length === 0
                        ? 'Select students...'
                        : `${formData.studentIds.length} student${formData.studentIds.length > 1 ? 's' : ''} selected`}
                    </span>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </button>

                  {studentDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {students.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No students found</div>
                      ) : (
                        students.map((student) => {
                          const isSelected = formData.studentIds.includes(student._id);
                          return (
                            <label
                              key={student._id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      studentIds: [...prev.studentIds, student._id]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      studentIds: prev.studentIds.filter(id => id !== student._id)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-xs text-gray-500">{student.rollNumber}</div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Students Badges */}
              {formData.studentIds.length > 0 && !formData.selectAllStudents && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.studentIds.slice(0, 5).map((studentId) => {
                    const student = students.find((s) => s._id === studentId);
                    if (!student) return null;
                    return (
                      <span
                        key={studentId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                      >
                        {student.name}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              studentIds: prev.studentIds.filter(id => id !== studentId)
                            }));
                          }}
                          className="hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {formData.studentIds.length > 5 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{formData.studentIds.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month *</label>
              <Dropdown
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                options={MONTHS}
                placeholder="Select Month"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Year *</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                min="2020"
                max="2050"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Summary */}
          {formData.templateId && formData.studentIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Generation Summary:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Template: {templates.find(t => t._id === formData.templateId)?.name}</li>
                <li>• Students: {formData.studentIds.length} selected</li>
                <li>• Period: {MONTHS.find(m => m.value === formData.month)?.label} {formData.year}</li>
                <li>• Total Vouchers: {formData.studentIds.length}</li>
              </ul>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
