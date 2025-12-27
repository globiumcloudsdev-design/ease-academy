
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import Tabs from '@/components/ui/tabs';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import BloodGroupSelect from '@/components/ui/blood-group';
import GenderSelect from '@/components/ui/gender-select';
import ClassSelect from '@/components/ui/class-select';
import StudentFormModal from '@/components/forms/StudentFormModal';
import StudentViewModal from '@/components/modals/StudentViewModal';
import { Plus, Edit, Trash2, Search, User, Mail, Phone, Eye, FileText, Upload, X, Calendar, MapPin, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { pdf } from '@react-pdf/renderer';
import StudentCardPDF from '@/components/StudentCardPDF';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';

const STUDENT_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'suspended', label: 'Suspended' },
];

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get student class name
  const getStudentClassName = (student) => {
    const classId = student.classId?._id || student.classId || student.studentProfile?.classId?._id || student.studentProfile?.classId || '';
    const classObj = classes.find(c => c._id === classId);
    return classObj?.name || 'Not Assigned';
  };

  // Current branch ID from user context
  const currentBranchId = user?.branchId?._id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [activeTab, setActiveTab] = useState('personal');
  const formRef = useRef(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [cardStatus, setCardStatus] = useState({
    issueDate: '',
    expireDate: '',
    status: 'active',
    printCount: 0,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, statusFilter, classFilter, pagination.page]);

  useEffect(() => {
    if (selectedStudent && isCardModalOpen) {
      const studentData = {
        id: selectedStudent.studentProfile?.registrationNumber || selectedStudent.admissionNumber || 'Not Assigned',
        name: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        class: getStudentClassName(selectedStudent),
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        dob: selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'N/A',
        gender: selectedStudent.gender,
        bloodGroup: selectedStudent.bloodGroup || 'N/A',
      };
      const qrData = JSON.stringify(studentData);
      QRCode.toDataURL(qrData, { width: 100, margin: 1 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [selectedStudent, isCardModalOpen]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        populate: 'classId'
      };
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.classId = classFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST, params);
      if (response.success) {
        setStudents(response.data.students);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
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

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.BRANCHES.LIST, { limit: 100 });
      if (response.success) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleView = (student) => {
    setCurrentStudent(student);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.DELETE.replace(':id', id));
      if (response.success) {
        toast.success('Student deleted successfully!');
        fetchStudents();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const handleIndividualDownload = (student) => {
    setSelectedStudent(student);
    setCardStatus({
      issueDate: new Date().toISOString().split('T')[0],
      expireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      printCount: 0,
    });
    setIsCardModalOpen(true);
  };



  const handleCardDownload = async () => {
    if (!selectedStudent) return;

    try {
      const blob = await pdf(<StudentCardPDF student={selectedStudent} qrCodeUrl={qrCodeUrl} classes={classes} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedStudent.firstName}_${selectedStudent.lastName}_card.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsCardModalOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownload = () => {
    if (downloadFormat === 'pdf') {
      const doc = new jsPDF();
      doc.text(String('Students Data'), 20, 20);

      let yPosition = 40;
      students.forEach((student, index) => {
        doc.text(String(`${index + 1}. ${student.firstName} ${student.lastName} - ${student.email}`), 20, yPosition);
        yPosition += 10;
      });

      doc.save('students.pdf');
    } else if (downloadFormat === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(students.map(student => ({
        'Admission Number': student.admissionNumber,
        'First Name': student.firstName,
        'Last Name': student.lastName,
        'Email': student.email,
        'Phone': student.phone,
        'Class': getStudentClassName(student),
        'Status': student.status,
        'Gender': student.gender,
        'Date of Birth': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '',
        'Enrollment Date': student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : '',
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      XLSX.writeFile(workbook, 'students.xlsx');
    }

    setIsDownloadModalOpen(false);
  };

  const handleFormSubmit = async (submissionData) => {
    try {
      setSubmitting(true);
      
      let response;
      
      if (editingStudent) {
        // Update existing student
        response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.UPDATE.replace(':id', editingStudent._id),
          submissionData
        );
      } else {
        // Create new student
        response = await apiClient.post(
          API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.CREATE,
          submissionData
        );
      }

      if (response.success) {
        toast.success(editingStudent ? 'Student updated successfully!' : 'Student created successfully!');
        setIsModalOpen(false);
        setEditingStudent(null);
        fetchStudents();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && students.length === 0) {
    return <FullPageLoader message="Loading students..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Students Management</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              placeholder="Search students..."
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
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All Status' }, ...STUDENT_STATUS]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">{student.studentProfile?.registrationNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {student.profilePhoto?.url ? (
                          <img src={student.profilePhoto.url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 p-1 rounded-full bg-gray-100" />
                        )}
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-gray-500">{student.gender}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </div>
                    </TableCell>
                    <TableCell>{getStudentClassName(student)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{student.parentInfo?.fatherName || student.guardianInfo?.name || '-'}</div>
                        {(student.parentInfo?.fatherPhone || student.guardianInfo?.phone) && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Phone className="w-3 h-3" />
                            {student.parentInfo?.fatherPhone || student.guardianInfo?.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${student.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : student.status === 'graduated'
                            ? 'bg-blue-100 text-blue-700'
                            : student.status === 'suspended'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleView(student)} title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(student)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleIndividualDownload(student)} title="Download Card">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(student._id)}>
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
              Showing {students.length} of {pagination.total} students
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

      {/* Student Form Modal */}
      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        onSubmit={handleFormSubmit}
        editingStudent={editingStudent}
        isSubmitting={submitting}
        branches={branches}
        classes={classes}
        departments={departments}
        userRole="branch_admin"
        currentBranchId={currentBranchId}
      />

      {/* View Modal */}
      <StudentViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        student={currentStudent}
        branches={branches}
        classes={classes}
        departments={departments}
      />

      {/* Download Modal */}
      <Modal
        open={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        title="Download Students Data"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDownloadModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Format</label>
            <Dropdown
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
              options={[
                { value: 'pdf', label: 'PDF' },
                { value: 'xlsx', label: 'Excel (XLSX)' },
              ]}
            />
          </div>
          <div className="text-sm text-gray-600">
            <p>This will download all students data in the selected format.</p>
            <p>Current filters will be applied to the download.</p>
          </div>
        </div>
      </Modal>

      {/* Card Modal */}
      <Modal
        open={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        title="Student Card Preview"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCardModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCardDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        }
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Card Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-800">Card Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Issue Date</label>
                  <p className="font-semibold">{cardStatus.issueDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Expire Date</label>
                  <p className="font-semibold">{cardStatus.expireDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="font-semibold capitalize">{cardStatus.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Print Count</label>
                  <p className="font-semibold">{cardStatus.printCount}</p>
                </div>
              </div>
            </div>

            {/* Card Preview */}
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <h3 className="font-semibold mb-4 text-center text-gray-800">Card Preview</h3>

              <div className="flex justify-center gap-4">
                {/* Front Side */}
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden relative shadow-lg" style={{ width: '204px', height: '340px' }}>
                  {/* Left border line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 z-10"></div>

                  {/* Header with curved accents */}
                  <div className="relative bg-white">
                    <div className="absolute top-0 left-0 right-0 h-8 bg-blue-600 rounded-b-full"></div>
                    <div className="relative p-1 text-center pt-3">
                      {/* Institute Logo - Larger Size */}
                      <div className="w-16 h-16 bg-white rounded-full mx-auto mb-1 flex items-center justify-center border-2 border-blue-300 shadow-sm">
                        <img
                          src="/easeacademy_logo.jpg"
                          alt="Ease Academy Logo"
                          className="w-full h-full object-contain rounded-full p-1"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%233b82f6'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-size='40' font-weight='bold' fill='white' text-anchor='middle' dy='.3em'%3EEA%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      {/* Program Title */}
                      <div className="bg-blue-50 px-1 py-0.5 rounded mb-1 border border-blue-200">
                        <p className="text-xs font-bold text-blue-800">EASE ACADEMY</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="flex">
                      {/* Student Photo */}
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-16 h-20 border-2 border-green-500 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                          {selectedStudent.profilePhoto?.url ? (
                            <img
                              src={selectedStudent.profilePhoto.url}
                              alt="Student Photo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* Student Details */}
                      <div className="flex-1">
                        <div className="mb-2">
                          <p className="font-bold text-[15px] text-gray-900 leading-tight break-words">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </p>
                        </div>
                        <div className="mb-1">
                          <p className="text-[12px] text-gray-700 leading-tight">
                            <span className="font-semibold">Class:</span> {getStudentClassName(selectedStudent)}
                          </p>
                        </div>
                        <div className="mb-2">
                          <p className="text-[12px] font-semibold text-blue-700 leading-tight">
                            <span className="font-normal text-gray-700">ID:</span> {selectedStudent.studentProfile?.registrationNumber || selectedStudent.admissionNumber || 'Not Assigned'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] text-gray-600 leading-tight">
                            <span className="font-semibold">Gender:</span> {selectedStudent.gender}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code at Bottom - Larger Size */}
                    <div className="mt-4 flex justify-center">
                      <div className="w-20 h-20 border border-gray-300 rounded-lg bg-white flex items-center justify-center">
                        {qrCodeUrl ? (
                          <img src={qrCodeUrl} alt="QR Code" className="w-full h-full p-1" />
                        ) : (
                          <div className="text-center">
                            <span className="text-[9px] text-gray-500 block">QR CODE</span>
                            <span className="text-[7px] text-gray-400 block">(Scan for details)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-3 bg-blue-600 rounded-t-full"></div>
                </div>

                {/* Fold Line */}
                <div className="flex flex-col items-center justify-center px-2">
                  <div className="w-1 h-full bg-gray-400"></div>
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-90 whitespace-nowrap">FOLD HERE</div>
                </div>

                {/* Back Side */}
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden relative shadow-lg" style={{ width: '204px', height: '340px' }}>
                  {/* Right border line */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 z-10"></div>

                  {/* Header with curved accents */}
                  <div className="relative bg-white">
                    <div className="absolute top-0 left-0 right-0 h-8 bg-blue-600 rounded-b-full"></div>
                    <div className="relative p-1 text-center pt-3">
                      {/* School Logo - Larger Size */}
                      <div className="w-14 h-14 bg-white rounded-full mx-auto mb-1 flex items-center justify-center border-2 border-blue-300">
                        <img
                          src="/easeacademy_logo.jpg"
                          alt="Ease Academy Logo"
                          className="w-full h-full object-contain rounded-full p-0.5"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%233b82f6'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-size='35' font-weight='bold' fill='white' text-anchor='middle' dy='.3em'%3EEA%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      <p className="text-xs font-bold text-blue-800">EASE ACADEMY</p>
                      <p className="text-[10px] text-blue-600">Student ID Card</p>
                    </div>
                  </div>

                  <div className="p-3 h-full flex flex-col">
                    {/* Content Area - Student Details First */}
                    <div className="space-y-3 mb-3">
                      {/* Student Details - Top Section */}
                      <div className="bg-gray-50 p-2 rounded border border-gray-200">
                        <p className="text-[10px] font-bold text-gray-800 mb-1">Student Details</p>
                        <div className="text-[9px] text-gray-700 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{(() => {
                              const guardianName = selectedStudent.guardianInfo?.name || selectedStudent.studentProfile?.guardian?.name;
                              const fatherName = selectedStudent.parentInfo?.fatherName || selectedStudent.studentProfile?.father?.name;
                              if (guardianName) return 'Guardian:';
                              if (fatherName) return 'Father:';
                              return 'Parent:';
                            })()}:</span>
                            <div className="flex-1 border-b border-dashed border-gray-400 min-h-[12px]">
                              <span className="px-1">{selectedStudent.parentInfo?.fatherName || selectedStudent.guardianInfo?.name || selectedStudent.studentProfile?.father?.name || selectedStudent.studentProfile?.guardian?.name || ''}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">DOB:</span>
                            <div className="flex-1 border-b border-dashed border-gray-400 min-h-[12px]">
                              <span className="px-1">{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">Blood Group:</span>
                            <div className="flex-1 border-b border-dashed border-gray-400 min-h-[12px]">
                              <span className="px-1">{selectedStudent.bloodGroup || ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Important Information - Middle Section */}
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <p className="text-[10px] font-bold text-blue-800 mb-1">Important Information</p>
                        <ul className="text-[9px] text-gray-700 space-y-0.5 list-disc list-inside">
                          <li>This card is non-transferable</li>
                          <li>Must be carried at all times</li>
                          <li>Report loss immediately to office</li>
                          <li>Valid for academic year only</li>
                        </ul>
                      </div>
                    </div>

                    {/* Signature Area */}
                    <div className="mt-auto">
                      <div className="border-t border-gray-300 pt-2 text-center">
                        <p className="text-[10px] text-gray-500 mb-1">Authorized Signature</p>
                        <div className="h-4 border-b border-dashed border-gray-400 mx-8"></div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-3 bg-blue-600 rounded-t-full"></div>
                </div>
              </div>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}







