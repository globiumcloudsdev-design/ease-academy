"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import AddStaffModal from '@/components/modals/AddStaffModal';
import FullPageLoader from '@/components/ui/full-page-loader';
import Dropdown from '@/components/ui/dropdown';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export default function SuperAdminStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState([]);

  // Load staff
  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STAFF.LIST);
      if (response.success) {
        setStaff(response.data);
        setFilteredStaff(response.data);
      }
    } catch (error) {
      console.error('Load staff error:', error);
      toast.error(error.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  // Load branches for filter
  const loadBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      if (response.success) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error('Load branches error:', error);
    }
  };

  useEffect(() => {
    loadStaff();
    loadBranches();
  }, []);

  // Filter staff
  useEffect(() => {
    let filtered = [...staff];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.staffProfile?.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Branch filter
    if (branchFilter !== 'all') {
      filtered = filtered.filter(s => s.branchId?._id === branchFilter);
    }

    setFilteredStaff(filtered);
  }, [searchQuery, statusFilter, branchFilter, staff]);

  // Handle add staff
  const handleAddStaff = () => {
    setShowAddModal(true);
  };

  // Handle edit staff
  const handleEditStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  };

  // Handle view staff
  const handleViewStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowViewModal(true);
  };

  // Handle delete staff
  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const endpoint = API_ENDPOINTS.SUPER_ADMIN.STAFF.DELETE.replace(':id', staffId);
      const response = await apiClient.delete(endpoint);
      if (response.success) {
        toast.success('Staff deleted successfully');
        loadStaff();
      }
    } catch (error) {
      console.error('Delete staff error:', error);
      toast.error(error.message || 'Failed to delete staff');
    }
  };

  // Download QR code
  const handleDownloadQR = (staffMember) => {
    if (staffMember.staffProfile?.qr?.url) {
      window.open(staffMember.staffProfile.qr.url, '_blank');
    } else {
      toast.error('QR code not available');
    }
  };

  if (loading) {
    return <FullPageLoader message="Loading staff..." />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all staff members</p>
        </div>
        <Button onClick={handleAddStaff} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Staff
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div className="w-full">
            <Dropdown
              id="branchFilter"
              name="branchFilter"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              options={[
                { label: 'All Branches', value: 'all' },
                ...branches.map(branch => ({ label: branch.name, value: branch._id }))
              ]}
              placeholder="Filter by Branch"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full">
            <Dropdown
              id="statusFilter"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
              placeholder="Filter by Status"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredStaff.length} of {staff.length} staff members
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No staff members found
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staffMember) => (
                  <motion.tr
                    key={staffMember._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {staffMember.staffProfile?.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          {staffMember.profilePhoto?.url ? (
                            <img
                              src={staffMember.profilePhoto.url}
                              alt={staffMember.fullName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                              {staffMember.fullName?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {staffMember.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {staffMember.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {staffMember.branchId?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {staffMember.staffProfile?.staffType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          staffMember.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {staffMember.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewStaff(staffMember)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleEditStaff(staffMember)}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDownloadQR(staffMember)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400"
                        title="Download QR"
                      >
                        <Download className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staffMember._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {(showAddModal || showEditModal) && (
        <AddStaffModal
          open={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedStaff(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedStaff(null);
            loadStaff();
          }}
          staffMember={selectedStaff}
          branches={branches}
          role="super_admin"
        />
      )}

      {/* View Staff Modal */}
      {showViewModal && selectedStaff && (
        <Modal
          open={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="Staff Details"
          size="lg"
        >
          <div className="space-y-4">
            {/* Profile Photo & QR */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                  {selectedStaff.profilePhoto?.url ? (
                    <img
                      src={selectedStaff.profilePhoto.url}
                      alt={selectedStaff.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-gray-600 dark:text-gray-300">
                      {selectedStaff.fullName?.charAt(0)}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Profile Photo</p>
              </div>
              {selectedStaff.staffProfile?.qr?.url && (
                <div className="text-center">
                  <img
                    src={selectedStaff.staffProfile.qr.url}
                    alt="QR Code"
                    className="h-32 w-32 border rounded"
                  />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">QR Code</p>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.staffProfile?.employeeId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.branchId?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Staff Type</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.staffProfile?.staffType || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Designation</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.staffProfile?.designation || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Shift</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.staffProfile?.shift || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.gender || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">CNIC</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.cnic || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Joining Date</label>
                <p className="text-gray-900 dark:text-white">
                  {selectedStaff.staffProfile?.joiningDate 
                    ? new Date(selectedStaff.staffProfile.joiningDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <p className="text-gray-900 dark:text-white">{selectedStaff.status}</p>
              </div>
              
              {/* Salary Information */}
              <div className="col-span-2 mt-4">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Salary Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Basic Salary</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      Rs. {selectedStaff.staffProfile?.salaryDetails?.basicSalary || 0}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Salary Type</label>
                    <p className="text-sm text-gray-900 dark:text-white capitalize">
                      {selectedStaff.staffProfile?.salaryDetails?.salaryType || 'monthly'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedStaff.staffProfile?.emergencyContact?.name && (
                <div className="col-span-2 mt-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Name</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedStaff.staffProfile.emergencyContact.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Relationship</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedStaff.staffProfile.emergencyContact.relationship || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Phone</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedStaff.staffProfile.emergencyContact.phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              {selectedStaff.staffProfile?.documents?.length > 0 && (
                <div className="col-span-2 mt-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Documents</h3>
                  <div className="space-y-2">
                    {selectedStaff.staffProfile.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-300 text-xs font-semibold">
                              {doc.type?.substring(0, 3).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {doc.type?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
