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
import { Plus, Edit, Trash2, Search, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const EXPENSE_CATEGORIES = [
  { value: 'salary', label: 'Salary' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'online', label: 'Online' },
];

const PAYMENT_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState({ totalAmount: 0, totalPaid: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    paidAmount: 0,
    vendor: {
      name: '',
      contact: '',
      email: '',
    },
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter, statusFilter, pagination.page]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.paymentStatus = statusFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EXPENSES.LIST, params);
      if (response.success) {
        setExpenses(response.data.expenses);
        setPagination(response.data.pagination);
        setSummary(response.data.summary || { totalAmount: 0, totalPaid: 0 });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('vendor.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        vendor: { ...prev.vendor, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode) {
        const response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.EXPENSES.UPDATE.replace(':id', currentExpense._id),
          formData
        );
        if (response.success) {
          alert('Expense updated successfully!');
          setIsModalOpen(false);
          fetchExpenses();
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.EXPENSES.CREATE, formData);
        if (response.success) {
          alert('Expense created successfully!');
          setIsModalOpen(false);
          fetchExpenses();
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    setCurrentExpense(expense);
    setFormData({
      title: expense.title || '',
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || 'other',
      date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod || 'cash',
      paymentStatus: expense.paymentStatus || 'pending',
      paidAmount: expense.paidAmount || 0,
      vendor: expense.vendor || { name: '', contact: '', email: '' },
      notes: expense.notes || '',
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.EXPENSES.DELETE.replace(':id', id));
      if (response.success) {
        alert('Expense deleted successfully!');
        fetchExpenses();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete expense');
    }
  };

  const handleAddNew = () => {
    setCurrentExpense(null);
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      paidAmount: 0,
      vendor: { name: '', contact: '', email: '' },
      notes: '',
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  if (loading && expenses.length === 0) {
    return <FullPageLoader message="Loading expenses..." />;
  }

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">${summary.totalAmount?.toLocaleString()}</p>
              </div>
              <Wallet className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">${summary.totalPaid?.toLocaleString()}</p>
              </div>
              <Wallet className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  ${((summary.totalAmount || 0) - (summary.totalPaid || 0)).toLocaleString()}
                </p>
              </div>
              <Wallet className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Expenses Management</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[{ value: '', label: 'All Categories' }, ...EXPENSE_CATEGORIES]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All Status' }, ...PAYMENT_STATUS]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell>${expense.amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">${expense.paidAmount?.toLocaleString()}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          expense.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : expense.paymentStatus === 'partially_paid'
                            ? 'bg-yellow-100 text-yellow-700'
                            : expense.paymentStatus === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {expense.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(expense)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(expense._id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
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
              Showing {expenses.length} of {pagination.total} expenses
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

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Expense' : 'Add New Expense'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <ButtonLoader /> : isEditMode ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Paid Amount</label>
              <input
                type="number"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <Dropdown
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                options={EXPENSE_CATEGORIES}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <Dropdown
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                options={PAYMENT_METHODS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Status</label>
              <Dropdown
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleInputChange}
                options={PAYMENT_STATUS}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Vendor Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Vendor Name</label>
                <input
                  type="text"
                  name="vendor.name"
                  value={formData.vendor.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact</label>
                  <input
                    type="text"
                    name="vendor.contact"
                    value={formData.vendor.contact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="vendor.email"
                    value={formData.vendor.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
