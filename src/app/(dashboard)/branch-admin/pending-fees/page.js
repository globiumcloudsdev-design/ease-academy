'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import Tabs, { TabPanel } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  FileText,
  User,
  GraduationCap,
  DollarSign,
  CreditCard,
  Calendar,
  AlertCircle,
  Receipt,
  RefreshCw
} from 'lucide-react';

export default function BranchAdminPendingFeesPage() {
  const { user, loading: authLoading } = useAuth();
  const { execute: request } = useApi();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [approvedPayments, setApprovedPayments] = useState([]);
  const [rejectedPayments, setRejectedPayments] = useState([]);
  const [statistics, setStatistics] = useState({
    pending: { count: 0, totalAmount: 0 },
    approved: { count: 0, totalAmount: 0 },
    rejected: { count: 0, totalAmount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', or 'view'
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  // Helper function to get date range
  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { start: monthStart, end: monthEnd };
      default:
        return null;
    }
  };

  // Filter payments based on date
  const filterPayments = (payments) => {
    if (dateFilter === 'all') return payments;

    const range = getDateRange(dateFilter);
    if (!range) return payments;

    return payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= range.start && paymentDate < range.end;
    });
  };

  // Fetch pending payments
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchPendingPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Token nikaalein
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

        // Fetch call with Authorization header
        const res = await fetch('/api/branch-admin/pending-fees', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const response = await res.json();

        if (response.success) {
          setPendingPayments(response.data || []);
          setApprovedPayments(response.approvedPayments || []);
          setRejectedPayments(response.rejectedPayments || []);
          setStatistics(response.statistics || {
            pending: { count: 0, totalAmount: 0 },
            approved: { count: 0, totalAmount: 0 },
            rejected: { count: 0, totalAmount: 0 },
          });
        } else {
          setError(response.message || "Failed to fetch pending payments");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPayments();
  }, [authLoading, user, request, refreshKey]);

  const handleApprove = (payment) => {
    setSelectedPayment(payment);
    setActionType('approve');
    setRejectionReason('');
    setShowModal(true);
  };

  const handleReject = (payment) => {
    setSelectedPayment(payment);
    setActionType('reject');
    setRejectionReason('');
    setShowModal(true);
  };

  const handleView = (payment) => {
    setSelectedPayment(payment);
    setActionType('view');
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedPayment) return;

    if (actionType === 'reject' && !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const endpoint = actionType === 'approve'
        ? '/api/branch-admin/pending-fees/approve'
        : '/api/branch-admin/pending-fees/reject';

      const payload = {
        voucherId: selectedPayment.voucherId,
        paymentIndex: selectedPayment.paymentIndex,
        ...(actionType === 'reject' && { rejectionReason })
      };

      const response = await request({ url: endpoint, method: 'POST', body: payload });

      if (response.success) {
        setSuccessMessage(
          `Payment ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`
        );
        // Refresh the data to get updated lists and statistics
        setRefreshKey(prev => prev + 1);
        setShowModal(false);
        setSelectedPayment(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.message || `Failed to ${actionType} payment`);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return <FullPageLoader message="Loading pending payments..." />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Pending Fee Payments
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Review and approve/reject student fee payments for your branch
        </p>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={dateFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('all')}
        >
          All
        </Button>
        <Button
          variant={dateFilter === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('today')}
        >
          Today
        </Button>
        <Button
          variant={dateFilter === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('week')}
        >
          This Week
        </Button>
        <Button
          variant={dateFilter === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('month')}
        >
          This Month
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
              <p className="text-3xl font-bold mt-2 text-yellow-600">{statistics.pending.count}</p>
              <p className="text-sm text-muted-foreground mt-1">
                PKR {statistics.pending.totalAmount?.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Approved Payments</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{statistics.approved.count}</p>
              <p className="text-sm text-muted-foreground mt-1">
                PKR {statistics.approved.totalAmount?.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Rejected Payments</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{statistics.rejected.count}</p>
              <p className="text-sm text-muted-foreground mt-1">
                PKR {statistics.rejected.totalAmount?.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 border border-green-200 bg-green-50 text-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending Payments ({statistics.pending.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending fee payments for your branch</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-6 font-semibold text-base">Voucher #</th>
                        <th className="text-left p-6 font-semibold text-base">Student</th>
                        <th className="text-left p-6 font-semibold text-base">Class</th>
                        <th className="text-left p-6 font-semibold text-base">Amount</th>
                        <th className="text-left p-6 font-semibold text-base">Payment Method</th>
                        <th className="text-left p-6 font-semibold text-base">Submitted Date</th>
                        <th className="text-left p-6 font-semibold text-base">Transaction ID</th>
                        <th className="text-left p-6 font-semibold text-base">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterPayments(pendingPayments).map((payment) => (
                        <tr key={payment.paymentId} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-semibold">{payment.voucherNumber}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {payment.studentName}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              {payment.className}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-600">
                                PKR {payment.amount?.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">
                              <CreditCard className="w-3 h-3 mr-1" />
                              {payment.paymentMethod?.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {payment.transactionId}
                            </code>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(payment)} 
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(payment)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(payment)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>

      <TabPanel value="approved" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Approved Payments ({statistics.approved.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No approved fee payments for your branch</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-6 font-semibold">Voucher #</th>
                        <th className="text-left p-6 font-semibold">Student</th>
                        <th className="text-left p-6 font-semibold">Class</th>
                        <th className="text-left p-6 font-semibold">Amount</th>
                        <th className="text-left p-6 font-semibold">Payment Method</th>
                        <th className="text-left p-6 font-semibold">Approved Date</th>
                        <th className="text-left p-6 font-semibold">Transaction ID</th>
                        <th className="text-left p-6 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterPayments(approvedPayments).map((payment) => (
                        <tr key={payment.paymentId} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-semibold">{payment.voucherNumber}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {payment.studentName}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              {payment.className}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-600">
                                PKR {payment.amount?.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">
                              <CreditCard className="w-3 h-3 mr-1" />
                              {payment.paymentMethod?.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {new Date(payment.approvedAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {payment.transactionId}
                            </code>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(payment)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="rejected" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Rejected Payments ({statistics.rejected.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rejectedPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No rejected fee payments for your branch</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-6 font-semibold text-base">Voucher #</th>
                        <th className="text-left p-6 font-semibold text-base">Student</th>
                        <th className="text-left p-6 font-semibold text-base">Class</th>
                        <th className="text-left p-6 font-semibold text-base">Amount</th>
                        <th className="text-left p-6 font-semibold text-base">Payment Method</th>
                        <th className="text-left p-6 font-semibold text-base">Submitted Date</th>
                        <th className="text-left p-6 font-semibold text-base">Transaction ID</th>
                        <th className="text-left p-6 font-semibold text-base">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterPayments(rejectedPayments).map((payment) => (
                        <tr key={payment.paymentId} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-semibold">{payment.voucherNumber}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {payment.studentName}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              {payment.className}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-600">
                                PKR {payment.amount?.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">
                              <CreditCard className="w-3 h-3 mr-1" />
                              {payment.paymentMethod?.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {payment.transactionId}
                            </code>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(payment)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>

      {/* Action Modal */}
      {showModal && selectedPayment && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={
            actionType === 'view' ? 'View Payment Details' :
            actionType === 'approve' ? 'Approve Payment' :
            'Reject Payment'
          }
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <div>
                  <Label className="text-sm font-medium">Voucher Number</Label>
                  <p className="font-semibold">{selectedPayment?.voucherNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <Label className="text-sm font-medium">Student Name</Label>
                  <p>{selectedPayment?.studentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-gray-500" />
                <div>
                  <Label className="text-sm font-medium">Class</Label>
                  <p>{selectedPayment?.className}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="font-semibold text-green-600">
                    PKR {selectedPayment?.amount?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <Badge variant="secondary">
                    {selectedPayment?.paymentMethod?.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <Label className="text-sm font-medium">Submitted Date</Label>
                  <p>{new Date(selectedPayment?.paymentDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-gray-500" />
                <div>
                  <Label className="text-sm font-medium">Transaction ID</Label>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {selectedPayment?.transactionId}
                  </code>
                </div>
              </div>
            </div>

            {/* Display rejection reason for rejected payments */}
            {selectedPayment?.status === 'rejected' && selectedPayment?.rejectedReason && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Rejection Reason
                </Label>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{selectedPayment.rejectedReason}</p>
                </div>
              </div>
            )}

            {/* Display screenshot */}
            {selectedPayment?.screenshotUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Payment Receipt
                </Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img
                    src={selectedPayment.screenshotUrl}
                    alt="Payment receipt"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              </div>
            )}

            {actionType === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Reason for Rejection
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={4}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
              >
                {actionType === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {actionType !== 'view' && (
                <Button
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                  className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                  variant={actionType === 'reject' ? 'destructive' : 'default'}
                >
                  {actionLoading ? (
                    actionType === 'approve' ? 'Approving...' : 'Rejecting...'
                  ) : (
                    <>
                      {actionType === 'approve' ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </>
                      )}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
