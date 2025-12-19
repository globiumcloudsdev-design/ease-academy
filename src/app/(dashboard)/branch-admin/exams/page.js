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
import { Plus, Edit, Trash2, Search, Calendar, Clock, Eye, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const EXAM_TYPES = [
  { value: 'midterm', label: 'Mid-Term' },
  { value: 'final', label: 'Final' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'mock', label: 'Mock Exam' },
  { value: 'surprise', label: 'Surprise Test' },
  { value: 'practical', label: 'Practical' },
  { value: 'oral', label: 'Oral' },
];

const EXAM_STATUS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' },
];

export default function ExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [formData, setFormData] = useState({
    title: '',
    examType: 'midterm',
    classId: '',
    subjectId: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: '',
    totalMarks: 100,
    passingMarks: 40,
    room: '',
    instructions: '',
    syllabus: '',
    status: 'scheduled',
  });

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchSubjects();
  }, [search, statusFilter, classFilter, examTypeFilter, pagination.page]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.classId = classFilter;
      if (examTypeFilter) params.examType = examTypeFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.LIST, params);
      if (response.success) {
        setExams(response.data.exams);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, { limit: 100 });
      if (response.success) {
        setClasses(response.data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
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
          API_ENDPOINTS.BRANCH_ADMIN.EXAMS.UPDATE.replace(':id', currentExam._id),
          formData
        );
        if (response.success) {
          alert('Exam updated successfully!');
          setIsModalOpen(false);
          fetchExams();
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.CREATE, formData);
        if (response.success) {
          alert('Exam created successfully!');
          setIsModalOpen(false);
          fetchExams();
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to save exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (exam) => {
    setCurrentExam(exam);
    setFormData({
      title: exam.title || '',
      examType: exam.examType || 'midterm',
      classId: exam.classId?._id || '',
      subjectId: exam.subjectId?._id || '',
      date: exam.date ? exam.date.split('T')[0] : '',
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      duration: exam.duration || '',
      totalMarks: exam.totalMarks || 100,
      passingMarks: exam.passingMarks || 40,
      room: exam.room || '',
      instructions: exam.instructions || '',
      syllabus: exam.syllabus || '',
      status: exam.status || 'scheduled',
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleView = (exam) => {
    setCurrentExam(exam);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.DELETE.replace(':id', id));
      if (response.success) {
        alert('Exam deleted successfully!');
        fetchExams();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete exam');
    }
  };

  const handleAddNew = () => {
    setCurrentExam(null);
    setFormData({
      title: '',
      examType: 'midterm',
      classId: '',
      subjectId: '',
      date: '',
      startTime: '',
      endTime: '',
      duration: '',
      totalMarks: 100,
      passingMarks: 40,
      room: '',
      instructions: '',
      syllabus: '',
      status: 'scheduled',
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  if (loading && exams.length === 0) {
    return <FullPageLoader message="Loading exams..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Exams Management</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Exam
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map((c) => ({ value: c._id, label: `${c.name} - ${c.code}` })),
              ]}
            />
            <Dropdown
              placeholder="Filter by type"
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              options={[{ value: '', label: 'All Types' }, ...EXAM_TYPES]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All Status' }, ...EXAM_STATUS]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No exams found
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {exam.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{exam.examType.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell>{exam.classId?.name || 'N/A'}</TableCell>
                    <TableCell>{exam.subjectId?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(exam.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {exam.startTime} - {exam.endTime}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Total: {exam.totalMarks}</div>
                        <div className="text-gray-500">Pass: {exam.passingMarks}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          exam.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : exam.status === 'ongoing'
                            ? 'bg-blue-100 text-blue-700'
                            : exam.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-700'
                            : exam.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {exam.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleView(exam)} title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(exam)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(exam._id)}>
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
              Showing {exams.length} of {pagination.total} exams
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

      {/* Add/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Exam' : 'Schedule New Exam'}
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
            <label className="block text-sm font-medium mb-1">Exam Title *</label>
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
              <label className="block text-sm font-medium mb-1">Exam Type *</label>
              <Dropdown name="examType" value={formData.examType} onChange={handleInputChange} options={EXAM_TYPES} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Dropdown name="status" value={formData.status} onChange={handleInputChange} options={EXAM_STATUS} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class *</label>
              <Dropdown
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                options={[
                  { value: '', label: 'Select Class' },
                  ...classes.map((c) => ({ value: c._id, label: `${c.name} - ${c.code}` })),
                ]}
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
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time *</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time *</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (mins) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Total Marks *</label>
              <input
                type="number"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Passing Marks *</label>
              <input
                type="number"
                name="passingMarks"
                value={formData.passingMarks}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                required
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
            <label className="block text-sm font-medium mb-1">Instructions</label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
              placeholder="General instructions for students..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Syllabus Coverage</label>
            <textarea
              name="syllabus"
              value={formData.syllabus}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
              placeholder="Chapters and topics covered in this exam..."
            />
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Exam Details"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {currentExam && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="font-semibold text-lg">{currentExam.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="capitalize">{currentExam.examType.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="capitalize">{currentExam.status}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Class</label>
                <p>{currentExam.classId?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Subject</label>
                <p>{currentExam.subjectId?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p>{new Date(currentExam.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Time</label>
                <p>
                  {currentExam.startTime} - {currentExam.endTime} ({currentExam.duration} mins)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Total Marks</label>
                <p className="font-semibold">{currentExam.totalMarks}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Passing Marks</label>
                <p className="font-semibold">{currentExam.passingMarks}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Room</label>
                <p>{currentExam.room || '-'}</p>
              </div>
            </div>

            {currentExam.instructions && (
              <div>
                <label className="text-sm font-medium text-gray-500">Instructions</label>
                <p className="text-sm">{currentExam.instructions}</p>
              </div>
            )}

            {currentExam.syllabus && (
              <div>
                <label className="text-sm font-medium text-gray-500">Syllabus</label>
                <p className="text-sm">{currentExam.syllabus}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
