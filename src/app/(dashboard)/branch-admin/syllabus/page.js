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
import { Plus, Edit, Trash2, Search, FileText, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SYLLABUS_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export default function SyllabusPage() {
  const { user } = useAuth();
  const [syllabuses, setSyllabuses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSyllabus, setCurrentSyllabus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [formData, setFormData] = useState({
    title: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    subjectId: '',
    overview: '',
    status: 'draft',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchSyllabuses();
    fetchSubjects();
  }, [search, statusFilter, pagination.page]);

  const fetchSyllabuses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (statusFilter) params.status = statusFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.SYLLABUS.LIST, params);
      if (response.success) {
        setSyllabuses(response.data.syllabuses);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching syllabuses:', error);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode) {
        const response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.SYLLABUS.UPDATE.replace(':id', currentSyllabus._id),
          formData
        );
        if (response.success) {
          alert('Syllabus updated successfully!');
          setIsModalOpen(false);
          fetchSyllabuses();
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.SYLLABUS.CREATE, formData);
        if (response.success) {
          alert('Syllabus created successfully!');
          setIsModalOpen(false);
          fetchSyllabuses();
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to save syllabus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (syllabus) => {
    setCurrentSyllabus(syllabus);
    setFormData({
      title: syllabus.title || '',
      academicYear: syllabus.academicYear || '',
      subjectId: syllabus.subjectId?._id || '',
      overview: syllabus.overview || '',
      status: syllabus.status || 'draft',
      startDate: syllabus.startDate ? syllabus.startDate.split('T')[0] : '',
      endDate: syllabus.endDate ? syllabus.endDate.split('T')[0] : '',
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.SYLLABUS.DELETE.replace(':id', id));
      if (response.success) {
        alert('Syllabus deleted successfully!');
        fetchSyllabuses();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete syllabus');
    }
  };

  const handleAddNew = () => {
    setCurrentSyllabus(null);
    setFormData({
      title: '',
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      subjectId: '',
      overview: '',
      status: 'draft',
      startDate: '',
      endDate: '',
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  if (loading && syllabuses.length === 0) {
    return <FullPageLoader message="Loading syllabuses..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Syllabus Management</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Syllabus
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              placeholder="Search syllabus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All Status' }, ...SYLLABUS_STATUS]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syllabuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No syllabuses found
                  </TableCell>
                </TableRow>
              ) : (
                syllabuses.map((syllabus) => (
                  <TableRow key={syllabus._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {syllabus.title}
                      </div>
                    </TableCell>
                    <TableCell>{syllabus.subjectId?.name || 'N/A'}</TableCell>
                    <TableCell>{syllabus.academicYear}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          syllabus.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : syllabus.status === 'approved'
                            ? 'bg-blue-100 text-blue-700'
                            : syllabus.status === 'submitted'
                            ? 'bg-yellow-100 text-yellow-700'
                            : syllabus.status === 'archived'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {syllabus.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" title="View">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(syllabus)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(syllabus._id)}>
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
              Showing {syllabuses.length} of {pagination.total} syllabuses
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
        title={isEditMode ? 'Edit Syllabus' : 'Add New Syllabus'}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Academic Year *</label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="2024-2025"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject *</label>
              <Dropdown
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                options={[
                  { value: '', label: 'Select Subject' },
                  ...subjects.map((s) => ({ value: s._id, label: s.name })),
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Overview</label>
            <textarea
              name="overview"
              value={formData.overview}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              rows="4"
              placeholder="Curriculum overview and objectives..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Dropdown
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={SYLLABUS_STATUS}
            />
          </div>

          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            <strong>Note:</strong> Detailed chapter management and content editing will be available after creation.
          </div>
        </form>
      </Modal>
    </div>
  );
}
