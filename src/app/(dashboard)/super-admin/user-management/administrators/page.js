'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import BranchSelect from '@/components/ui/branch-select';
import GenderSelect from '@/components/ui/gender-select';
import DocumentTypeSelect from '@/components/ui/document-type-select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { Plus, Search, Edit, Trash2, Eye, UserCog, Mail, Phone, MapPin, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import Tabs, { TabPanel } from '@/components/ui/tabs';

export default function AdministratorsPage() {
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'branch_admin',
    branchId: '',
    isActive: true,
    dateOfBirth: '',
    gender: '',
    nationality: 'Pakistani',
    cnic: '',
    religion: '',
    bloodGroup: '',
    address: { street: '', city: '', state: '', postalCode: '' },
  });

  const [activeTab, setActiveTab] = useState(1);
  const TOTAL_TABS = 3;
  const [profileFile, setProfileFile] = useState(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);
  const [uploadedAdminDocTypes, setUploadedAdminDocTypes] = useState([]);

  const ADMIN_DOC_TYPES = ['cnic', 'id_card', 'cv', 'certificate', 'photo', 'other'];

  useEffect(() => {
    loadAdmins();
    loadBranches();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.USERS.LIST}?role=branch_admin`);

      if (response?.success) {
        // Handle different response structures
        const adminData = Array.isArray(response.data)
          ? response.data
          : (response.data?.users || response.data?.data || []);
        setAdmins(adminData);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error('Failed to load administrators:', error);
      toast.error('Failed to load administrators');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST}?limit=200`);

      if (response?.success) {
        const branchList = response.data?.branches || response.data || [];
        setBranches(branchList);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
      toast.error('Failed to load branches');
    }
  };

  // Filter branches that don't have admins assigned
  const updateAvailableBranches = (currentAdminBranchId = null) => {
    const assignedBranchIds = admins
      .filter(admin => admin.role === 'branch_admin' && admin.branchId)
      .map(admin => typeof admin.branchId === 'object' ? admin.branchId._id : admin.branchId);

    // If editing, include the current admin's branch
    const available = branches.filter(branch => {
      const branchId = branch._id;
      return !assignedBranchIds.includes(branchId) || branchId === currentAdminBranchId;
    });

    setAvailableBranches(available);
  };

  const handleAddNew = () => {
    setEditingAdmin(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'branch_admin',
      branchId: '',
      isActive: true,
      dateOfBirth: '',
      gender: '',
      nationality: 'Pakistani',
      cnic: '',
      religion: '',
      bloodGroup: '',
      address: { street: '', city: '', state: '', postalCode: '' },
      permissions: [],
    });
    updateAvailableBranches();
    setUploadedAdminDocTypes([]);
    setProfileFile(null);
    setDocFile(null);
    setShowModal(true);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    const currentBranchId = admin.branchId?._id || admin.branchId || '';
    setFormData({
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      email: admin.email || '',
      phone: admin.phone || '',
      password: '', // Leave empty for edit
      role: admin.role || 'branch_admin',
      branchId: currentBranchId,
      isActive: admin.isActive !== false,
      dateOfBirth: admin.dateOfBirth ? new Date(admin.dateOfBirth).toISOString().slice(0,10) : '',
      gender: admin.gender || '',
      nationality: admin.nationality || 'Pakistani',
      cnic: admin.cnic || '',
      religion: admin.religion || '',
      bloodGroup: admin.bloodGroup || '',
      address: {
        street: admin.address?.street || '',
        city: admin.address?.city || '',
        state: admin.address?.state || '',
        postalCode: admin.address?.postalCode || '',
      },
      
    });
    updateAvailableBranches(currentBranchId);
    // Populate uploaded admin document types (if any)
    const existingAdminDocs = admin.adminProfile?.documents || admin.documents || [];
    setUploadedAdminDocTypes(existingAdminDocs.map(d => d.type));
    setShowModal(true);
  };

  const handleDelete = async (adminId) => {
    if (!confirm('Are you sure you want to delete this administrator?')) return;

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.SUPER_ADMIN.USERS.DELETE.replace(':id', adminId)
      );

      if (response?.success) {
        toast.success('Administrator deleted successfully');
        loadAdmins();
      } else {
        toast.error(response?.message || 'Failed to delete administrator');
      }
    } catch (error) {
      toast.error('Failed to delete administrator');
      console.error(error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    if (!formData.phone) {
      toast.error('Phone is required');
      return;
    }

    if (!formData.dateOfBirth) {
      toast.error('Date of birth is required');
      return;
    }

    if (!formData.gender) {
      toast.error('Gender is required');
      return;
    }

    if (!editingAdmin && !formData.password) {
      toast.error('Password is required for new administrator');
      return;
    }

    if (!editingAdmin && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'branch_admin' && !formData.branchId) {
      toast.error('Please select a branch for branch admin');
      return;
    }

    try {
      setSubmitting(true);

      const url = editingAdmin
        ? API_ENDPOINTS.SUPER_ADMIN.USERS.UPDATE.replace(':id', editingAdmin._id)
        : API_ENDPOINTS.SUPER_ADMIN.USERS.CREATE;

      // Build request body
      const body = {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || '',
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality || 'Pakistani',
        cnic: formData.cnic || undefined,
        religion: formData.religion || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        address: {
          street: formData.address?.street || undefined,
          city: formData.address?.city || undefined,
          state: formData.address?.state || undefined,
          postalCode: formData.address?.postalCode || undefined,
        },
        role: formData.role,
        branchId: formData.role === 'branch_admin' ? formData.branchId : undefined,
        isActive: formData.isActive,
        status: formData.isActive ? 'active' : 'inactive',
        // adminProfile intentionally omitted (permissions removed)
      };

      // Only include password if it's provided
      if (formData.password) {
        body.password = formData.password;
      }

      console.log('Creating/Updating user with data:', body);
      const response = editingAdmin
        ? await apiClient.put(url, body)
        : await apiClient.post(url, body);

      if (response?.success) {
        toast.success(editingAdmin ? 'Administrator updated successfully' : 'Administrator created successfully');

        // If created and files are waiting to be uploaded, upload them now using returned user id
        const createdUser = response.data;
        if (!editingAdmin && createdUser) {
          try {
            if (profileFile) {
              const fd = new FormData();
              fd.append('file', profileFile);
              fd.append('fileType', 'profile');
              fd.append('userId', createdUser._id);
              await apiClient.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            if (docFile && formData && formData.selectedDocumentType) {
              const fd2 = new FormData();
              fd2.append('file', docFile);
              fd2.append('fileType', 'admin_document');
              fd2.append('documentType', formData.selectedDocumentType);
              fd2.append('userId', createdUser._id);
              await apiClient.post('/api/upload', fd2, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
          } catch (uploadErr) {
            console.error('Post-create upload failed:', uploadErr);
            toast.error('Profile/document upload failed. You can upload from edit later.');
          }
        }

        setShowModal(false);
        loadAdmins();
        loadBranches(); // Reload to update available branches
      } else {
        toast.error(response?.message || 'Failed to save administrator');
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      toast.error(error?.message || 'Failed to save administrator. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.phone?.includes(searchTerm)
  );

  const isLastTab = activeTab === TOTAL_TABS;

  const modalFooter = (
    <div className="flex justify-between items-center w-full">
      <div>
        {activeTab > 1 && (
          <Button variant="ghost" onClick={() => setActiveTab((s) => Math.max(1, s - 1))}>
            Back
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>
          Cancel
        </Button>
        {!isLastTab && (
          <Button onClick={() => setActiveTab((s) => Math.min(TOTAL_TABS, s + 1))}>
            Next
          </Button>
        )}
        {isLastTab && (
          <Button type="submit" disabled={submitting} onClick={handleFormSubmit}>
            {submitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              editingAdmin ? 'Update Administrator' : 'Create Administrator'
            )}
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Administrators Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Manage system and branch administrators
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Branch Admins</p>
                <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
              </div>
              <UserCog className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {admins.filter(a => a.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">
                  {admins.filter(a => a.status === 'inactive').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned Branches</p>
                <p className="text-2xl font-bold text-purple-600">
                  {admins.filter(a => a.branchId).length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <Input
            icon={Search}
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth={true}
          />
        </CardContent>
      </Card>

      {/* Administrators Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <CardTitle className="text-lg sm:text-xl">All Administrators ({filteredAdmins.length})</CardTitle>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Administrator</span>
              <span className="sm:hidden">Add Admin</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead className="hidden sm:table-cell min-w-[200px]">Contact</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[150px]">Branch</TableHead>
                <TableHead className="min-w-[80px]">Status</TableHead>
                <TableHead className="hidden xl:table-cell">Last Login</TableHead>
                <TableHead className="text-right min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No administrators found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => (
                  <TableRow key={admin._id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                          <UserCog className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{admin.fullName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {admin._id.slice(-6)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-2" />
                          {admin.email}
                        </div>
                        {admin.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-2" />
                            {admin.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Branch Admin
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <span>{admin.branchId?.name || 'Not Assigned'}</span>
                      </div>
                      {admin.branchId?.city && (
                        <p className="text-xs text-gray-400">{admin.branchId.city}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${admin.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                        {admin.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button size="icon-sm" variant="ghost" onClick={() => { setViewingAdmin(admin); setShowViewModal(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleEdit(admin)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleDelete(admin._id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingAdmin ? 'Edit Administrator' : 'Add New Administrator'}
        size="lg"
        footer={modalFooter}
      >
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {editingAdmin ? 'Update administrator information' : 'Create a new administrator account'}
          </div>

          <div className="space-y-5">
            <Tabs
              tabs={[
                  { id: 1, label: 'Personal' },
                  { id: 2, label: 'Account' },
                  { id: 3, label: 'Profile' },
                ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id)}
              className="mb-4"
            />

            <TabPanel value={1} activeTab={activeTab}>
              {/* Personal Information Section */}
              <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <GenderSelect
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target?.value ?? e })}
                  placeholder="Select gender"
                  className="w-full"
                />
              </div>
            </div>

            {!editingAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!editingAdmin}
                  minLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>
            )}

            {editingAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty to keep current password"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only fill this if you want to change the password
                </p>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value={2} activeTab={activeTab}>
          {/* Account Configuration Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Account Configuration
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch Assignment <span className="text-red-500">*</span>
              </label>
              <BranchSelect
                id="branchId"
                name="branchId"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target?.value ?? e })}
                branches={availableBranches}
                placeholder="Select Branch"
                className="w-full"
              />
              {availableBranches.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ All branches already have administrators assigned
                </p>
              )}
              {availableBranches.length > 0 && !editingAdmin && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ✓ {availableBranches.length} branch{availableBranches.length > 1 ? 'es' : ''} available without admin
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong className="font-semibold">Branch Admin</strong> will manage all operations for the assigned branch only.
              </p>
            </div>
          </div>
        </TabPanel>

        <TabPanel value={3} activeTab={activeTab}>
          {/* Account Status & Permissions Section */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Profile Photo Upload */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profile Photo</h4>
              {editingAdmin && editingAdmin.profilePhoto?.url ? (
                <div className="flex items-center gap-3">
                  <img src={editingAdmin.profilePhoto.url} alt="profile" className="w-20 h-20 rounded-full object-cover" />
                  <div>
                    <p className="text-sm">Current photo</p>
                    <Button size="sm" variant="ghost" onClick={() => window.open(editingAdmin.profilePhoto.url, '_blank')}>View</Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No profile photo uploaded</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files[0];
                    if (!f) return;
                    if (!editingAdmin) {
                      setProfileFile(f);
                      toast.success('Profile photo queued - will upload after creating admin');
                      return;
                    }
                    try {
                      setProfileUploading(true);
                      const fd = new FormData();
                      fd.append('file', f);
                      fd.append('fileType', 'profile');
                      fd.append('userId', editingAdmin._id);
                      await apiClient.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      toast.success('Profile photo uploaded');
                      loadAdmins();
                    } catch (err) {
                      console.error('Profile upload failed:', err);
                      toast.error('Profile upload failed');
                    } finally {
                      setProfileUploading(false);
                    }
                  }}
                />
                {profileUploading && <span className="text-sm">Uploading...</span>}
              </div>
            </div>

            {/* Admin Documents Upload */}
            <div className="pt-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Documents</h4>
              <p className="text-xs text-gray-500 mb-2">Upload admin documents (CNIC, CV, ID card). Already uploaded types are hidden.</p>
              <div className="flex items-center gap-2">
                <DocumentTypeSelect
                  id="adminDocumentType"
                  name="adminDocumentType"
                  value={formData.selectedDocumentType || ''}
                  onChange={(e) => setFormData({ ...formData, selectedDocumentType: e.target?.value ?? e })}
                  options={ADMIN_DOC_TYPES.filter(t => !uploadedAdminDocTypes.includes(t)).map(t => ({ label: t.replace(/_/g, ' '), value: t }))}
                  placeholder="Select document type"
                  className="w-56"
                />

                <input type="file" onChange={(e) => setDocFile(e.target.files[0] || null)} />
                <Button
                  onClick={async () => {
                    if (!formData.selectedDocumentType) { toast.error('Select document type'); return; }
                    if (!docFile) { toast.error('Select a file'); return; }
                    if (!editingAdmin) {
                      toast.error('Upload documents after creating the admin (they will be queued)');
                      return;
                    }
                    try {
                      setDocUploading(true);
                      const fd = new FormData();
                      fd.append('file', docFile);
                      fd.append('fileType', 'admin_document');
                      fd.append('documentType', formData.selectedDocumentType);
                      fd.append('userId', editingAdmin._id);
                      await apiClient.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      toast.success('Document uploaded');
                      // mark as uploaded so dropdown hides it
                      setUploadedAdminDocTypes((s) => [...s, formData.selectedDocumentType]);
                      setDocFile(null);
                      setFormData({ ...formData, selectedDocumentType: '' });
                      loadAdmins();
                    } catch (err) {
                      console.error('Document upload failed:', err);
                      toast.error('Document upload failed');
                    } finally {
                      setDocUploading(false);
                    }
                  }}
                >Upload</Button>
              </div>

              {uploadedAdminDocTypes.length > 0 && (
                <div className="mt-3 text-xs text-gray-600">
                  <strong>Uploaded:</strong> {uploadedAdminDocTypes.join(', ')}
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Account Status
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Active Account</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account will be immediately accessible</p>
                </div>
              </label>
            </div>

            {/* Permissions removed as per request - no permissions UI */}
          </div>
        </TabPanel>
      </div>
      </Modal>

      {/* View Modal - Readonly full administrator details */}
      <Modal
        open={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingAdmin(null); }}
        title="Administrator Details"
        size="lg"
        footer={(
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => { setShowViewModal(false); setViewingAdmin(null); }}>Close</Button>
          </div>
        )}
      >
        {viewingAdmin ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div>
                {viewingAdmin.profilePhoto?.url ? (
                  <img src={viewingAdmin.profilePhoto.url} alt="profile" className="w-28 h-28 rounded-md object-cover" />
                ) : (
                  <div className="w-28 h-28 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">No Photo</div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{viewingAdmin.fullName || `${viewingAdmin.firstName || ''} ${viewingAdmin.lastName || ''}`}</h2>
                <p className="text-sm text-gray-600">{viewingAdmin.role}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><strong>Email:</strong> <div className="text-gray-700">{viewingAdmin.email}</div></div>
                  <div><strong>Phone:</strong> <div className="text-gray-700">{viewingAdmin.phone || '—'}</div></div>
                  <div><strong>Branch:</strong> <div className="text-gray-700">{viewingAdmin.branchId?.name || 'Not Assigned'}</div></div>
                  <div><strong>Status:</strong> <div className="text-gray-700">{viewingAdmin.isActive ? 'Active' : 'Inactive'}</div></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Personal</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Date of Birth:</strong> {viewingAdmin.dateOfBirth ? new Date(viewingAdmin.dateOfBirth).toLocaleDateString() : '—'}</div>
                  <div><strong>Gender:</strong> {viewingAdmin.gender || '—'}</div>
                  <div><strong>Nationality:</strong> {viewingAdmin.nationality || '—'}</div>
                  <div><strong>CNIC:</strong> {viewingAdmin.cnic || '—'}</div>
                  <div><strong>Religion:</strong> {viewingAdmin.religion || '—'}</div>
                  <div><strong>Blood Group:</strong> {viewingAdmin.bloodGroup || '—'}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Address</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>{viewingAdmin.address?.street || '—'}</div>
                  <div>{viewingAdmin.address?.city ? `${viewingAdmin.address.city}, ${viewingAdmin.address.state || ''}` : '—'}</div>
                  <div>{viewingAdmin.address?.postalCode || ''}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Documents</h4>
              {((viewingAdmin.adminProfile && viewingAdmin.adminProfile.documents) || viewingAdmin.documents || []).length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {((viewingAdmin.adminProfile && viewingAdmin.adminProfile.documents) || viewingAdmin.documents || []).map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <div className="text-sm">
                        <div className="font-medium">{doc.name || doc.type}</div>
                        <div className="text-xs text-gray-500">Type: {doc.type}</div>
                        <div className="text-xs text-gray-400">Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : '—'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.url ? (
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View</a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">No administrator selected</div>
        )}
      </Modal>
    </div>
  );
}
