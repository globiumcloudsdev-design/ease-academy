'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import {
  Users, Plus, Search, Edit, Trash2, Phone, Mail,
  Calendar, GraduationCap, Award, FileText, Eye
} from 'lucide-react';
import Modal from '@/components/ui/modal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import BranchSelect from '@/components/ui/branch-select';
import FullPageLoader from '@/components/ui/full-page-loader';
import TeacherForm from '@/components/teacher/teacher-form';
import TeacherViewModal from '@/components/teacher/teacher-view-modal';

export default function TeachersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [fullPageLoading, setFullPageLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    terminated: 0,
  });

  useEffect(() => {
    fetchTeachers();
    fetchBranches();
    fetchDepartments();
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBranch && { branchId: selectedBranch }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedDesignation && { designation: selectedDesignation }),
      });

      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.TEACHERS.LIST}?${params}`);
      if (response?.success) {
        const list = response.data || [];
        setTeachers(list);

        const total = list.length;
        const active = list.filter(t => t.status === 'active').length;
        const onLeave = list.filter(t => t.status === 'on_leave').length;
        const terminated = list.filter(t => t.status === 'terminated').length;

        setStats({ total, active, onLeave, terminated });
      }
    } catch (error) {
      toast.error('Failed to fetch teachers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST}?limit=200`);
      if (response?.success) {
        setBranches(response.data?.branches || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.LIST}?limit=200`);
      if (response?.success) {
        setDepartments(response.data?.departments || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST}?limit=200`);
      if (response?.success) {
        setClasses(response.data?.classes || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.SUBJECTS.LIST}?limit=200`);
      if (response?.success) {
        setSubjects(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this teacher?')) return;
    setFullPageLoading(true);

    try {
      const response = await apiClient.delete(API_ENDPOINTS.SUPER_ADMIN.TEACHERS.DELETE.replace(':id', id));
      if (response.success) {
        toast.success('Teacher deactivated successfully');
        fetchTeachers();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete teacher');
      console.error(error);
    } finally {
      setFullPageLoading(false);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setShowModal(true);
  };

  const handleView = (teacher) => {
    router.push(`/super-admin/teacher-management/teachers/${teacher._id}`);
  };

  const handleAddNew = () => {
    setEditingTeacher(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
  };

  const handleSuccess = () => {
    fetchTeachers();
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {fullPageLoading && <FullPageLoader message="Processing..." />}
      
      {/* Header */}
      <div className="mb-6 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          Teacher Management
        </h1>
        <p className="text-gray-600 mt-1">Manage teachers, assignments, and QR codes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* ... Stats cards same as before ... */}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, phone, employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>

          <div className="w-full lg:w-48">
            <BranchSelect
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              branches={branches}
              placeholder="All Branches"
            />
          </div>

          <div className="w-full lg:w-48">
            <Dropdown
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              options={[
                { label: 'All Designations', value: '' },
                { label: 'Principal', value: 'Principal' },
                { label: 'Vice Principal', value: 'Vice Principal' },
                { label: 'Head Teacher', value: 'Head Teacher' },
                { label: 'Senior Teacher', value: 'Senior Teacher' },
                { label: 'Teacher', value: 'Teacher' },
              ]}
              placeholder="All Designations"
            />
          </div>

          <div className="w-full lg:w-48">
            <Dropdown
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'On Leave', value: 'on_leave' },
                { label: 'Terminated', value: 'terminated' },
              ]}
              placeholder="All Status"
            />
          </div>

          <Button onClick={handleAddNew} variant="default" className="whitespace-nowrap">
            <Plus className="h-5 w-5" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No teachers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Teacher</TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Branch</TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Designation</TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Classes</TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher._id} className="hover:bg-gray-50">
                    <TableCell className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.fullName || `${teacher.firstName} ${teacher.lastName}`}
                        </div>
                        <div className="text-sm text-gray-500">{teacher.teacherProfile?.employeeId}</div>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {teacher.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {teacher.phone}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-gray-900">{teacher.branchId?.name || '—'}</div>
                      <div className="text-xs text-gray-500">{teacher.branchId?.city || '—'}</div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        <Award className="h-3 w-3" />
                        {teacher.teacherProfile?.designation || 'Teacher'}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {teacher.teacherProfile?.classes?.length || 0} Classes
                      </div>
                      <div className="text-xs text-gray-500">
                        {teacher.teacherProfile?.subjects?.length || 0} Subjects
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                        teacher.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(teacher.status || 'inactive').replace('_', ' ').charAt(0).toUpperCase() + 
                         (teacher.status || 'inactive').slice(1).replace('_', ' ')}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleView(teacher)} 
                          variant="ghost" 
                          size="icon-sm"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button onClick={() => handleEdit(teacher)} variant="ghost" size="icon-sm" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDelete(teacher._id)} variant="ghost" size="icon-sm" title="Delete">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Teacher Form Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        size="xl"
        footer={null}
      >
        <TeacherForm
          userRole="super_admin"
          currentBranchId={null}
          editingTeacher={editingTeacher}
          branches={branches}
          departments={departments}
          classes={classes}
          subjects={subjects}
          onSuccess={handleSuccess}
          onClose={handleCloseModal}
        />
      </Modal>

      {/* Teacher View Modal */}
      <TeacherViewModal
        teacher={selectedTeacher}
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
      />
    </div>
  );
}