'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Plus, Edit, Trash2, Search, Eye, Mail, Phone, User, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { pdf } from '@react-pdf/renderer';
import StudentCardPDF from '@/components/StudentCardPDF';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import StudentFormModal from '@/components/forms/StudentFormModal';
import StudentViewModal from '@/components/modals/StudentViewModal';

const SuperAdminStudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [deleteModal, setDeleteModal] = useState({ open: false, student: null });
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [cardStatus, setCardStatus] = useState({
    issueDate: '',
    expireDate: '',
    status: 'active',
    printCount: 0,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Fetch all data
  useEffect(() => {
    fetchStudents();
    fetchBranches();
    fetchClasses();
    fetchDepartments();
  }, [search, branchFilter, classFilter, statusFilter, pagination.page]);

  useEffect(() => {
    if (selectedStudent && isCardModalOpen) {
      const studentData = {
        id: selectedStudent.studentProfile?.registrationNumber || selectedStudent.admissionNumber || 'Not Assigned',
        name: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        class: selectedStudent.studentProfile?.classId?.name || selectedStudent.classId?.name || 'Not Assigned',
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
        role: 'student',
        populate: 'branchId,studentProfile.classId,studentProfile.departmentId'
      };
      if (branchFilter) params.branchId = branchFilter;
      if (classFilter) params.classId = classFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.USERS.LIST, params);
      if (response.success) {
        setStudents(response.data.users || response.data.students || []);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { limit: 100 });
      if (response.success) {
        setBranches(response.data.branches || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const params = { limit: 200 };
      if (branchFilter) params.branchId = branchFilter;
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST, { params });
      if (response.success) {
        setClasses(response.data.classes || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  // Reset class filter when branch changes
  useEffect(() => {
    setClassFilter('');
  }, [branchFilter]);

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.LIST, { limit: 100 });
      if (response.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleFormSubmit = async (submissionData) => {
    try {
      setSubmitting(true);
      
      let response;
      
      if (submissionData.isEditMode) {
        // Update student
        response = await apiClient.put(
          API_ENDPOINTS.SUPER_ADMIN.USERS.UPDATE.replace(':id', submissionData.studentId),
          {
            ...submissionData,
            pendingProfileFile: undefined,
            pendingDocuments: undefined,
            isEditMode: undefined,
            studentId: undefined,
          }
        );
      } else {
        // Create student
        response = await apiClient.post(
          API_ENDPOINTS.SUPER_ADMIN.STUDENTS.CREATE,
          {
            ...submissionData,
            pendingProfileFile: undefined,
            pendingDocuments: undefined,
            isEditMode: undefined,
            studentId: undefined,
          }
        );
      }

      if (response.success) {
        // Handle file uploads if any
        const studentId = response.data._id || submissionData.studentId;
        
        // Upload profile photo if exists
        if (submissionData.pendingProfileFile && studentId) {
          const profileFormData = new FormData();
          profileFormData.append('file', submissionData.pendingProfileFile);
          profileFormData.append('fileType', 'profile');
          profileFormData.append('userId', studentId);
          
          await apiClient.post(API_ENDPOINTS.COMMON.UPLOAD, profileFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        
        // Upload documents if any
        if (submissionData.pendingDocuments.length > 0 && studentId) {
          for (const doc of submissionData.pendingDocuments) {
            const docFormData = new FormData();
            docFormData.append('file', doc.file);
            docFormData.append('fileType', 'student_document');
            docFormData.append('documentType', doc.type);
            docFormData.append('userId', studentId);
            
            await apiClient.post(API_ENDPOINTS.COMMON.UPLOAD, docFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }
        }
        
        // Refresh data and close modal
        fetchStudents();
        setIsFormModalOpen(false);
        setEditingStudent(null);
      }
    } catch (error) {
      console.error('Error saving student:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsFormModalOpen(true);
  };

  const handleView = (student) => {
    setViewingStudent(student);
    setIsViewModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.student) return;
    
    try {
      setSubmitting(true);
      const response = await apiClient.delete(
        API_ENDPOINTS.SUPER_ADMIN.USERS.DELETE.replace(':id', deleteModal.student._id)
      );
      
      if (response.success) {
        fetchStudents();
        setDeleteModal({ open: false, student: null });
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsFormModalOpen(true);
  };

  const getStudentClassName = (student) => {
    const classId = student.studentProfile?.classId?._id || student.studentProfile?.classId || student.classId;
    const classObj = classes.find(c => c._id === classId);
    return classObj?.name || student.studentProfile?.classId?.name || student.classId?.name || 'Not Assigned';
  };

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = students.map(student => ({
        'Student Name': `${student.firstName} ${student.lastName}`,
        'Email': student.email,
        'Registration Number': student.studentProfile?.registrationNumber || 'N/A',
        'Class': getStudentClassName(student),
        'Branch': student.branchId?.name || 'N/A',
        'Parent Name': student.studentProfile?.father?.name || student.studentProfile?.guardian?.name || '-',
        'Parent Phone': student.studentProfile?.father?.phone || student.studentProfile?.guardian?.phone || '-',
        'Status': student.status,
        'Phone': student.phone || '-',
        'Date of Birth': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
        'Gender': student.gender || 'N/A',
        'Blood Group': student.bloodGroup || 'N/A',
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');

      // Generate filename with current date
      const fileName = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, fileName);

      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export students data. Please try again.');
    }
  };

  const handleDownloadCard = (student) => {
    setSelectedStudent(student);
    setCardStatus({
      issueDate: new Date().toISOString().split('T')[0],
      expireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      printCount: 0,
    });
    setIsCardModalOpen(true);
  };

  const generateQRCode = async (data) => {
    try {
      const qrCodeData = JSON.stringify({
        studentId: data._id,
        registrationNumber: data.studentProfile?.registrationNumber,
        name: `${data.firstName} ${data.lastName}`,
        branch: data.branchId?.name,
        class: data.studentProfile?.classId?.name,
        timestamp: new Date().toISOString(),
      });

      const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrCodeUrl);
      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const generateCard = async () => {
    if (!selectedStudent) return;

    try {
      setSubmitting(true);

      // Generate QR code
      const qrCodeUrl = await generateQRCode(selectedStudent);

      if (!qrCodeUrl) {
        alert('Failed to generate QR code');
        return;
      }

      // Prepare card data
      const cardData = {
        student: selectedStudent,
        qrCodeUrl,
        issueDate: cardStatus.issueDate || new Date().toISOString().split('T')[0],
        expireDate: cardStatus.expireDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: cardStatus.status,
        printCount: cardStatus.printCount + 1,
      };

      // Generate PDF using react-pdf
      const blob = await pdf(
        <StudentCardPDF
          student={cardData.student}
          qrCodeUrl={cardData.qrCodeUrl}
          classes={classes}
          issueDate={cardData.issueDate}
          expireDate={cardData.expireDate}
          status={cardData.status}
        />
      ).toBlob();

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-card-${selectedStudent.studentProfile?.registrationNumber || selectedStudent._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update card status
      setCardStatus(prev => ({
        ...prev,
        printCount: prev.printCount + 1,
      }));

      // Close modal
      setIsCardModalOpen(false);
      setSelectedStudent(null);
      setQrCodeUrl('');

    } catch (error) {
      console.error('Error generating card:', error);
      alert('Failed to generate student card');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && students.length === 0) {
    return <FullPageLoader message="Loading students..." />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Students Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Super Admin Panel - Manage all students</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              options={[
                { value: '', label: 'All Branches' },
                ...branches.map(b => ({ value: b._id, label: b.name })),
              ]}
            />
            <Dropdown
              placeholder="Filter by class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map(c => ({ value: c._id, label: c.name })),
              ]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'graduated', label: 'Graduated' },
                { value: 'transferred', label: 'Transferred' },
              ]}
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Registration #</TableHead>
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Branch</TableHead>
                  <TableHead className="font-semibold">Parent</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No students found</p>
                      <p className="text-sm mt-1">Add your first student to get started</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {student.profilePhoto?.url ? (
                            <img 
                              src={student.profilePhoto.url} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover border" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 border flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm font-medium text-gray-900">
                          {student.studentProfile?.registrationNumber || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {(() => {
                            const classId = student.studentProfile?.classId?._id || student.studentProfile?.classId || student.classId;
                            const classObj = classes.find(c => c._id === classId);
                            return classObj?.name || student.studentProfile?.classId?.name || student.classId?.name || 'Not Assigned';
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {student.branchId?.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {student.studentProfile?.father?.name || student.studentProfile?.guardian?.name || '-'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {student.studentProfile?.father?.phone || student.studentProfile?.guardian?.phone || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.status === 'active'
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleView(student)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDownloadCard(student)}
                            title="Download Card"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEdit(student)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteModal({ open: true, student })}
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Form Modal */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingStudent(null);
        }}
        onSubmit={handleFormSubmit}
        editingStudent={editingStudent}
        isSubmitting={submitting}
        branches={branches}
        classes={classes}
        departments={departments}
        userRole="super_admin"
      />

      {/* Student View Modal */}
      <StudentViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingStudent(null);
        }}
        student={viewingStudent}
        branches={branches}
        classes={classes}
        departments={departments}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Student</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {deleteModal.student?.firstName} {deleteModal.student?.lastName}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ open: false, student: null })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? <ButtonLoader /> : 'Delete Student'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
            <Button onClick={generateCard}>
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
                            <span className="font-semibold">Class:</span> {(() => {
                              const classId = selectedStudent.studentProfile?.classId?._id || selectedStudent.studentProfile?.classId || selectedStudent.classId;
                              const classObj = classes.find(c => c._id === classId);
                              return classObj?.name || selectedStudent.studentProfile?.classId?.name || selectedStudent.classId?.name || 'Not Assigned';
                            })()}
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
                            <span className="font-semibold">
                              {selectedStudent.studentProfile?.father?.name ? 'Father:' : selectedStudent.studentProfile?.guardian?.name ? 'Guardian:' : 'Parent:'}
                            </span>
                            <div className="flex-1 border-b border-dashed border-gray-400 min-h-[12px]">
                              <span className="px-1">{selectedStudent.studentProfile?.father?.name || selectedStudent.studentProfile?.guardian?.name || ''}</span>
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
};

export default SuperAdminStudentsPage;