// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
// import { Button } from '@/components/ui/button';
// import Input from '@/components/ui/input';
// import Dropdown from '@/components/ui/dropdown';
// import Tabs from '@/components/ui/tabs';
// import FullPageLoader from '@/components/ui/full-page-loader';
// import ButtonLoader from '@/components/ui/button-loader';
// import { Plus, Edit, Trash2, Search, Eye, Mail, Phone, User } from 'lucide-react';
// import { useAuth } from '@/hooks/useAuth';
// import apiClient from '@/lib/api-client';
// import { API_ENDPOINTS } from '@/constants/api-endpoints';
// import StudentFormModal from '@/components/forms/StudentFormModal';

// const SuperAdminStudentsPage = () => {
//   const { user } = useAuth();
//   const [students, setStudents] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [classes, setClasses] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isFormModalOpen, setIsFormModalOpen] = useState(false);
//   const [editingStudent, setEditingStudent] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [search, setSearch] = useState('');
//   const [branchFilter, setBranchFilter] = useState('');
//   const [classFilter, setClassFilter] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

//   // Fetch all data
//   useEffect(() => {
//     fetchStudents();
//     fetchBranches();
//     fetchClasses();
//     fetchDepartments();
//   }, [search, branchFilter, classFilter, statusFilter, pagination.page]);

//   const fetchStudents = async () => {
//     try {
//       setLoading(true);
//       const params = {
//         page: pagination.page,
//         limit: pagination.limit,
//         search,
//         role: 'student',
//       };
//       if (branchFilter) params.branchId = branchFilter;
//       if (classFilter) params.classId = classFilter;
//       if (statusFilter) params.status = statusFilter;

//       const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.USERS.LIST, params);
//       if (response.success) {
//         setStudents(response.data.users || response.data.students || []);
//         setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
//       }
//     } catch (error) {
//       console.error('Error fetching students:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchBranches = async () => {
//     try {
//       const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { limit: 100 });
//       if (response.success) {
//         setBranches(response.data.branches || []);
//       }
//     } catch (error) {
//       console.error('Error fetching branches:', error);
//     }
//   };

//   const fetchClasses = async () => {
//     try {
//       const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST, { limit: 100 });
//       if (response.success) {
//         setClasses(response.data.classes || []);
//       }
//     } catch (error) {
//       console.error('Error fetching classes:', error);
//     }
//   };

//   const fetchDepartments = async () => {
//     try {
//       const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.LIST, { limit: 100 });
//       if (response.success) {
//         setDepartments(response.data.departments || []);
//       }
//     } catch (error) {
//       console.error('Error fetching departments:', error);
//     }
//   };

//   const handleFormSubmit = async (submissionData) => {
//     try {
//       setSubmitting(true);
      
//       let response;
      
//       if (submissionData.isEditMode) {
//         // Update student
//         response = await apiClient.put(
//           API_ENDPOINTS.SUPER_ADMIN.USERS.UPDATE.replace(':id', submissionData.studentId),
//           {
//             ...submissionData,
//             // Remove internal fields
//             pendingProfileFile: undefined,
//             pendingDocuments: undefined,
//             isEditMode: undefined,
//             studentId: undefined,
//           }
//         );
//       } else {
//         // Create student
//         response = await apiClient.post(
//           API_ENDPOINTS.SUPER_ADMIN.STUDENTS.CREATE,
//           {
//             ...submissionData,
//             pendingProfileFile: undefined,
//             pendingDocuments: undefined,
//             isEditMode: undefined,
//             studentId: undefined,
//           }
//         );
//       }

//       if (response.success) {
//         // Handle file uploads if any
//         const studentId = response.data._id || submissionData.studentId;
        
//         // Upload profile photo if exists
//         if (submissionData.pendingProfileFile && studentId) {
//           const profileFormData = new FormData();
//           profileFormData.append('file', submissionData.pendingProfileFile);
//           profileFormData.append('fileType', 'profile');
//           profileFormData.append('userId', studentId);
          
//           await apiClient.post(API_ENDPOINTS.COMMON.UPLOAD, profileFormData, {
//             headers: { 'Content-Type': 'multipart/form-data' },
//           });
//         }
        
//         // Upload documents if any
//         if (submissionData.pendingDocuments.length > 0 && studentId) {
//           for (const doc of submissionData.pendingDocuments) {
//             const docFormData = new FormData();
//             docFormData.append('file', doc.file);
//             docFormData.append('fileType', 'student_document');
//             docFormData.append('documentType', doc.type);
//             docFormData.append('userId', studentId);
            
//             await apiClient.post(API_ENDPOINTS.COMMON.UPLOAD, docFormData, {
//               headers: { 'Content-Type': 'multipart/form-data' },
//             });
//           }
//         }
        
//         // Refresh data and close modal
//         fetchStudents();
//         setIsFormModalOpen(false);
//         setEditingStudent(null);
//       }
//     } catch (error) {
//       console.error('Error saving student:', error);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleEdit = (student) => {
//     setEditingStudent(student);
//     setIsFormModalOpen(true);
//   };

