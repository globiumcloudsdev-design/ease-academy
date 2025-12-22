'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  X,
  UserCheck,
  Building2,
} from 'lucide-react';
import Input from '@/components/ui/input';
import GradeSelect from '@/components/ui/grade-select';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    grade: '',
    branchId: '',
    academicYear: new Date().getFullYear().toString(),
    sections: [{ name: 'A', capacity: 40, roomNumber: '' }],
    description: '',
    status: 'active',
  });

  useEffect(() => {
    loadData();
  }, [searchTerm, branchFilter, statusFilter]);

  const { user } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadClasses(), loadBranches()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (branchFilter) params.append('branchId', branchFilter);
      if (statusFilter) params.append('status', statusFilter);
      const base = user?.role === 'branch_admin' ? API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST : API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST;
      const response = await apiClient.get(`${base}?${params}`);

      if (response?.success) {
        // backend returns { success: true, data: [...] }
        setClasses(response.data || response.data?.classes || []);
      } else {
        toast.error(response?.message || 'Failed to load classes');
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const loadBranches = async () => {
    try {
      if (user?.role === 'branch_admin') {
        // Branch admin should only have their own branch available
        if (user.branchId) {
          // support either object or id
          const branch = typeof user.branchId === 'object' ? user.branchId : { _id: user.branchId, name: user.branchName || 'My Branch' };
          setBranches([branch]);
          return;
        }
      }

      const branchesEndpoint = API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST;
      const response = await apiClient.get(`${branchesEndpoint}?limit=100`);
      if (response?.success) {
        // branches may be in response.data.branches or response.data
        const branchesData = response.data?.branches || response.data || [];
        setBranches(branchesData);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleAddNew = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      code: '',
      grade: 1,
      branchId: '',
      academicYear: new Date().getFullYear().toString(),
      sections: [{ name: 'A', capacity: 40, roomNumber: '' }],
      description: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      code: cls.code,
      grade: cls.grade?._id || cls.grade?.name || '',
      branchId: cls.branchId?._id || '',
      academicYear: cls.academicYear,
      sections: cls.sections.map(s => ({
        name: s.name,
        capacity: s.capacity,
        roomNumber: s.roomNumber || '',
        classTeacherId: s.classTeacherId?._id || '',
      })),
      description: cls.description || '',
      status: cls.status,
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.branchId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Build payload that matches backend Class model
      const classPayload = {
        name: formData.name,
        code: formData.code ? formData.code.toUpperCase() : '',
      grade: formData.grade,
        branchId: formData.branchId,
        academicYear: formData.academicYear,
        sections: (formData.sections || []).map((s) => {
          const section = {
            name: s.name,
            capacity: s.name ? (Number(s.capacity) || 0) : undefined,
            roomNumber: s.roomNumber || '',
          };
          if (s.classTeacherId) {
            section.classTeacherId = s.classTeacherId;
          }
          return section;
        }),
        description: formData.description || '',
        status: formData.status || 'active',
      };

      const createEndpoint = user?.role === 'branch_admin' ? API_ENDPOINTS.BRANCH_ADMIN.CLASSES.CREATE : API_ENDPOINTS.SUPER_ADMIN.CLASSES.CREATE;
      const updateEndpoint = user?.role === 'branch_admin' ? API_ENDPOINTS.BRANCH_ADMIN.CLASSES.UPDATE.replace(':id', editingClass?._id || '') : API_ENDPOINTS.SUPER_ADMIN.CLASSES.UPDATE.replace(':id', editingClass?._id || '');

      let response;
      if (editingClass) {
        response = await apiClient.put(updateEndpoint, classPayload);
      } else {
        response = await apiClient.post(createEndpoint, classPayload);
      }

      if (response?.success) {
        toast.success(response.message || 'Class saved');
        setShowModal(false);
        loadClasses();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving class:', error);
      toast.error('Failed to save class');
    }
  };

  const handleDelete = async () => {
    if (!classToDelete) return;

    try {
      const deleteEndpoint = user?.role === 'branch_admin' ? API_ENDPOINTS.BRANCH_ADMIN.CLASSES.DELETE.replace(':id', classToDelete._id) : API_ENDPOINTS.SUPER_ADMIN.CLASSES.DELETE.replace(':id', classToDelete._id);
      const response = await apiClient.delete(deleteEndpoint);

      if (response?.success) {
        toast.success('Class archived successfully');
        setShowDeleteModal(false);
        setClassToDelete(null);
        loadClasses();
      } else {
        toast.error(response?.message || 'Failed to archive class');
      }
    } catch (error) {
      console.error('Error archiving class:', error);
      toast.error('Failed to archive class');
    }
  };

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [...formData.sections, { name: '', capacity: 40, roomNumber: '' }],
    });
  };

  const removeSection = (index) => {
    const newSections = formData.sections.filter((_, i) => i !== index);
    setFormData({ ...formData, sections: newSections });
  };

  const updateSection = (index, field, value) => {
    const newSections = [...formData.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setFormData({ ...formData, sections: newSections });
  };

  // Calculate stats
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'active').length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const totalSections = classes.reduce((sum, c) => sum + (c.sections?.length || 0), 0);

  // UI state for per-class section selection and counts
  const [selectedSections, setSelectedSections] = useState({});
  const [sectionCounts, setSectionCounts] = useState({});

  const fetchSectionCount = async (classId, section) => {
    try {
      const params = new URLSearchParams({ classId, limit: '1', page: '1' });
      if (section) params.append('section', section);
      const res = await apiClient.get(`/api/super-admin/students?${params}`);
      if (res?.success) {
        const total = res.pagination?.total ?? 0;
        setSectionCounts((s) => ({ ...s, [classId]: total }));
      }
    } catch (err) {
      console.error('Failed to fetch section count', err);
    }
  };

  const handleSectionChange = (classId, value) => {
    setSelectedSections((s) => ({ ...s, [classId]: value }));
    fetchSectionCount(classId, value);
  };

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
      <div className="flex items-center justify-between pt-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage classes, sections, and student assignments</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalClasses}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Classes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeClasses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sections</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalSections}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input placeholder="Search classes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div>
            <Dropdown name="branchFilter" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} options={[{ value: '', label: 'All Branches' }, ...branches.map(b => ({ value: b._id, label: b.name }))]} />
          </div>

          <div>
            <Dropdown name="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'archived', label: 'Archived' }]} />
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg border border-gray-200 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No classes found. Create your first class to get started.</p>
          </div>
        ) : (
          classes.map((cls) => (
            <Card key={cls._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-linear-to-r from-blue-500 to-blue-600 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{cls.name}</h3>
                    <p className="text-blue-100 text-sm">Grade {cls.grade?.name} • {cls.code}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      cls.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : cls.status === 'inactive'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {cls.status}
                  </span>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{cls.branchId?.name}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span>Academic Year: {cls.academicYear}</span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Sections</span>
                    <span className="text-sm text-gray-600">{cls.sections?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-48">
                      <Dropdown
                        name={`section-${cls._id}`}
                        value={selectedSections[cls._id] ?? ''}
                        onChange={(e) => handleSectionChange(cls._id, e.target.value)}
                        options={[{ value: '', label: 'All Sections' }, ...(cls.sections || []).map(s => ({ value: s.name, label: s.name }))]}
                        placeholder="Select section"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cls.sections?.map((section, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">{section.name}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedSections[cls._id] ? (sectionCounts[cls._id] ?? 0) : (cls.studentCount || 0)}</p>
                      <p className="text-xs text-gray-600">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{cls.subjects?.length || 0}</p>
                      <p className="text-xs text-gray-600">Subjects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{cls.sections?.reduce((sum, s) => sum + (s.capacity || 0), 0) || 0}</p>
                      <p className="text-xs text-gray-600">Capacity</p>
                    </div>
                  </div>
                </div>

                {cls.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{cls.description}</p>
                )}

                <div className="pt-3 border-t border-gray-200 flex items-center gap-2">
                  <button onClick={() => handleEdit(cls)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button onClick={() => { setClassToDelete(cls); setShowDeleteModal(true); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                    <Trash2 className="w-4 h-4" />
                    Archive
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingClass ? 'Edit Class' : 'Add New Class'} footer={(
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button type="button" onClick={handleFormSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingClass ? 'Update Class' : 'Create Class'}</button>
        </div>
      )} size="lg">
        <form onSubmit={handleFormSubmit} className="p-2 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input name="name" label="Class Name *" placeholder="Class 1" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <Input name="code" label="Class Code *" placeholder="C1" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} disabled={editingClass} />
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <GradeSelect name="grade" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} />
            </div>

            <div>
              <Dropdown name="branchId" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} options={[{ value: '', label: 'Select Branch' }, ...branches.map(b => ({ value: b._id, label: b.name }))]} />
            </div>

            <div>
              <Input name="academicYear" label="Academic Year" placeholder="2024-2025" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="2" placeholder="Class description..." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Sections</label>
              <button type="button" onClick={addSection} className="text-sm text-blue-600 hover:text-blue-700">+ Add Section</button>
            </div>
            <div className="space-y-2">
              {formData.sections.map((section, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input placeholder="Section name (A, B, C...)" value={section.name} onChange={(e) => updateSection(idx, 'name', e.target.value)} />
                  {section.name ? (
                    <Input type="number" placeholder="Capacity" value={section.capacity} onChange={(e) => updateSection(idx, 'capacity', parseInt(e.target.value) || 0)} className="w-24" />
                  ) : null}
                  <Input placeholder="Room" value={section.roomNumber} onChange={(e) => updateSection(idx, 'roomNumber', e.target.value)} className="w-24" />
                  {formData.sections.length > 1 && (
                    <button type="button" onClick={() => removeSection(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Dropdown name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Archive Class"
        footer={(
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Archive</button>
          </div>
        )}
        size="sm"
      >
        <div className="p-2">
          <p className="text-gray-600">Are you sure you want to archive "{classToDelete?.name}"? This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
}
