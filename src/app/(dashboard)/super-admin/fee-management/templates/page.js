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
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import Input from '@/components/ui/input';
import BranchSelect from '@/components/ui/branch-select';
import Dropdown from '@/components/ui/dropdown';
import NestedDropdown from '@/components/ui/dropdown_fixed';
import Tabs, { TabPanel } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';

export default function FeeTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classesList, setClassesList] = useState([]);
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

  const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' },
  ];

  const FREQUENCY_OPTIONS = [
    { value: 'one-time', label: 'One Time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'half-yearly', label: 'Half Yearly' },
    { value: 'annually', label: 'Annually' },
  ];

  const APPLICABLE_OPTIONS = [
    { value: 'all', label: 'All Students' },
    { value: 'class-specific', label: 'Class Specific' },
    { value: 'student-specific', label: 'Student Specific' },
  ];

  const MONTH_OPTIONS = [
    { value: '', label: 'Any Month' },
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
  const [submitting, setSubmitting] = useState(false);

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

  // load classes for selected branch in the form
  const loadClasses = async (branchId) => {
    if (!branchId) {
      setClassesList([]);
      return;
    }
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST, { branchId, limit: 200 });
      if (res && res.success) setClassesList(res.data || []);
    } catch (err) {
      console.error('Error loading classes for branch:', err);
      setClassesList([]);
    }
  };

  useEffect(() => {
    // whenever the branch in the form changes, reload classes for that branch
    if (formData.branchId) {
      loadClasses(formData.branchId);
    } else {
      setClassesList([]);
    }
  }, [formData.branchId]);

  const loadTemplates = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (branchFilter) params.branchId = branchFilter;

      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.LIST, params);

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
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { limit: 100 });
      if (res && res.success) {
        setBranches(res.data.branches);
      }
      console.log('Branches Loaded', res);
      
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
      classes: (template.classes || []).map(c => (c && c._id) ? c._id : c),
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
        ? API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.UPDATE.replace(':id', editingTemplate._id)
        : API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.CREATE;

      const method = editingTemplate ? 'PUT' : 'POST';

      const body = {
        ...formData,
        classes: (formData.classes || []).map(c => (c && c._id) ? c._id : c),
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
        setSubmitting(true);
        if (editingTemplate) {
          response = await apiClient.put(url, body);
        } else {
          response = await apiClient.post(url, body);
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
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error in handleFormSubmit (outer):', error);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.DELETE.replace(':id', templateToDelete._id));
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

  if (loading) return <FullPageLoader message="Loading fee templates..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Templates</h1>
          <p className="text-sm text-gray-600 mt-1">Manage fee structures and templates</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
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

          <Dropdown
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[{ value: '', label: 'All Categories' }, ...feeCategories.map(c => ({ value: c.value, label: c.label }))]}
            placeholder="All Categories"
          />

          <Dropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            placeholder="All Status"
          />

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
                    <Button onClick={() => handleEdit(template)} className="flex-1" variant="outline">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        setTemplateToDelete(template);
                        setShowDeleteModal(true);
                      }}
                      className="flex-1"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Archive
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingTemplate ? 'Edit Fee Template' : 'Create Fee Template'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="template-form" disabled={submitting}>
              {submitting ? <ButtonLoader /> : (editingTemplate ? 'Update Template' : 'Create Template')}
            </Button>
          </div>
        }
      >
        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'basic', label: 'Basic Info' },
            { id: 'details', label: 'Details' },
            { id: 'advanced', label: 'Advanced' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mb-4"
        />

        <form id="template-form" onSubmit={handleFormSubmit} className="space-y-4">
              {/* Basic Info Tab */}
              <TabPanel value="basic" activeTab={activeTab}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Monthly Tuition Fee - Grade 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Code <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        disabled={editingTemplate}
                        placeholder="e.g., TF-G1-M"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        options={feeCategories.map(c => ({ value: c.value, label: c.label }))}
                        placeholder="Select category"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (Rs.) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                      <Dropdown
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                        placeholder="Status"
                      />
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
              </TabPanel>

              {/* Details Tab */}
              <TabPanel value="details" activeTab={activeTab}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <Dropdown
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        options={FREQUENCY_OPTIONS}
                        placeholder="Frequency"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Applicable To
                      </label>
                      <Dropdown
                        value={formData.applicableTo}
                        onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                        options={APPLICABLE_OPTIONS}
                        placeholder="Applicable To"
                      />
                    </div>

                    {formData.applicableTo === 'class-specific' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Classes</label>
                        <NestedDropdown
                          name="classes"
                          options={(classesList || []).map(c => ({ label: c.name, value: c._id }))}
                          value={formData.classes}
                          placeholder="Select classes"
                          multiple={true}
                          onChange={(e) => {
                            const v = e?.target?.value;
                            setFormData({ ...formData, classes: Array.isArray(v) ? v : (v ? [v] : []) });
                          }}
                        />
                      </div>
                    )}
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
                      <Dropdown
                        value={formData.dueDate.month ? String(formData.dueDate.month) : ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          dueDate: { ...formData.dueDate, month: parseInt(e.target.value) || undefined }
                        })}
                        options={MONTH_OPTIONS}
                        placeholder="Any Month"
                      />
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
              </TabPanel>

              {/* Advanced Tab */}
              <TabPanel value="advanced" activeTab={activeTab}>
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
                          <Dropdown
                            value={formData.lateFee.type}
                            onChange={(e) => setFormData({
                              ...formData,
                              lateFee: { ...formData.lateFee, type: e.target.value }
                            })}
                            options={[{ value: 'fixed', label: 'Fixed Amount' }, { value: 'percentage', label: 'Percentage' }]}
                            placeholder="Type"
                          />
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
                            <Dropdown
                              value={formData.discount.type}
                              onChange={(e) => setFormData({
                                ...formData,
                                discount: { ...formData.discount, type: e.target.value }
                              })}
                              options={[{ value: 'fixed', label: 'Fixed Amount' }, { value: 'percentage', label: 'Percentage' }]}
                              placeholder="Type"
                            />
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
                </TabPanel>

              </form>
      </Modal>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Archive Fee Template</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to archive "{templateToDelete?.name}"? This will move it to archived status.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Archive</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
