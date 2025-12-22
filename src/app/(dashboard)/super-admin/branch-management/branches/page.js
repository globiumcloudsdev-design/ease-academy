'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Pakistan',
    postalCode: '',
    establishedDate: '',
    status: 'active',
  });

  useEffect(() => {
    loadBranches();
  }, [searchTerm, statusFilter]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await apiClient.get(`/api/super-admin/branches?${params}`);

      if (response.success) {
        // Handle both nested and direct data structures
        const branchesData = response.data.branches || response.data || [];
        setBranches(branchesData);
      } else {
        toast.error(response.message || 'Failed to load branches');
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      toast.error(error.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'Pakistan',
      postalCode: '',
      establishedDate: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      email: branch.contact?.email || branch.email || '',
      phone: branch.contact?.phone || branch.phone || '',
      address: branch.address?.street || branch.address || '',
      city: branch.address?.city || branch.city || '',
      state: branch.address?.state || branch.state || '',
      country: branch.address?.country || branch.country || 'Pakistan',
      postalCode: branch.address?.zipCode || branch.postalCode || '',
      establishedDate: branch.establishedDate
        ? format(new Date(branch.establishedDate), 'yyyy-MM-dd')
        : '',
      status: branch.status || 'active',
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Transform form data to match Branch model structure
      const branchData = {
        name: formData.name,
        code: formData.code,
        address: {
          street: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          zipCode: formData.postalCode || '',
          country: formData.country || 'Pakistan',
        },
        contact: {
          phone: formData.phone || '',
          email: formData.email || '',
        },
        status: formData.status || 'active',
      };

      // Only add establishedDate if it exists
      if (formData.establishedDate) {
        branchData.establishedDate = formData.establishedDate;
      }

      const url = editingBranch
        ? `/api/super-admin/branches/${editingBranch._id}`
        : '/api/super-admin/branches';

      let response;
      if (editingBranch) {
        response = await apiClient.put(url, branchData);
      } else {
        response = await apiClient.post(url, branchData);
      }

      if (response.success) {
        toast.success(response.message || 'Branch saved successfully');
        setShowModal(false);
        loadBranches();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error(error.message || 'Failed to save branch');
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;

    try {
      const response = await apiClient.delete(`/api/super-admin/branches/${branchToDelete._id}`);

      if (response.success) {
        toast.success('Branch deleted successfully');
        setShowDeleteModal(false);
        setBranchToDelete(null);
        loadBranches();
      } else {
        toast.error(response.message || 'Failed to delete branch');
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error(error.message || 'Failed to delete branch');
    }
  };

  // Calculate totals
  const totalStudents = branches.reduce((sum, b) => sum + (b.stats?.students || 0), 0);
  const totalTeachers = branches.reduce((sum, b) => sum + (b.stats?.teachers || 0), 0);
  const totalStaff = branches.reduce((sum, b) => sum + (b.stats?.staff || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 pt-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all school branches and locations</p>
        </div>
        <Button
          onClick={handleAddNew}
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Branches</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{branches.length}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Students</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Teachers</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalTeachers}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Staff</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalStaff}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="min-w-0">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search branches..."
            />
          </div>

          <Dropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            placeholder={null}
          />
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg border border-gray-200 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No branches found. Create your first branch to get started.</p>
          </div>
        ) : (
          branches.map((branch) => (
            <div key={branch._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-linear-to-r from-blue-500 to-blue-600 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{branch.name}</h3>
                    <p className="text-blue-100 text-sm">Code: {branch.code}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${branch.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {branch.status}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{branch.address?.city || branch.city || 'N/A'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{branch.contact?.phone || branch.phone || 'N/A'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{branch.contact?.email || branch.email || 'N/A'}</span>
                </div>

                {branch.establishedDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Est. {format(new Date(branch.establishedDate), 'MMM yyyy')}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{branch.stats?.students || 0}</p>
                      <p className="text-xs text-gray-600">Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{branch.stats?.teachers || 0}</p>
                      <p className="text-xs text-gray-600">Teachers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{branch.stats?.staff || 0}</p>
                      <p className="text-xs text-gray-600">Staff</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center gap-2">
                  <Button
                    onClick={() => handleEdit(branch)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setBranchToDelete(branch);
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingBranch ? 'Edit Branch' : 'Add New Branch'}
          size="xl"
          footer={(
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="branch-form"
              >
                {editingBranch ? 'Update Branch' : 'Create Branch'}
              </Button>
            </div>
          )}
        >
          <form id="branch-form" onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Main Campus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="MC001"
                  disabled={editingBranch}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="branch@example.com"
                  type="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92-XXX-XXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Lahore"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Punjab"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Pakistan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="54000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Established Date</label>
                <Input
                  type="date"
                  value={formData.establishedDate}
                  onChange={(e) => setFormData({ ...formData, establishedDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Dropdown
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                  placeholder={null}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Branch"
          size="sm"
          footer={(
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
                Delete
              </button>
            </div>
          )}
        >
          <div className="p-4">
            <p className="text-gray-600">
              Are you sure you want to delete "{branchToDelete?.name}"? This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
