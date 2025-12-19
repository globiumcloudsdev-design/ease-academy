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
import { Plus, Edit, Trash2, Search, DollarSign, Copy, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const FEE_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annually', label: 'Semi-Annually' },
  { value: 'annually', label: 'Annually' },
  { value: 'one-time', label: 'One-Time' },
];

const FEE_TYPES = [
  { value: 'tuition', label: 'Tuition Fee' },
  { value: 'admission', label: 'Admission Fee' },
  { value: 'exam', label: 'Exam Fee' },
  { value: 'library', label: 'Library Fee' },
  { value: 'transport', label: 'Transport Fee' },
  { value: 'activity', label: 'Activity Fee' },
  { value: 'lab', label: 'Lab Fee' },
  { value: 'hostel', label: 'Hostel Fee' },
  { value: 'other', label: 'Other' },
];

export default function FeeTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    feeType: 'tuition',
    baseAmount: '',
    frequency: 'monthly',
    isActive: true,
    applicableFrom: '',
    applicableTo: '',
    components: [],
  });

  const [newComponent, setNewComponent] = useState({
    name: '',
    amount: '',
    isMandatory: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, [search, typeFilter, pagination.page]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (typeFilter) params.feeType = typeFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_TEMPLATES.LIST, params);
      if (response.success) {
        setTemplates(response.data.feeTemplates);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleComponentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewComponent((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const addComponent = () => {
    if (!newComponent.name || !newComponent.amount) {
      alert('Please fill in component name and amount');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      components: [...prev.components, { ...newComponent }],
    }));
    setNewComponent({ name: '', amount: '', isMandatory: true });
  };

  const removeComponent = (index) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode) {
        const response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.FEE_TEMPLATES.UPDATE.replace(':id', currentTemplate._id),
          formData
        );
        if (response.success) {
          alert('Fee template updated successfully!');
          setIsModalOpen(false);
          fetchTemplates();
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.FEE_TEMPLATES.CREATE, formData);
        if (response.success) {
          alert('Fee template created successfully!');
          setIsModalOpen(false);
          fetchTemplates();
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to save fee template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name || '',
      description: template.description || '',
      feeType: template.feeType || 'tuition',
      baseAmount: template.baseAmount || '',
      frequency: template.frequency || 'monthly',
      isActive: template.isActive !== undefined ? template.isActive : true,
      applicableFrom: template.applicableFrom ? template.applicableFrom.split('T')[0] : '',
      applicableTo: template.applicableTo ? template.applicableTo.split('T')[0] : '',
      components: template.components || [],
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this fee template?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.FEE_TEMPLATES.DELETE.replace(':id', id));
      if (response.success) {
        alert('Fee template deleted successfully!');
        fetchTemplates();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete fee template');
    }
  };

  const handleClone = (template) => {
    setCurrentTemplate(null);
    setFormData({
      name: template.name + ' (Copy)',
      description: template.description || '',
      feeType: template.feeType || 'tuition',
      baseAmount: template.baseAmount || '',
      frequency: template.frequency || 'monthly',
      isActive: true,
      applicableFrom: '',
      applicableTo: '',
      components: template.components || [],
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      description: '',
      feeType: 'tuition',
      baseAmount: '',
      frequency: 'monthly',
      isActive: true,
      applicableFrom: '',
      applicableTo: '',
      components: [],
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const calculateTotalAmount = (template) => {
    const base = parseFloat(template.baseAmount) || 0;
    const componentTotal = (template.components || []).reduce((sum, comp) => sum + (parseFloat(comp.amount) || 0), 0);
    return base + componentTotal;
  };

  if (loading && templates.length === 0) {
    return <FullPageLoader message="Loading fee templates..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Fee Templates Management</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[{ value: '', label: 'All Types' }, ...FEE_TYPES]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Base Amount</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No fee templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <span className="capitalize">{template.feeType}</span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{template.frequency}</span>
                    </TableCell>
                    <TableCell>PKR {parseFloat(template.baseAmount).toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">
                      PKR {calculateTotalAmount(template).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {template.branchId ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Building2 className="w-3 h-3" />
                          Branch
                        </span>
                      ) : (
                        <span className="text-xs text-purple-600">School-Wide</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleClone(template)} title="Clone">
                          <Copy className="w-4 h-4" />
                        </Button>
                        {template.branchId && template.branchId === user?.branchId && (
                          <>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(template)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(template._id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
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
              Showing {templates.length} of {pagination.total} templates
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
        title={isEditMode ? 'Edit Fee Template' : 'Add New Fee Template'}
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
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Template Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
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
              <label className="block text-sm font-medium mb-1">Fee Type *</label>
              <Dropdown name="feeType" value={formData.feeType} onChange={handleInputChange} options={FEE_TYPES} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Frequency *</label>
              <Dropdown
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                options={FEE_FREQUENCIES}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Base Amount (PKR) *</label>
            <input
              type="number"
              name="baseAmount"
              value={formData.baseAmount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Applicable From</label>
              <input
                type="date"
                name="applicableFrom"
                value={formData.applicableFrom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Applicable To</label>
              <input
                type="date"
                name="applicableTo"
                value={formData.applicableTo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium">Active Template</label>
          </div>

          {/* Fee Components Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Fee Components (Optional)</h3>
            
            {/* Existing Components */}
            {formData.components.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.components.map((comp, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <span className="flex-1">{comp.name}</span>
                    <span className="font-medium">PKR {parseFloat(comp.amount).toLocaleString()}</span>
                    <span className="text-xs text-gray-500">{comp.isMandatory ? 'Mandatory' : 'Optional'}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeComponent(index)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Component */}
            <div className="space-y-2">
              <input
                type="text"
                name="name"
                placeholder="Component name (e.g., Lab Fee)"
                value={newComponent.name}
                onChange={handleComponentChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  value={newComponent.amount}
                  onChange={handleComponentChange}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  min="0"
                  step="0.01"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isMandatory"
                    checked={newComponent.isMandatory}
                    onChange={handleComponentChange}
                    className="w-4 h-4"
                  />
                  <label className="text-sm">Mandatory</label>
                </div>
                <Button type="button" variant="outline" onClick={addComponent}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Total Amount Display */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Template Amount:</span>
              <span className="text-lg font-bold text-blue-600">
                PKR{' '}
                {(
                  parseFloat(formData.baseAmount || 0) +
                  formData.components.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
