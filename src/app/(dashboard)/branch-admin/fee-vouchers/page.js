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
import Tabs, { TabPanel } from '@/components/ui/tabs';
import { Plus, Search, DollarSign, Trash2, Eye, ChevronDown, Download, CreditCard, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
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

export default function FeeVouchersPage() {
    const { user } = useAuth();
    const [vouchers, setVouchers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [viewingVoucher, setViewingVoucher] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
    
    // Tabs state for Pending, Approved, Rejected
    const [activeTab, setActiveTab] = useState('pending');
    const [statistics, setStatistics] = useState({
        pending: { count: 0 },
        approved: { count: 0 },
        rejected: { count: 0 },
    });

    const [selectedVoucherForPayment, setSelectedVoucherForPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentRemarks, setPaymentRemarks] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);

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
    }, [search, statusFilter, monthFilter, yearFilter, pagination.page, activeTab]);

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
            
            // Map tabs to status values
            const statusMap = {
                'pending': 'pending',
                'approved': 'paid',
                'rejected': 'cancelled'
            };
            
            // For tabs, use specific status, otherwise use the filter
            if (activeTab && statusMap[activeTab]) {
                params.status = statusMap[activeTab];
            } else if (statusFilter) {
                params.status = statusFilter;
            }
            
            if (monthFilter) params.month = monthFilter;
            if (yearFilter) params.year = yearFilter;

            const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.LIST, params);
            if (response.success) {
                setVouchers(response.data.vouchers || []);
                setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
                
                // Fetch statistics
                try {
                    const statsResponse = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.LIST, { 
                        limit: 1, 
                        status: 'pending' 
                    });
                    const approvedResponse = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.LIST, { 
                        limit: 1, 
                        status: 'paid' 
                    });
                    const rejectedResponse = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.LIST, { 
                        limit: 1, 
                        status: 'cancelled' 
                    });
                    
                    setStatistics({
                        pending: { count: statsResponse.data?.pagination?.total || 0 },
                        approved: { count: approvedResponse.data?.pagination?.total || 0 },
                        rejected: { count: rejectedResponse.data?.pagination?.total || 0 },
                    });
                } catch (statsError) {
                    console.error('Error fetching statistics:', statsError);
                }
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

    const fetchVoucherDetail = async (id) => {
        setViewLoading(true);
        try {
            const res = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.GET.replace(':id', id));
            if (res?.success) setViewingVoucher(res.data);
        } catch (error) {
            toast.error(error.message || 'Failed to load voucher');
            setIsViewModalOpen(false);
        } finally {
            setViewLoading(false);
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

            // Student selection is now optional - backend will auto-select based on template
            const payload = {
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

            const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.CREATE, payload);
            if (response.success) {
                toast.success(response.message || 'Fee vouchers generated successfully!');
                if (response.data.errors && response.data.errors.length > 0) {
                    console.warn('Some vouchers failed:', response.data.errors);
                    toast.warning(`${response.data.errors.length} vouchers failed - check console for details`);
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

    const handleOpenManualPayment = (voucher) => {
        setSelectedVoucherForPayment(voucher);
        // Set default payment amount to remaining amount
        const remainingAmount = voucher.remainingAmount ?? (voucher.totalAmount - voucher.paidAmount);
        setPaymentAmount(remainingAmount.toString());
        setPaymentRemarks('');
        setIsManualPaymentModalOpen(true);
    };

    const handleManualPayment = async (e) => {
        e.preventDefault();
        
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        const amount = parseFloat(paymentAmount);
        const remainingAmount = selectedVoucherForPayment.remainingAmount ?? (selectedVoucherForPayment.totalAmount - selectedVoucherForPayment.paidAmount);
        
        if (amount > remainingAmount) {
            toast.error('Payment amount cannot exceed remaining amount');
            return;
        }

        setProcessingPayment(true);

        try {
            const response = await apiClient.post(
                API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.MANUAL_PAYMENT.replace(':id', selectedVoucherForPayment._id),
                {
                    amount: amount,
                    paymentMethod: 'cash',
                    remarks: paymentRemarks,
                    paymentDate: new Date().toISOString()
                }
            );

            if (response.success) {
                toast.success('Payment recorded successfully!');
                setIsManualPaymentModalOpen(false);
                fetchVouchers();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to process payment');
        } finally {
            setProcessingPayment(false);
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

    const handleViewVoucher = (id) => {
        setViewingVoucher(null);
        setIsViewModalOpen(true);
        fetchVoucherDetail(id);
    };

    const handleDownloadVoucher = async (voucher) => {
        try {
            // If we don't have full voucher data, fetch it
            if (!voucher.studentId?.fullName && !voucher.studentId?.firstName) {
                const res = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_VOUCHERS.GET.replace(':id', voucher._id));
                console.log('Generate PDF Voucher', res);

                if (res?.success) {
                    const pdfBuffer = generateFeeVoucherPDF(res.data);
                    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `fee-voucher-${res.data.voucherNumber}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            } else {
                const pdfBuffer = generateFeeVoucherPDF(voucher);
                const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `fee-voucher-${voucher.voucherNumber}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            toast.error('Failed to generate PDF');
            console.log('Generate PDF Voucher Error', error);
        }
    };

    if (loading && vouchers.length === 0) {
        return <FullPageLoader message="Loading fee vouchers..." />;
    }

    // VoucherTable component
    const VoucherTable = ({ vouchers, loading, pagination, setPagination }) => {
        if (loading && vouchers.length === 0) {
            return (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        return (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b bg-gray-50 dark:bg-gray-800">
                                <th className="text-left p-4 font-semibold text-sm">Voucher #</th>
                                <th className="text-left p-4 font-semibold text-sm">Student</th>
                                <th className="text-left p-4 font-semibold text-sm">Template</th>
                                <th className="text-left p-4 font-semibold text-sm">Month/Year</th>
                                <th className="text-left p-4 font-semibold text-sm">Due Date</th>
                                <th className="text-left p-4 font-semibold text-sm">Amount</th>
                                <th className="text-left p-4 font-semibold text-sm">Paid</th>
                                <th className="text-left p-4 font-semibold text-sm">Status</th>
                                <th className="text-left p-4 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center p-8 text-gray-500">
                                        No fee vouchers found for this category
                                    </td>
                                </tr>
                            ) : (
                                vouchers.map((voucher) => (
                                    <tr key={voucher._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="p-4 font-medium text-sm">{voucher.voucherNumber}</td>
                                        <td className="p-4">
                                            {(() => {
                                                const { name, registrationNumber, rollNumber, section } = formatStudent(voucher.studentId);
                                                return (
                                                    <div>
                                                        <div className="font-medium text-sm">{name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            Reg: {registrationNumber} | Roll: {rollNumber} | Sec: {section}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">{voucher.templateId?.name || '—'}</div>
                                            <div className="text-xs text-gray-500">{voucher.templateId?.code || ''}</div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            {MONTHS.find(m => m.value === voucher.month?.toString())?.label || '—'} {voucher.year}
                                        </td>
                                        <td className="p-4 text-sm">
                                            {voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString('en-PK') : '—'}
                                        </td>
                                        <td className="p-4 font-semibold text-sm">
                                            PKR {voucher.totalAmount?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-4 text-sm">
                                            PKR {voucher.paidAmount?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(voucher.status)}`}>
                                                {voucher.status?.charAt(0).toUpperCase() + voucher.status?.slice(1) || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    title="View Details" 
                                                    onClick={() => handleViewVoucher(voucher._id)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    title="Download PDF" 
                                                    onClick={() => handleDownloadVoucher(voucher)}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    title="Manual Payment" 
                                                    onClick={() => handleOpenManualPayment(voucher)}
                                                >
                                                    <CreditCard className="w-4 h-4 text-green-600" />
                                                </Button>
                                                {voucher.status !== 'paid' && voucher.status !== 'cancelled' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCancelVoucher(voucher._id)}
                                                        title="Cancel Voucher"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t">
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
            </>
        );
    };

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <Card>
                <CardHeader className="border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                <CardContent className="space-y-4">
                    {/* Search and Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by voucher number, student name, or registration..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {search && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        
                        {/* Month Filter */}
                        <select
                            value={monthFilter}
                            onChange={(e) => {
                                setMonthFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Months</option>
                            {MONTHS.map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </select>
                        
                        {/* Year Filter */}
                        <select
                            value={yearFilter}
                            onChange={(e) => {
                                setYearFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Years</option>
                            {[2024, 2025, 2026, 2027, 2028].map(year => (
                                <option key={year} value={year.toString()}>{year}</option>
                            ))}
                        </select>
                        
                        {/* Refresh Button */}
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fetchVouchers()}
                        >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Refresh
                        </Button>
                    </div>

                    {/* Tabs */}
                    <Tabs
                        tabs={[
                            {
                                id: 'pending',
                                label: `Pending (${statistics.pending.count})`,
                                icon: <Clock className="w-4 h-4" />
                            },
                            {
                                id: 'approved',
                                label: `Approved (${statistics.approved.count})`,
                                icon: <CheckCircle className="w-4 h-4" />
                            },
                            {
                                id: 'rejected',
                                label: `Rejected (${statistics.rejected.count})`,
                                icon: <XCircle className="w-4 h-4" />
                            }
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />

                    <TabPanel value="pending" activeTab={activeTab}>
                        <VoucherTable vouchers={vouchers} loading={loading} pagination={pagination} setPagination={setPagination} />
                    </TabPanel>

                    <TabPanel value="approved" activeTab={activeTab}>
                        <VoucherTable vouchers={vouchers} loading={loading} pagination={pagination} setPagination={setPagination} />
                    </TabPanel>

                    <TabPanel value="rejected" activeTab={activeTab}>
                        <VoucherTable vouchers={vouchers} loading={loading} pagination={pagination} setPagination={setPagination} />
                    </TabPanel>
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
                            <label className="block text-sm font-medium mb-1">Class (Optional)</label>
                            <Dropdown
                                value={formData.classId}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, classId: e.target.value, studentIds: [], selectAllStudents: false }));
                                }}
                                options={[
                                    { value: '', label: 'Auto-select from template' },
                                    ...classes.map(cls => ({
                                        value: cls._id,
                                        label: `${cls.name} (${cls.code})`
                                    }))
                                ]}
                                placeholder="Auto-select from template"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to auto-select based on template</p>
                        </div>
                    </div>

                    {/* Student Selection */}
                    {formData.classId && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Manual Student Selection (Optional)</label>

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
                                                    const { name, registrationNumber, rollNumber, section } = formatStudent(student);
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
                                                                <div className="font-medium text-gray-900">{name}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    Reg: {registrationNumber} | Roll: {rollNumber} | Sec: {section}
                                                                </div>
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
                                        const { name } = formatStudent(student);
                                        return (
                                            <span
                                                key={studentId}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                                            >
                                                {name}
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

            {/* Manual Payment Modal */}
            <Modal
                open={isManualPaymentModalOpen}
                onClose={() => setIsManualPaymentModalOpen(false)}
                title="Record Manual Payment"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsManualPaymentModalOpen(false)} disabled={processingPayment}>
                            Cancel
                        </Button>
                        <Button onClick={handleManualPayment} disabled={processingPayment}>
                            {processingPayment ? <ButtonLoader /> : 'Record Payment'}
                        </Button>
                    </div>
                }
            >
                {selectedVoucherForPayment && (
                    <div className="space-y-4">
                        {/* Voucher Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-blue-600">Voucher Number</p>
                                    <p className="font-semibold text-blue-900">{selectedVoucherForPayment.voucherNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600">Student</p>
                                    <p className="font-semibold text-blue-900">
                                        {selectedVoucherForPayment.studentId?.fullName || 
                                         `${selectedVoucherForPayment.studentId?.firstName || ''} ${selectedVoucherForPayment.studentId?.lastName || ''}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500">Total Amount</p>
                                <p className="font-semibold">PKR {selectedVoucherForPayment.totalAmount?.toLocaleString() || 0}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500">Already Paid</p>
                                <p className="font-semibold text-green-600">PKR {selectedVoucherForPayment.paidAmount?.toLocaleString() || 0}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500">Remaining Amount</p>
                                <p className="font-semibold text-red-600">PKR {((selectedVoucherForPayment.remainingAmount ?? (selectedVoucherForPayment.totalAmount - selectedVoucherForPayment.paidAmount)) || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <form onSubmit={handleManualPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Amount *</label>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter payment amount"
                                    min="1"
                                    max={(selectedVoucherForPayment.remainingAmount ?? (selectedVoucherForPayment.totalAmount - selectedVoucherForPayment.paidAmount))}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Max: PKR {((selectedVoucherForPayment.remainingAmount ?? (selectedVoucherForPayment.totalAmount - selectedVoucherForPayment.paidAmount)) || 0).toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Method</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                                    defaultValue="cash"
                                    disabled
                                >
                                    <option value="cash">Cash</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
                                <textarea
                                    value={paymentRemarks}
                                    onChange={(e) => setPaymentRemarks(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    rows="2"
                                    placeholder="Any additional notes..."
                                />
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
        </div>
    );
}

