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
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import Dropdown from '@/components/ui/dropdown';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import Tabs, { TabPanel } from '@/components/ui/tabs';
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
  Building2,
  Filter,
  RefreshCw,
  AlertTriangle,
  Search,
  MoreHorizontal,
  EyeIcon,
  Download,
  Trash2
} from 'lucide-react';

export default function SuperAdminPendingFeesPage() {
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
  const [branchFilter, setBranchFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch pending payments
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchPendingPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Token nikaalein (Check karein aapka token localStorage mein kis naam se hai)
        // Aksar 'token' ya 'auth-token' naam se hota hai
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

        // 2. Fetch call with Authorization header
        const res = await fetch('/api/super-admin/pending-fees', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Token yahan ja raha hai
          }
        });

        const response = await res.json();
        console.log('Final Response with Auth:', response);

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
          // Agar abhi bhi auth error aaye, toh iska matlab token nahi mila ya expire ho gaya
          setError(response.message || "Session expired, please login again.");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPayments();
  }, [authLoading, user, refreshKey]);

  // Fetch branches and classes for filter
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await request('/api/super-admin/branches');
        if (response.success) {
          setBranches(response.data.branches || []);
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      }
    };

    const fetchClasses = async () => {
      try {
        const response = await request('/api/super-admin/classes');
        if (response.success) {
          setClasses(response.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };

    if (user?.role === 'super_admin') {
      fetchBranches();
      fetchClasses();
    }
  }, [user, request]);

  const handleView = (payment) => {
    console.log('View button clicked for payment:', payment);
    setSelectedPayment(payment);
    setActionType('view');
    setShowModal(true);
  };

  const handleApprove = (payment) => {
    console.log('Approve button clicked for payment:', payment);
    setSelectedPayment(payment);
    setActionType('approve');
    setRejectionReason('');
    setShowModal(true);
  };

  const handleReject = (payment) => {
    console.log('Reject button clicked for payment:', payment);
    setSelectedPayment(payment);
    setActionType('reject');
    setRejectionReason('');
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedPayment) return;

    // Validate rejection reason for reject action
    if (actionType === 'reject') {
      const trimmedReason = rejectionReason.trim();
      if (!trimmedReason) {
        setError('Rejection reason is required');
        return;
      }
    }

    try {
      setActionLoading(true);
      setError(null);

      const endpoint = actionType === 'approve'
        ? '/api/super-admin/pending-fees/approve'
        : '/api/super-admin/pending-fees/reject';

      // Build payload exactly as backend expects
      const payload = {
        paymentId: `${selectedPayment.voucherId}-${selectedPayment.paymentIndex}`,
      };

      // Add remarks for reject action (required) or approve action (optional)
      if (actionType === 'reject') {
        payload.remarks = rejectionReason.trim();
      } else if (actionType === 'approve' && rejectionReason.trim()) {
        payload.remarks = rejectionReason.trim();
      }

      console.log('Action:', actionType);
      console.log('Endpoint:', endpoint);
      console.log('Payload:', payload);

      // Use direct fetch with proper error handling
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const fetchResponse = await fetch(`${window.location.origin}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Fetch Response Status:', fetchResponse.status);

      const response = await fetchResponse.json();
      console.log('API Response:', response);

      if (response.success) {
        setSuccessMessage(
          `Payment ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`
        );
        // Refresh the data to get updated lists and statistics
        setRefreshKey(prev => prev + 1);
        setShowModal(false);
        setSelectedPayment(null);
        setRejectionReason(''); // Clear rejection reason
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.error('API Error:', response.message);
        setError(response.message || `Failed to ${actionType} payment`);
      }
    } catch (err) {
      console.error('Network/Parse Error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter payments by branch and class
  const filteredPayments = pendingPayments.filter(payment => {
    const matchesBranch = !branchFilter || payment.branchName === branchFilter;
    const matchesClass = !classFilter || payment.className === classFilter;
    return matchesBranch && matchesClass;
  });

  const getPaymentMethodBadgeColor = (method) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bank-transfer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'online': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'cheque': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'card': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (authLoading || loading) {
    return <FullPageLoader message="Loading pending fee payments..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="w-full lg:w-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Pending Fee Payments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Review and approve/reject student fee payments across all branches
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3 w-full lg:w-auto">
            <Dropdown
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              options={[
                { value: '', label: 'All Branches' },
                ...branches.map(branch => ({
                  value: branch.name,
                  label: branch.name
                }))
              ]}
              placeholder="Filter by Branch"
              className="w-full min-w-[180px]"
            />
            <Dropdown
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map(cls => ({
                  value: cls.name,
                  label: cls.name
                }))
              ]}
              placeholder="Filter by Class"
              className="w-full min-w-[180px]"
            />
          </div>
          <Button onClick={() => setRefreshKey(prev => prev + 1)} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
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

      {/* Error/Success Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          </CardContent>
        </Card>
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
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending fee payments for your branch</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center p-4 font-semibold text-base">Branch</th>
                      <th className="text-center p-4 font-semibold text-base">Voucher #</th>
                      <th className="text-center p-4 font-semibold text-base">Student</th>
                      <th className="text-center p-4 font-semibold text-base">Class</th>
                      <th className="text-center p-4 font-semibold text-base">Amount</th>
                      <th className="text-center p-4 font-semibold text-base">Payment Method</th>
                      <th className="text-center p-4 font-semibold text-base">Submitted Date</th>
                      <th className="text-center p-4 font-semibold text-base">Transaction ID</th>
                      <th className="text-center p-4 font-semibold text-base">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.paymentId} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {payment.branchName}
                          </Badge>
                        </td>
                        <td className="p-6 font-semibold text-base">{payment.voucherNumber}</td>
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
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(payment)}
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
                      <th className="text-left p-6 font-semibold">Branch</th>
                      <th className="text-left p-6 font-semibold">Voucher #</th>
                      <th className="text-left p-6 font-semibold">Student</th>
                      <th className="text-left p-6 font-semibold">Class</th>
                      <th className="text-left p-6 font-semibold">Amount</th>
                      <th className="text-left p-6 font-semibold">Payment Method</th>
                      <th className="text-left p-6 font-semibold">Approved Date</th>
                      <th className="text-left p-6 font-semibold">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedPayments.map((payment) => (
                      <tr key={payment.paymentId} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {payment.branchName}
                          </Badge>
                        </td>
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
                      <th className="text-left p-4 font-semibold text-xl">Branch</th>
                      <th className="text-left p-4 font-semibold text-base">Voucher #</th>
                      <th className="text-left p-4 font-semibold text-base">Student</th>
                      <th className="text-left p-4 font-semibold text-base">Class</th>
                      <th className="text-left p-4 font-semibold text-base">Amount</th>
                      <th className="text-left p-4 font-semibold text-base">Payment Method</th>
                      <th className="text-left p-4 font-semibold text-base">Submitted Date</th>
                      <th className="text-left p-4 font-semibold text-base">Transaction ID</th>
                      <th className="text-left p-4 font-semibold text-base">Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedPayments.map((payment) => (
                      <tr key={payment.paymentId} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {payment.branchName}
                          </Badge>
                        </td>
                        <td className="p-6 font-semibold text-base">{payment.voucherNumber}</td>
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
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">
                              {payment.rejectedReason || 'No reason provided'}
                            </span>
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
                <DollarSign className="w-5 h-5 text-green-600" />
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
