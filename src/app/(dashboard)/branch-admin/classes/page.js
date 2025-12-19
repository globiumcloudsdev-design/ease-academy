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
import { Plus, Edit, Trash2, Search, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const CLASS_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'completed', label: 'Completed' },
];

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    grade: '',
    section: '',
    capacity: '',
    room: '',
    status: 'active',
    subjects: [],
  });

  useEffect(() => {
    fetchClasses();
    fetchGrades();
    fetchSubjects();
  }, [search, statusFilter, gradeFilter, pagination.page]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (statusFilter) params.status = statusFilter;
      if (gradeFilter) params.gradeId = gradeFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, params);
      if (response.success) {
        setClasses(response.data.classes);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.GRADES_VIEW.LIST, { limit: 100 });
      if (response.success) {
        setGrades(response.data.grades);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.LIST, { limit: 100 });
      if (response.success) {
        setSubjects(response.data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter((id) => id !== subjectId)
        : [...prev.subjects, subjectId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode) {
        const response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.CLASSES.UPDATE.replace(':id', currentClass._id),
          formData
        );
        if (response.success) {
          alert('Class updated successfully!');
          setIsModalOpen(false);
          fetchClasses();
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.CREATE, formData);
        if (response.success) {
          alert('Class created successfully!');
          setIsModalOpen(false);
          fetchClasses();
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to save class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (classItem) => {
    setCurrentClass(classItem);
    setFormData({
      name: classItem.name || '',
      code: classItem.code || '',
      grade: classItem.grade?._id || '',
      section: classItem.section || '',
      capacity: classItem.capacity || '',
      room: classItem.room || '',
      status: classItem.status || 'active',
      subjects: classItem.subjects?.map((s) => s._id) || [],
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.DELETE.replace(':id', id));
      if (response.success) {
        alert('Class deleted successfully!');
        fetchClasses();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete class');
    }
  };

  const handleAddNew = () => {
    setCurrentClass(null);
    setFormData({
      name: '',
      code: '',
      grade: '',
      section: '',
      capacity: '',
      room: '',
      status: 'active',
      subjects: [],
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  if (loading && classes.length === 0) {
    return <FullPageLoader message="Loading classes..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Classes Management</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Grades' },
                ...grades.map((g) => ({ value: g._id, label: g.name })),
              ]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All Status' }, ...CLASS_STATUS]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    No classes found
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((classItem) => (
                  <TableRow key={classItem._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {classItem.name}
                      </div>
                    </TableCell>
                    <TableCell>{classItem.code}</TableCell>
                    <TableCell>{classItem.grade?.name || 'N/A'}</TableCell>
                    <TableCell>{classItem.section || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {classItem.studentCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>{classItem.subjects?.length || 0}</TableCell>
                    <TableCell>{classItem.capacity || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          classItem.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : classItem.status === 'inactive'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {classItem.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(classItem)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(classItem._id)}>
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
              Showing {classes.length} of {pagination.total} classes
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
        title={isEditMode ? 'Edit Class' : 'Add New Class'}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class Name *</label>
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
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Grade *</label>
              <Dropdown
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                options={[{ value: '', label: 'Select Grade' }, ...grades.map((g) => ({ value: g._id, label: g.name }))]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="A, B, C..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Dropdown name="status" value={formData.status} onChange={handleInputChange} options={CLASS_STATUS} />
          </div>

          {/* Subjects Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Subjects</label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {subjects.length === 0 ? (
                <p className="text-sm text-gray-500">No subjects available</p>
              ) : (
                subjects.map((subject) => (
                  <div key={subject._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject._id)}
                      onChange={() => handleSubjectToggle(subject._id)}
                      className="w-4 h-4"
                    />
                    <label className="text-sm">
                      {subject.name} ({subject.code})
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
