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
import BranchSelect from '@/components/ui/branch-select';
import { Plus, Search, DollarSign, Trash2, Eye, ChevronDown, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import { generateFeeVoucherPDF } from '@/lib/pdf-generator';

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

export default function SuperAdminFeeVouchersPage() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    branchId: '',
    templateId: '',
    classId: '',
    studentIds: [],
    selectAllStudents: false,
    dueDate: '',
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    remarks: '',
  });

  const formatStudent = (student) => {
    const nameRaw = student?.fullName || `${student?.firstName || ''} ${student?.lastName || ''}`;
    const name = (nameRaw || 'Student').trim() || 'Student';
    const registrationNumber = student?.studentProfile?.registrationNumber || student?.registrationNumber || '—';
    const rollNumber = student?.studentProfile?.rollNumber || student?.rollNumber || '—';
    const section = student?.studentProfile?.section || '—';
    return { name, registrationNumber, rollNumber, section };
  };

  useEffect(() => {
    fetchVouchers();
  }, [search, statusFilter, monthFilter, yearFilter, pagination.page]);

  useEffect(() => {
    if (isGenerateModalOpen) {
      fetchBranches();
      // templates/classes loaded after branch selection
    }
  }, [isGenerateModalOpen]);

  useEffect(() => {
    if (formData.branchId) {
      fetchTemplates();
      fetchClasses();
    } else {
      setTemplates([]);
      setClasses([]);
    }
  }, [formData.branchId]);

  useEffect(() => {
    if (formData.classId) fetchStudents();
  }, [formData.classId]);

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
      const params = { page: pagination.page, limit: pagination.limit, search };
      if (statusFilter) params.status = statusFilter;
      if (monthFilter) params.month = monthFilter;
      if (yearFilter) params.year = yearFilter;
      if (formData.branchId) params.branchId = formData.branchId;

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.LIST, params);
      if (response && response.success) {
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

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { limit: 200 });
      if (res && res.success) setBranches(res.data.branches || []);
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

  const fetchTemplates = async () => {
    if (!formData.branchId) return;
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.LIST, { branchId: formData.branchId, limit: 200, status: 'active' });
      if (res && res.success) setTemplates(res.data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
      toast.error('Failed to load templates');
    }
  };

  const fetchClasses = async () => {
    if (!formData.branchId) return;
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST, { branchId: formData.branchId, limit: 200 });
      if (res && res.success) setClasses(res.data || []);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = { limit: 500, classId: formData.classId, branchId: formData.branchId };
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.LIST, params);
      if (res && res.success) setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error loading students:', err);
      toast.error('Failed to load students');
    }
  };

  const fetchVoucherDetail = async (id) => {
    setViewLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.GET.replace(':id', id));
      if (res?.success) setViewingVoucher(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load voucher');
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleGenerateVouchers = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.branchId) return toast.error('Please select a branch');
      if (!formData.templateId) return toast.error('Please select a fee template');
      if (!formData.dueDate) return toast.error('Please select a due date');

      // Student selection is now optional - backend will auto-select based on template
      // If studentIds provided, use them; otherwise backend uses template applicableTo
      const payload = {
        branchId: formData.branchId,
        templateId: formData.templateId,
        dueDate: formData.dueDate,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        remarks: formData.remarks,
      };

      // Only include studentIds if manually selected (backward compatibility)
      if (formData.studentIds.length > 0 || formData.selectAllStudents) {
        const studentIds = formData.selectAllStudents ? students.map(s => s._id) : formData.studentIds;
        payload.studentIds = studentIds;
      }

      const res = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.CREATE, payload);
      if (res && res.success) {
        toast.success(res.message || 'Fee vouchers generated successfully!');
        if (res.data?.errors && res.data.errors.length > 0) {
          console.warn('Some vouchers failed:', res.data.errors);
          toast.warning(`${res.data.errors.length} vouchers failed - check console for details`);
        }
        setIsGenerateModalOpen(false);
        resetForm();
        fetchVouchers();
      }
    } catch (err) {
      console.error('Error generating vouchers:', err);
      toast.error(err?.message || 'Failed to generate vouchers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelVoucher = async (id) => {
    if (!confirm('Are you sure you want to cancel this voucher?')) return;
    try {
      const res = await apiClient.delete(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.DELETE.replace(':id', id));
      if (res && res.success) {
        toast.success('Voucher cancelled successfully!');
        fetchVouchers();
      }
    } catch (err) {
      console.error('Error cancelling voucher:', err);
      toast.error(err?.message || 'Failed to cancel voucher');
    }
  };

  const resetForm = () => {
    setFormData({
      branchId: '',
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

  const handleViewVoucher = (id) => {
    setViewingVoucher(null);
    setIsViewModalOpen(true);
    fetchVoucherDetail(id);
  };

  const handleDownloadVoucher = async (voucher) => {
    try {
      // If we don't have full voucher data, fetch it
      if (!voucher.studentId?.fullName && !voucher.studentId?.firstName) {
        const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.GET.replace(':id', voucher._id));
        if (res?.success) {
          generateFeeVoucherPDF(res.data);
        }
      } else {
        generateFeeVoucherPDF(voucher);
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  if (loading && vouchers.length === 0) return <FullPageLoader message="Loading fee vouchers..." />;

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Fee Vouchers (Super Admin)</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Generate and manage fee vouchers across branches</p>
            </div>
            <Button
              onClick={handleOpenGenerateModal}
              className="mt-2 sm:mt-0 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate Vouchers
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Input placeholder="Search vouchers..." value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} />
            <Dropdown placeholder="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
            <Dropdown placeholder="Filter by month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} options={[{ value: '', label: 'All Months' }, ...MONTHS]} />
            <Input type="number" placeholder="Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} />
            <BranchSelect value={formData.branchId} onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))} branches={branches} placeholder="All Branches (optional)" />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">No fee vouchers found</TableCell>
                </TableRow>
              ) : (
                vouchers.map((voucher) => (
                  <TableRow key={voucher._id}>
                    <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                    <TableCell>
                      {(() => {
                        const { name, registrationNumber, rollNumber, section } = formatStudent(voucher.studentId);
                        return (
                          <div>
                            <div className="font-medium">{name}</div>
                            <div className="text-xs text-gray-500">
                              Reg: {registrationNumber} | Roll: {rollNumber} | Sec: {section}
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{voucher.templateId?.name}</div>
                      <div className="text-xs text-gray-500">{voucher.templateId?.code}</div>
                    </TableCell>
                    <TableCell>{voucher.branchId?.name}</TableCell>
                    <TableCell>{MONTHS.find(m => m.value === voucher.month.toString())?.label} {voucher.year}</TableCell>
                    <TableCell>{new Date(voucher.dueDate).toLocaleDateString('en-PK')}</TableCell>
                    <TableCell className="font-semibold">PKR {voucher.totalAmount.toLocaleString()}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(voucher.status)}`}>{voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => handleViewVoucher(voucher._id)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon-sm" title="Download PDF" onClick={() => handleDownloadVoucher(voucher)}><Download className="w-4 h-4" /></Button>
                        {voucher.status !== 'paid' && voucher.status !== 'cancelled' && (
                          <Button variant="ghost" size="icon-sm" onClick={() => handleCancelVoucher(voucher._id)} title="Cancel Voucher"><Trash2 className="w-4 h-4 text-red-600" /></Button>
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
            <div className="text-sm text-gray-600">Showing {vouchers.length} of {pagination.total} vouchers</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page >= pagination.pages}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Voucher Modal */}
      <Modal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Voucher Details"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleDownloadVoucher(viewingVoucher)}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </div>
        }
      >
        {viewLoading ? (
          <div className="py-6 text-center text-gray-600">Loading voucher...</div>
        ) : viewingVoucher ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Voucher Number</p>
                <p className="font-semibold">{viewingVoucher.voucherNumber}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold capitalize">{viewingVoucher.status}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const { name, registrationNumber, rollNumber, section } = formatStudent(viewingVoucher.studentId);
                return (
                  <React.Fragment>
                    <div className="bg-white border rounded-lg p-3">
                      <p className="text-xs text-gray-500">Student</p>
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm text-gray-600">
                        Reg: {registrationNumber} | Roll: {rollNumber} | Sec: {section}
                      </p>
                    </div>
                    <div className="bg-white border rounded-lg p-3">
                      <p className="text-xs text-gray-500">Class</p>
                      <p className="font-semibold">{viewingVoucher.classId?.name || '—'}</p>
                      <p className="text-sm text-gray-600">{viewingVoucher.classId?.code || ''}</p>
                    </div>
                  </React.Fragment>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Template</p>
                <p className="font-semibold">{viewingVoucher.templateId?.name || '—'}</p>
                <p className="text-sm text-gray-600">{viewingVoucher.templateId?.code || ''}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="font-semibold">{viewingVoucher.dueDate ? new Date(viewingVoucher.dueDate).toLocaleDateString('en-PK') : '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-3">
                <p className="text-xs text-gray-500">Amount Breakdown</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Base: PKR {viewingVoucher.amount?.toLocaleString?.() || viewingVoucher.amount || 0}</li>
                  <li>Discount: PKR {viewingVoucher.discountAmount?.toLocaleString?.() || 0}</li>
                  <li>Late Fee: PKR {viewingVoucher.lateFeeAmount?.toLocaleString?.() || 0}</li>
                  <li className="font-semibold">Total: PKR {viewingVoucher.totalAmount?.toLocaleString?.() || viewingVoucher.totalAmount || 0}</li>
                </ul>
              </div>
              <div className="bg-white border rounded-lg p-3">
                <p className="text-xs text-gray-500">Payment Status</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Paid: PKR {viewingVoucher.paidAmount?.toLocaleString?.() || 0}</li>
                  <li>Remaining: PKR {((viewingVoucher.remainingAmount ?? viewingVoucher.totalAmount) || 0).toLocaleString?.() || 0}</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-gray-600">No voucher selected.</div>
        )}
      </Modal>

      {/* Generate Vouchers Modal */}
      <Modal open={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Generate Fee Vouchers" footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateVouchers} disabled={submitting}>{submitting ? <ButtonLoader /> : 'Generate Vouchers'}</Button>
        </div>
      }>
        <form onSubmit={handleGenerateVouchers} className="space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Auto-Selection Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <strong className="font-semibold">Smart Auto-Selection:</strong> Students are automatically selected based on template settings (all/class-specific). Manual selection is optional.
                <ul className="mt-1 ml-4 list-disc text-xs">
                  <li>Late fees are auto-calculated for unpaid vouchers</li>
                  <li>Discounts applied automatically per template</li>
                  <li>Email notifications sent to students & guardians</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Branch *</label>
              <BranchSelect value={formData.branchId} onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value, templateId: '', classId: '', studentIds: [], selectAllStudents: false }))} branches={branches} placeholder="Select Branch" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fee Template *</label>
              <Dropdown value={formData.templateId} onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))} options={[{ value: '', label: 'Select Template' }, ...templates.map(t => ({ value: t._id, label: `${t.name} - PKR ${t.amount}` }))]} placeholder="Select Template" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class (Optional)</label>
              <Dropdown value={formData.classId} onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value, studentIds: [], selectAllStudents: false }))} options={[{ value: '', label: 'Auto-select from template' }, ...classes.map(c => ({ value: c._id, label: `${c.name} (${c.code})` }))]} placeholder="Auto-select from template" />
              <p className="text-xs text-gray-500 mt-1">Leave empty to auto-select based on template</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Manual Student Selection (Optional)</label>
              <div className="mb-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.selectAllStudents} onChange={(e) => setFormData(prev => ({ ...prev, selectAllStudents: e.target.checked, studentIds: e.target.checked ? students.map(s => s._id) : [] }))} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm">Select All Students ({students.length})</span>
                </label>
              </div>

              {!formData.selectAllStudents && (
                <div className="relative student-dropdown-container">
                  <button type="button" onClick={() => setStudentDropdownOpen(!studentDropdownOpen)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <span className="text-gray-700">{formData.studentIds.length === 0 ? 'Select students...' : `${formData.studentIds.length} student${formData.studentIds.length > 1 ? 's' : ''} selected`}</span>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </button>

                  {studentDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {students.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No students found</div>
                      ) : (
                        students.map((student) => {
                          const isSelected = formData.studentIds.includes(student._id);
                          const { name, rollNumber } = formatStudent(student);
                          return (
                            <label key={student._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors">
                              <input type="checkbox" checked={isSelected} onChange={(e) => {
                                if (e.target.checked) setFormData(prev => ({ ...prev, studentIds: [...prev.studentIds, student._id] }));
                                else setFormData(prev => ({ ...prev, studentIds: prev.studentIds.filter(id => id !== student._id) }));
                              }} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{name}</div>
                                <div className="text-xs text-gray-500">{rollNumber}</div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              {formData.studentIds.length > 0 && !formData.selectAllStudents && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.studentIds.slice(0, 5).map((studentId) => {
                    const student = students.find(s => s._id === studentId);
                    if (!student) return null;
                    const { name } = formatStudent(student);
                    return (
                      <span key={studentId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                        {name}
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, studentIds: prev.studentIds.filter(id => id !== studentId) }))} className="hover:text-blue-900">×</button>
                      </span>
                    );
                  })}
                  {formData.studentIds.length > 5 && <span className="text-xs text-gray-500 px-2 py-1">+{formData.studentIds.length - 5} more</span>}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month *</label>
              <Dropdown value={formData.month} onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))} options={MONTHS} placeholder="Select Month" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Year *</label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                placeholder="Year"
                min="2020"
                max="2050"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date *</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                placeholder="Due Date"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
            <Input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Any additional notes..."
            />
          </div>

          {formData.templateId && formData.studentIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Generation Summary:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Template: {templates.find(t => t._id === formData.templateId)?.name}</li>
                <li>• Branch: {branches.find(b => b._id === formData.branchId)?.name}</li>
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
