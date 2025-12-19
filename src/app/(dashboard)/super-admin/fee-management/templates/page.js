'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Calendar,
  TrendingUp,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import apiClient from '@/lib/api-client';
import Input from '@/components/ui/input';
import BranchSelect from '@/components/ui/branch-select';

export default function FeeTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const feeCategories = [
    { value: 'tuition', label: 'Tuition Fee', color: 'blue' },
    { value: 'admission', label: 'Admission Fee', color: 'green' },
    { value: 'examination', label: 'Examination Fee', color: 'purple' },
    { value: 'transport', label: 'Transport Fee', color: 'yellow' },
    { value: 'library', label: 'Library Fee', color: 'pink' },
    { value: 'laboratory', label: 'Laboratory Fee', color: 'indigo' },
    { value: 'sports', label: 'Sports Fee', color: 'orange' },
    { value: 'hostel', label: 'Hostel Fee', color: 'red' },
    { value: 'miscellaneous', label: 'Miscellaneous', color: 'gray' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'tuition',
    description: '',
    amount: '',
    frequency: 'monthly',
    applicableTo: 'all',
    classes: [],
    dueDate: { day: 1, month: 1 },
    validFrom: '',
    validTo: '',
    lateFee: { enabled: false, type: 'fixed', amount: 0, graceDays: 0 },
    discount: { enabled: false, type: 'fixed', amount: 0, criteria: '' },
    paymentMethods: ['cash', 'bank-transfer', 'online'],
    status: 'active',
    branchId: '',
  });

  useEffect(() => {
    loadData();
  }, [searchTerm, categoryFilter, statusFilter, branchFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadTemplates(), loadBranches()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (branchFilter) params.branchId = branchFilter;

      const res = await apiClient.get('/api/super-admin/fee-templates', params);

      if (res && res.success) {
        setTemplates(res.data);
      } else {
        toast.error(res?.message || 'Failed to load fee templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      const msg = error?.message || 'Failed to load fee templates';
      if (error?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(msg);
      }
    }
  };

  const loadBranches = async () => {
    try {
      const res = await apiClient.get('/api/super-admin/branches', { limit: 100 });
      if (res && res.success) {
        setBranches(res.data);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      const msg = error?.message || 'Failed to load branches';
      if (error?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(msg);
      }
    }
  };

  const handleAddNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      code: '',
      category: 'tuition',
      description: '',
      amount: '',
      frequency: 'monthly',
      applicableTo: 'all',
      classes: [],
      dueDate: { day: 1, month: 1 },
      lateFee: { enabled: false, type: 'fixed', amount: 0, graceDays: 0 },
      discount: { enabled: false, type: 'fixed', amount: 0, criteria: '' },
      paymentMethods: ['cash', 'bank-transfer', 'online'],
      status: 'active',
      branchId: '',
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);

    // normalize any date-like values that were previously stored in `applicableTo`
    const isDateString = (val) => {
      return typeof val === 'string' && !['all', 'class-specific', 'student-specific'].includes(val) && !isNaN(Date.parse(val));
    };

    let applicableToValue = template.applicableTo;
    let validFromValue = template.validFrom ? new Date(template.validFrom).toISOString().slice(0,10) : '';
    let validToValue = template.validTo ? new Date(template.validTo).toISOString().slice(0,10) : '';

    if (isDateString(applicableToValue)) {
      // move old date stored incorrectly under `applicableTo` into `validFrom`
      validFromValue = validFromValue || new Date(applicableToValue).toISOString().slice(0,10);
      applicableToValue = 'all';
    }

    setFormData({
      name: template.name,
      code: template.code,
      category: template.category,
      description: template.description || '',
      amount: (template.amount || 0).toString(),
      frequency: template.frequency,
      applicableTo: applicableToValue || 'all',
      classes: template.classes || [],
      dueDate: template.dueDate || { day: 1, month: 1 },
      validFrom: validFromValue,
      validTo: validToValue,
      lateFee: template.lateFee || { enabled: false, type: 'fixed', amount: 0, graceDays: 0 },
      discount: template.discount || { enabled: false, type: 'fixed', amount: 0, criteria: '' },
      paymentMethods: template.paymentMethods || ['cash', 'bank-transfer', 'online'],
      status: template.status,
      branchId: template.branchId?._id || '',
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      const url = editingTemplate
        ? `/api/super-admin/fee-templates/${editingTemplate._id}`
        : '/api/super-admin/fee-templates';

      const method = editingTemplate ? 'PUT' : 'POST';

      const body = {
        ...formData,
        amount: parseFloat(formData.amount),
        lateFee: {
          ...formData.lateFee,
          amount: parseFloat(formData.lateFee.amount) || 0,
        },
        discount: {
          ...formData.discount,
          amount: parseFloat(formData.discount.amount) || 0,
        },
      };

      // sanitize incorrect date stored under applicableTo from older records
      if (
        body.applicableTo &&
        !['all', 'class-specific', 'student-specific'].includes(body.applicableTo) &&
        !isNaN(Date.parse(body.applicableTo))
      ) {
        body.validFrom = body.validFrom || body.applicableTo;
        body.applicableTo = 'all';
      }

      let response;
      try {
        if (editingTemplate) {
          response = await apiClient.put(`/api/super-admin/fee-templates/${editingTemplate._id}`, body);
        } else {
          response = await apiClient.post(`/api/super-admin/fee-templates`, body);
        }

        if (response && response.success) {
          toast.success(response.message || 'Template saved');
          setShowModal(false);
          loadTemplates();
        } else {
          toast.error(response?.message || 'Operation failed');
        }
      } catch (err) {
        console.error('Error saving template:', err);
        if (err?.status === 401) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(err?.message || 'Failed to save template');
        }
      }
    } catch (error) {
      console.error('Error in handleFormSubmit (outer):', error);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const response = await apiClient.delete(`/api/super-admin/fee-templates/${templateToDelete._id}`);
      if (response && response.success) {
        toast.success('Fee template archived successfully');
        setShowDeleteModal(false);
        setTemplateToDelete(null);
        loadTemplates();
      } else {
        toast.error(response?.message || 'Failed to archive template');
      }
    } catch (err) {
      console.error('Error archiving template:', err);
      if (err?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(err?.message || 'Failed to archive template');
      }
    }
  };

  const getCategoryColor = (category) => {
    return feeCategories.find(c => c.value === category)?.color || 'gray';
  };

  const getCategoryLabel = (category) => {
    return feeCategories.find(c => c.value === category)?.label || category;
  };

  // Calculate stats
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter(t => t.status === 'active').length;
  const totalRevenue = templates.reduce((sum, t) => sum + (t.amount || 0), 0);
  const categoryCounts = feeCategories.map(cat => ({
    ...cat,
    count: templates.filter(t => t.category === cat.value).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Templates</h1>
          <p className="text-sm text-gray-600 mt-1">Manage fee structures and templates</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalTemplates}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Templates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeTemplates}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{feeCategories.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              icon={Search}
            />
          </div> 

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {feeCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>

          <BranchSelect
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            branches={branches}
            placeholder="All Branches"
            className="w-full"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg border border-gray-200 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No fee templates found. Create your first template to get started.</p>
          </div>
        ) : (
          templates.map((template) => {
            const categoryColor = getCategoryColor(template.category);
            return (
              <div key={template._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`bg-${categoryColor}-500 p-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                      <p className="text-white text-opacity-90 text-sm mt-1">Code: {template.code}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        template.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : template.status === 'inactive'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {template.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Category</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${categoryColor}-100 text-${categoryColor}-700`}>
                      {getCategoryLabel(template.category)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="text-lg font-bold text-gray-900">Rs. {template.amount.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Frequency</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{template.frequency}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Applicable To</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{template.applicableTo}</span>
                  </div>

                  {template.branchId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Branch</span>
                      <span className="text-sm font-medium text-gray-900">{template.branchId.name}</span>
                    </div>
                  )}

                  {template.lateFee?.enabled && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                      <AlertCircle className="w-4 h-4" />
                      <span>Late fee: Rs. {template.lateFee.amount}</span>
                    </div>
                  )}

                  {template.discount?.enabled && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                      <TrendingUp className="w-4 h-4" />
                      <span>Discount: Rs. {template.discount.amount}</span>
                    </div>
                  )}

                  {template.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                  )}

                  <div className="pt-3 border-t border-gray-200 flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setTemplateToDelete(template);
                        setShowDeleteModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Fee Template' : 'Create Fee Template'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeTab === 'basic'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeTab === 'details'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('advanced')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeTab === 'advanced'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Advanced
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Monthly Tuition Fee - Grade 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        disabled={editingTemplate}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="e.g., TF-G1-M"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {feeCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (Rs.) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="5000"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Describe the fee template..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch (Optional)
                      </label>
                      <BranchSelect
                        value={formData.branchId}
                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                        branches={branches}
                        placeholder="All Branches"
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <select
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="one-time">One Time</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half-yearly">Half Yearly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Applicable To
                      </label>
                      <select
                        value={formData.applicableTo}
                        onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Students</option>
                        <option value="class-specific">Class Specific</option>
                        <option value="student-specific">Student Specific</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Day
                      </label>
                      <input
                        type="number"
                        value={formData.dueDate.day}
                        onChange={(e) => setFormData({
                          ...formData,
                          dueDate: { ...formData.dueDate, day: parseInt(e.target.value) || 1 }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="31"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Month (Optional)
                      </label>
                      <select
                        value={formData.dueDate.month || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          dueDate: { ...formData.dueDate, month: parseInt(e.target.value) || undefined }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Any Month</option>
                          <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valid From (optional)</label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valid To (optional)</label>
                      <input
                        type="date"
                        value={formData.validTo}
                        onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Methods
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['cash', 'bank-transfer', 'online', 'cheque', 'card'].map(method => (
                        <label key={method} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.paymentMethods.includes(method)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  paymentMethods: [...formData.paymentMethods, method]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  paymentMethods: formData.paymentMethods.filter(m => m !== method)
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">{method.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <>
                  {/* Late Fee */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Late Fee Settings</h3>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.lateFee.enabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            lateFee: { ...formData.lateFee, enabled: e.target.checked }
                          })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enable Late Fee</span>
                      </label>
                    </div>

                    {formData.lateFee.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                          <select
                            value={formData.lateFee.type}
                            onChange={(e) => setFormData({
                              ...formData,
                              lateFee: { ...formData.lateFee, type: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="fixed">Fixed Amount</option>
                            <option value="percentage">Percentage</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount {formData.lateFee.type === 'percentage' && '(%)'}
                          </label>
                          <input
                            type="number"
                            value={formData.lateFee.amount}
                            onChange={(e) => setFormData({
                              ...formData,
                              lateFee: { ...formData.lateFee, amount: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Grace Days</label>
                          <input
                            type="number"
                            value={formData.lateFee.graceDays}
                            onChange={(e) => setFormData({
                              ...formData,
                              lateFee: { ...formData.lateFee, graceDays: parseInt(e.target.value) || 0 }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Discount */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Discount Settings</h3>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.discount.enabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            discount: { ...formData.discount, enabled: e.target.checked }
                          })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enable Discount</span>
                      </label>
                    </div>

                    {formData.discount.enabled && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                              value={formData.discount.type}
                              onChange={(e) => setFormData({
                                ...formData,
                                discount: { ...formData.discount, type: e.target.value }
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="fixed">Fixed Amount</option>
                              <option value="percentage">Percentage</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Amount {formData.discount.type === 'percentage' && '(%)'}
                            </label>
                            <input
                              type="number"
                              value={formData.discount.amount}
                              onChange={(e) => setFormData({
                                ...formData,
                                discount: { ...formData.discount, amount: e.target.value }
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount Criteria
                          </label>
                          <textarea
                            value={formData.discount.criteria}
                            onChange={(e) => setFormData({
                              ...formData,
                              discount: { ...formData.discount, criteria: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="2"
                            placeholder="e.g., Early payment discount, Sibling discount"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Archive Fee Template</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to archive "{templateToDelete?.name}"? This will move it to archived status.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
