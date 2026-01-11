'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import Image from 'next/image';

export default function PendingFeesPage() {
  const { user, loading: authLoading } = useAuth();
  const { execute: request } = useApi();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch pending payments
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchPendingPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await request('/api/branch-admin/pending-fees');
        if (response.success) {
          setPendingPayments(response.data || []);
        } else {
          setError(response.message || 'Failed to fetch pending payments');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPayments();
  }, [authLoading, user, request]);

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

  const handleConfirmAction = async () => {
    if (!selectedPayment) return;

    if (actionType === 'reject' && !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const endpoint =
        actionType === 'approve'
          ? '/api/branch-admin/pending-fees/approve'
          : '/api/branch-admin/pending-fees/reject';

      const payload = {
        voucherId: selectedPayment.voucherId,
        paymentIndex: selectedPayment.paymentIndex,
        ...(actionType === 'reject' && { rejectionReason }),
      };

      const response = await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.success) {
        setSuccessMessage(
          `Payment ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`
        );
        // Remove the payment from the list
        setPendingPayments(pendingPayments.filter(p => p.paymentId !== selectedPayment.paymentId));
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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', fontSize: '18px', color: '#666' }}>Loading pending payments...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#333' }}>Pending Fee Payments</h1>
        <p style={{ margin: '0', color: '#666' }}>Review and approve/reject student fee payments submitted by parents</p>
      </div>

      {error && (
        <div style={{ padding: '10px', marginBottom: '20px', border: '1px solid', borderRadius: '4px', backgroundColor: '#fee', color: '#c33', borderColor: '#fcc' }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{ padding: '10px', marginBottom: '20px', border: '1px solid', borderRadius: '4px', backgroundColor: '#efe', color: '#3c3', borderColor: '#cfc' }}>
          {successMessage}
        </div>
      )}

      {pendingPayments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No pending fee payments</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Voucher #</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Student Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Class</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Payment Method</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Submitted Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Transaction ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.map((payment) => (
                <tr key={payment.paymentId}>
                  <td style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <strong>{payment.voucherNumber}</strong>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{payment.studentName}</td>
                  <td style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{payment.className}</td>
                  <td style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold', color: '#28a745' }}>
                    <strong>{payment.currency || '₹'} {payment.amount?.toFixed(2)}</strong>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                      {payment.paymentMethod?.replace('-', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <code>{payment.transactionId}</code>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.3s', backgroundColor: '#28a745', color: 'white' }}
                        onClick={() => handleApprove(payment)}
                      >
                        Approve
                      </button>
                      <button
                        style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.3s', backgroundColor: '#dc3545', color: 'white' }}
                        onClick={() => handleReject(payment)}
                      >
                        Reject
                      </button>
                      <button
                        style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.3s', backgroundColor: '#6c757d', color: 'white' }}
                        onClick={() => setSelectedPayment(payment)}
                        title="View receipt"
                      >
                        📄
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => !actionLoading && setShowModal(false)}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, color: '#333' }}>{actionType === 'approve' ? 'Approve Payment' : 'Reject Payment'}</h2>

            <div style={{ marginBottom: '16px' }}>
              <p>
                <strong>Voucher:</strong> {selectedPayment.voucherNumber}
              </p>
              <p>
                <strong>Student:</strong> {selectedPayment.studentName}
              </p>
              <p>
                <strong>Amount:</strong> {selectedPayment.currency || '₹'}{' '}
                {selectedPayment.amount?.toFixed(2)}
              </p>
              <p>
                <strong>Payment Method:</strong>{' '}
                {selectedPayment.paymentMethod?.replace('-', ' ').toUpperCase()}
              </p>
              <p>
                <strong>Transaction ID:</strong> {selectedPayment.transactionId}
              </p>

              {/* Display screenshot */}
              {selectedPayment.screenshotUrl && (
                <div style={{ marginTop: '16px' }}>
                  <p>
                    <strong>Payment Receipt:</strong>
                  </p>
                  <div
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '8px',
                      maxHeight: '300px',
                      overflow: 'auto',
                    }}
                  >
                    <img
                      src={selectedPayment.screenshotUrl}
                      alt="Payment receipt"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                </div>
              )}

              {actionType === 'reject' && (
                <div style={{ marginTop: '16px' }}>
                  <label>
                    <strong>Reason for Rejection:</strong>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginTop: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.3s', backgroundColor: '#6c757d', color: 'white' }}
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.3s', backgroundColor: actionType === 'approve' ? '#28a745' : '#dc3545', color: 'white' }}
                onClick={handleConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading
                  ? actionType === 'approve'
                    ? 'Approving...'
                    : 'Rejecting...'
                  : actionType === 'approve'
                  ? 'Approve'
                  : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
