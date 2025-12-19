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
import { Plus, Edit, Trash2, Search, Calendar, Users, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const ATTENDANCE_STATUS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'excused', label: 'Excused' },
];

const ATTENDANCE_TYPE = [
  { value: 'daily', label: 'Daily' },
  { value: 'subject', label: 'Subject-wise' },
  { value: 'event', label: 'Event' },
];

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [formData, setFormData] = useState({
    classId: '',
    date: new Date().toISOString().split('T')[0],
    attendanceType: 'daily',
    notes: '',
    records: [],
  });

  useEffect(() => {
    fetchAttendanceRecords();
    fetchClasses();
  }, [classFilter, fromDate, toDate, pagination.page]);

  useEffect(() => {
    if (formData.classId) {
      fetchStudentsByClass(formData.classId);
    }
  }, [formData.classId]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (classFilter) params.classId = classFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await apiClient.get(API_ENDPOINTS.TEACHER.ATTENDANCE.LIST, params);
      if (response.success) {
        setAttendanceRecords(response.data.attendance);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.CLASSES, { limit: 100 });
      if (response.success) {
        setClasses(response.data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudentsByClass = async (classId) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.STUDENTS_BY_CLASS.replace(':classId', classId), {
        limit: 200,
        status: 'active',
      });
      if (response.success) {
        setStudents(response.data.students);
        // Initialize attendance records for all students
        const records = response.data.students.map((student) => ({
          studentId: student._id,
          status: 'present',
          remarks: '',
          checkInTime: '',
          checkOutTime: '',
        }));
        setFormData((prev) => ({ ...prev, records }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentStatusChange = (studentId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      records: prev.records.map((record) =>
        record.studentId === studentId ? { ...record, [field]: value } : record
      ),
    }));
  };

  const markAllPresent = () => {
    setFormData((prev) => ({
      ...prev,
      records: prev.records.map((record) => ({ ...record, status: 'present' })),
    }));
  };

  const markAllAbsent = () => {
    setFormData((prev) => ({
      ...prev,
      records: prev.records.map((record) => ({ ...record, status: 'absent' })),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await apiClient.post(API_ENDPOINTS.TEACHER.ATTENDANCE.CREATE, formData);
      if (response.success) {
        alert('Attendance marked successfully!');
        setIsModalOpen(false);
        fetchAttendanceRecords();
      }
    } catch (error) {
      alert(error.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (record) => {
    setCurrentRecord(record);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.TEACHER.ATTENDANCE.DELETE.replace(':id', id));
      if (response.success) {
        alert('Attendance deleted successfully!');
        fetchAttendanceRecords();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete attendance');
    }
  };

  const handleMarkAttendance = () => {
    setFormData({
      classId: '',
      date: new Date().toISOString().split('T')[0],
      attendanceType: 'daily',
      notes: '',
      records: [],
    });
    setStudents([]);
    setIsModalOpen(true);
  };

  if (loading && attendanceRecords.length === 0) {
    return <FullPageLoader message="Loading attendance records..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Management</CardTitle>
            <Button onClick={handleMarkAttendance}>
              <Plus className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Dropdown
              placeholder="Filter by class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map((c) => ({ value: c._id, label: `${c.name} - ${c.code}` })),
              ]}
            />
            <Input
              type="date"
              placeholder="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <Input type="date" placeholder="To Date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Students</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                attendanceRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{record.classId?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{record.attendanceType}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {record.statistics?.totalStudents || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        {record.statistics?.presentCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        {record.statistics?.absentCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{record.statistics?.attendancePercentage || 0}%</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleView(record)} title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(record._id)}>
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
              Showing {attendanceRecords.length} of {pagination.total} records
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

      {/* Mark Attendance Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Mark Attendance"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || students.length === 0}>
              {submitting ? <ButtonLoader /> : 'Submit'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Attendance Type</label>
              <Dropdown
                name="attendanceType"
                value={formData.attendanceType}
                onChange={handleInputChange}
                options={ATTENDANCE_TYPE}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {students.length > 0 && (
            <>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Student Attendance ({students.length})</h3>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={markAllPresent}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      All Present
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={markAllAbsent}>
                      <XCircle className="w-3 h-3 mr-1" />
                      All Absent
                    </Button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">Student</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const record = formData.records.find((r) => r.studentId === student._id);
                        return (
                          <tr key={student._id} className="border-b">
                            <td className="px-4 py-3">
                              <div className="font-medium">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{student.admissionNumber}</div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={record?.status || 'present'}
                                onChange={(e) => handleStudentStatusChange(student._id, 'status', e.target.value)}
                                className="px-3 py-1 border rounded text-sm"
                              >
                                {ATTENDANCE_STATUS.map((status) => (
                                  <option key={status.value} value={status.value}>
                                    {status.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={record?.remarks || ''}
                                onChange={(e) => handleStudentStatusChange(student._id, 'remarks', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Optional..."
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm">
                  <strong>Summary:</strong> {formData.records.filter((r) => r.status === 'present').length} Present,{' '}
                  {formData.records.filter((r) => r.status === 'absent').length} Absent,{' '}
                  {formData.records.filter((r) => r.status === 'late').length} Late
                </div>
              </div>
            </>
          )}

          {formData.classId && students.length === 0 && (
            <div className="text-center text-gray-500 py-4">No students found in this class</div>
          )}
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Attendance Details"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {currentRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p className="font-semibold">{new Date(currentRecord.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Class</label>
                <p className="font-semibold">{currentRecord.classId?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-500">Total</label>
                <p className="text-lg font-bold">{currentRecord.statistics?.totalStudents || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Present</label>
                <p className="text-lg font-bold text-green-600">{currentRecord.statistics?.presentCount || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Absent</label>
                <p className="text-lg font-bold text-red-600">{currentRecord.statistics?.absentCount || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Percentage</label>
                <p className="text-lg font-bold text-blue-600">{currentRecord.statistics?.attendancePercentage || 0}%</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">Student Records</label>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Student</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecord.records?.map((rec) => (
                      <tr key={rec._id} className="border-b">
                        <td className="px-3 py-2">
                          {rec.studentId?.firstName} {rec.studentId?.lastName}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              rec.status === 'present'
                                ? 'bg-green-100 text-green-700'
                                : rec.status === 'absent'
                                ? 'bg-red-100 text-red-700'
                                : rec.status === 'late'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{rec.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