//   const handleAddNew = () => {
//     setEditingStudent(null);
//     setIsFormModalOpen(true);
//   };

//   if (loading && students.length === 0) {
//     return <FullPageLoader message="Loading students..." />;
//   }

//   return (
//     <div className="p-6">
//       <Card>
//         <CardHeader className="border-b">
//           <div className="flex items-center justify-between">
//             <CardTitle>Students Management (Super Admin)</CardTitle>
//             <Button onClick={handleAddNew}>
//               <Plus className="w-4 h-4 mr-2" />
//               Add Student
//             </Button>
//           </div>
//         </CardHeader>

//         <CardContent>
//           {/* Filters */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//             <Input
//               placeholder="Search students..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               icon={Search}
//             />
//             <Dropdown
//               placeholder="Filter by branch"
//               value={branchFilter}
//               onChange={(e) => setBranchFilter(e.target.value)}
//               options={[
//                 { value: '', label: 'All Branches' },
//                 ...branches.map(b => ({ value: b._id, label: b.name })),
//               ]}
//             />
//             <Dropdown
//               placeholder="Filter by class"
//               value={classFilter}
//               onChange={(e) => setClassFilter(e.target.value)}
//               options={[
//                 { value: '', label: 'All Classes' },
//                 ...classes.map(c => ({ value: c._id, label: c.name })),
//               ]}
//             />
//             <Dropdown
//               placeholder="Filter by status"
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               options={[
//                 { value: '', label: 'All Status' },
//                 { value: 'active', label: 'Active' },
//                 { value: 'inactive', label: 'Inactive' },
//                 { value: 'graduated', label: 'Graduated' },
//                 { value: 'transferred', label: 'Transferred' },
//               ]}
//             />
//           </div>

//           {/* Table */}
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Student</TableHead>
//                 <TableHead>Registration #</TableHead>
//                 <TableHead>Class</TableHead>
//                 <TableHead>Branch</TableHead>
//                 <TableHead>Parent</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {students.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={7} className="text-center text-gray-500">
//                     No students found
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 students.map((student) => (
//                   <TableRow key={student._id}>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         {student.profilePhoto?.url ? (
//                           <img src={student.profilePhoto.url} alt="" className="w-8 h-8 rounded-full object-cover" />
//                         ) : (
//                           <User className="w-8 h-8 p-1 rounded-full bg-gray-100" />
//                         )}
//                         <div>
//                           <div className="font-medium">{student.firstName} {student.lastName}</div>
//                           <div className="text-xs text-gray-500">{student.email}</div>
//                         </div>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="font-mono text-sm">
//                         {student.studentProfile?.registrationNumber || 'N/A'}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       {student.studentProfile?.classId?.name || 'Not Assigned'}
//                     </TableCell>
//                     <TableCell>
//                       {student.branchId?.name || 'N/A'}
//                     </TableCell>
//                     <TableCell>
//                       <div className="text-sm">
//                         <div>{student.studentProfile?.father?.name || student.studentProfile?.guardian?.name || '-'}</div>
//                         <div className="flex items-center gap-1 text-gray-500 text-xs">
//                           <Phone className="w-3 h-3" />
//                           {student.studentProfile?.father?.phone || student.studentProfile?.guardian?.phone || '-'}
//                         </div>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs ${
//                           student.status === 'active'
//                             ? 'bg-green-100 text-green-700'
//                             : student.status === 'graduated'
//                             ? 'bg-blue-100 text-blue-700'
//                             : student.status === 'suspended'
//                             ? 'bg-red-100 text-red-700'
//                             : 'bg-gray-100 text-gray-700'
//                         }`}
//                       >
//                         {student.status}
//                       </span>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex gap-2">
//                         <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(student)}>
//                           <Edit className="w-4 h-4" />
//                         </Button>
//                         <Button variant="ghost" size="icon-sm">
//                           <Eye className="w-4 h-4" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Student Form Modal */}
//       <StudentFormModal
//         isOpen={isFormModalOpen}
//         onClose={() => {
//           setIsFormModalOpen(false);
//           setEditingStudent(null);
//         }}
//         onSubmit={handleFormSubmit}
//         editingStudent={editingStudent}
//         isSubmitting={submitting}
//         branches={branches}
//         classes={classes}
//         departments={departments}
//         userRole="super_admin"
//       />
//     </div>
//   );
// };

// export default SuperAdminStudentsPage;








'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Plus, Edit, Trash2, Search, Eye, Mail, Phone, User, Download } from 'lucide-react';
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

  // Fetch all data
  useEffect(() => {
    fetchStudents();
    fetchBranches();
    fetchClasses();
    fetchDepartments();
  }, [search, branchFilter, classFilter, statusFilter, pagination.page]);

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

  const exportToExcel = () => {
    // Implement export functionality
    console.log('Exporting to Excel');
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
                          {student.studentProfile?.classId?.name || 'Not Assigned'}
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
    </div>
  );
};

export default SuperAdminStudentsPage;




