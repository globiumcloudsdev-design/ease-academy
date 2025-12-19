// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
// import { Button } from '@/components/ui/button';
// import Input from '@/components/ui/input';
// import Dropdown from '@/components/ui/dropdown';
// import Modal from '@/components/ui/modal';
// import Tabs from '@/components/ui/tabs';
// import FullPageLoader from '@/components/ui/full-page-loader';
// import ButtonLoader from '@/components/ui/button-loader';
// import BloodGroupSelect from '@/components/ui/blood-group';
// import GenderSelect from '@/components/ui/gender-select';
// import { Plus, Edit, Trash2, Search, User, Mail, Phone, Eye, BookOpen, Upload, X, Calendar, MapPin, FileText } from 'lucide-react';
// import { useAuth } from '@/hooks/useAuth';
// import apiClient from '@/lib/api-client';
// import { API_ENDPOINTS } from '@/constants/api-endpoints';
// import { toast } from 'sonner';

// const TEACHER_STATUS = [
//   { value: 'active', label: 'Active' },
//   { value: 'inactive', label: 'Inactive' },
//   { value: 'on_leave', label: 'On Leave' },
//   { value: 'terminated', label: 'Terminated' },
// ];

// export default function TeachersPage() {
//   const { user } = useAuth();
//   const [teachers, setTeachers] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [subjects, setSubjects] = useState([]);
//   const [classes, setClasses] = useState([]);
//   const [filteredSubjects, setFilteredSubjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [currentTeacher, setCurrentTeacher] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [departmentFilter, setDepartmentFilter] = useState('');
//   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
//   const [activeTab, setActiveTab] = useState('personal');
//   const formRef = useRef(null);
//   const [uploading, setUploading] = useState(false);
//   const [pendingProfileFile, setPendingProfileFile] = useState(null);
//   const [pendingDocuments, setPendingDocuments] = useState([]);

//   const [formData, setFormData] = useState({
//     // Basic user fields
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     alternatePhone: '',
//     dateOfBirth: '',
//     gender: 'male',
//     bloodGroup: '',
//     nationality: 'Pakistani',
//     religion: '',
//     cnic: '',
//     status: 'active',
//     profilePhoto: {
//       url: '',
//       publicId: '',
//     },
//     address: {
//       street: '',
//       city: '',
//       state: '',
//       country: 'Pakistan',
//       postalCode: '',
//     },

//     // Teacher-specific nested profile matching User.teacherProfile
//     teacherProfile: {
//       employeeId: '',
//       joiningDate: new Date().toISOString().split('T')[0],
//       designation: '',
//       departmentId: '',
//       department: '',
//       employmentType: 'full-time',
//       qualifications: [],
//       highestQualification: '',
//       yearsOfExperience: '',
//       specialization: '',
//       previousInstitution: '',
//       achievements: '',
//       subjects: [],
//       classes: [],
//       salaryDetails: {
//         basicSalary: '',
//         allowances: {
//           houseRent: 0,
//           medical: 0,
//           transport: 0,
//           other: 0,
//         },
//         deductions: {
//           tax: 0,
//           providentFund: 0,
//           insurance: 0,
//           other: 0,
//         },
//       },
//       bankAccount: {
//         bankName: '',
//         accountNumber: '',
//         iban: '',
//         branchCode: '',
//       },
//       emergencyContact: {
//         name: '',
//         relationship: '',
//         phone: '',
//       },
//       documents: [],
//     },
//   });

//   useEffect(() => {
//     fetchTeachers();
//     fetchDepartments();
//     fetchSubjects();
//     fetchClasses();
//   }, [search, statusFilter, departmentFilter, pagination.page]);

//   // Update filteredSubjects when selected classes or classes list change
//   useEffect(() => {
//     try {
//       const selected = (formData.teacherProfile?.classes || []).map((c) => {
//         // normalize: allow { classId } object or plain id
//         if (!c) return null;
//         if (typeof c === 'string') return c;
//         if (c.classId) return c.classId._id || c.classId;
//         return null;
//       }).filter(Boolean);

//       if (selected.length === 0) {
//         setFilteredSubjects([]);
//         return;
//       }

//       const subjectIds = new Set();
//       classes.forEach((cls) => {
//         if (selected.includes(String(cls._id)) || selected.includes(cls._id)) {
//           (cls.subjects || []).forEach((s) => subjectIds.add(String(s._id || s)));
//         }
//       });

//       if (subjectIds.size === 0) {
//         setFilteredSubjects([]);
//         return;
//       }

//       const filtered = (subjects || []).filter((s) => subjectIds.has(String(s._id)));
//       setFilteredSubjects(filtered);
//     } catch (err) {
//       console.error('Error filtering subjects by classes:', err);
//       setFilteredSubjects([]);
//     }
//   }, [formData.teacherProfile?.classes, classes, subjects]);

//   const fetchTeachers = async () => {
//     try {
//       setLoading(true);
//       const params = {
//         page: pagination.page,
//         limit: pagination.limit,
//         search,
//       };
//       if (statusFilter) params.status = statusFilter;
//       if (departmentFilter) params.departmentId = departmentFilter;

//       const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.LIST, params);
//       if (response.success) {
//         setTeachers(response.data.teachers);
//         setPagination(response.data.pagination);
//       }
//     } catch (error) {
//       console.error('Error fetching teachers:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchDepartments = async () => {
//     try {
//       const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.DEPARTMENTS.LIST, { limit: 100 });
//       if (response.success) {
//         setDepartments(response.data.departments);
//       }
//     } catch (error) {
//       console.error('Error fetching departments:', error);
//     }
//   };

//   const fetchSubjects = async () => {
//     try {
//       const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.LIST, { limit: 100 });
//       if (response.success) {
//         setSubjects(response.data.subjects);
//       }
//     } catch (error) {
//       console.error('Error fetching subjects:', error);
//     }
//   };

//   const fetchClasses = async () => {
//     try {
//       const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, { limit: 200 });
//       if (response.success) {
//         setClasses(response.data.classes || response.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching classes:', error);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;

//     // support checkboxes
//     const finalValue = type === 'checkbox' ? checked : value;

//     // Set nested path like 'teacherProfile.salaryDetails.allowances.houseRent'
//     const setAtPath = (obj, pathArr, val) => {
//       if (pathArr.length === 0) return val;
//       const [head, ...rest] = pathArr;
//       return {
//         ...obj,
//         [head]: setAtPath(obj?.[head] ?? {}, rest, val),
//       };
//     };

//     setFormData((prev) => {
//       if (!name.includes('.')) {
//         return { ...prev, [name]: finalValue };
//       }
//       const path = name.split('.');
//       const newNested = setAtPath(prev, path, finalValue);
//       // Merge shallowly into prev to keep other top-level keys
//       return { ...prev, ...newNested };
//     });
//   };

//   const handleSubjectToggle = (subjectId) => {
//     setFormData((prev) => {
//       const prevSubjects = prev.teacherProfile?.subjects || [];
//       const next = prevSubjects.includes(subjectId)
//         ? prevSubjects.filter((id) => id !== subjectId)
//         : [...prevSubjects, subjectId];
//       return { ...prev, teacherProfile: { ...prev.teacherProfile, subjects: next } };
//     });
//   };

//   const handleClassToggle = (classId) => {
//     setFormData((prev) => {
//       const existing = prev.teacherProfile?.classes || [];
//       const found = existing.find((c) => String(c.classId) === String(classId));
//       if (found) {
//         return {
//           ...prev,
//           teacherProfile: {
//             ...prev.teacherProfile,
//             classes: existing.filter((c) => String(c.classId) !== String(classId)),
//           },
//         };
//       }

//       return {
//         ...prev,
//         teacherProfile: {
//           ...prev.teacherProfile,
//           classes: [...existing, { classId, section: '', subjectId: '' }],
//         },
//       };
//     });
//   };

//   const handleClassSubjectChange = (classId, subjectId) => {
//     setFormData((prev) => ({
//       ...prev,
//       teacherProfile: {
//         ...prev.teacherProfile,
//         classes: (prev.teacherProfile?.classes || []).map((c) =>
//           String(c.classId) === String(classId) ? { ...c, subjectId } : c
//         ),
//       },
//     }));
//   };

//   const handleClassSectionChange = (classId, section) => {
//     setFormData((prev) => ({
//       ...prev,
//       teacherProfile: {
//         ...prev.teacherProfile,
//         classes: (prev.teacherProfile?.classes || []).map((c) =>
//           String(c.classId) === String(classId) ? { ...c, section } : c
//         ),
//       },
//     }));
//   };

//   const handleProfileUpload = async (file) => {
//     if (!file) return;
//     setPendingProfileFile(file);
//     try {
//       setUploading(true);
//       const uploadFormData = new FormData();
//       uploadFormData.append('file', file);
//       uploadFormData.append('fileType', 'profile');
//       // Optionally add userId if needed: uploadFormData.append('userId', currentTeacher?._id || user?._id);
//       const response = await apiClient.axiosInstance.post('/api/upload', uploadFormData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       if (response.success) {
//         setFormData((prev) => ({
//           ...prev,
//           profilePhoto: {
//             url: response.data.url,
//             publicId: response.data.publicId,
//           },
//         }));
//         alert('Profile photo uploaded successfully!');
//       }
//     } catch (error) {
//       alert('Failed to upload profile photo');
//     } finally {
//       setUploading(false);
//       setPendingProfileFile(null);
//     }
//   };

//   const handleDocumentUpload = async (file, documentType = 'other') => {
//     if (!file) return;
//     try {
//       setUploading(true);
//       const uploadFormData = new FormData();
//       uploadFormData.append('file', file);
//       uploadFormData.append('fileType', 'teacher_document');
//       uploadFormData.append('documentType', documentType);
//       // Optionally add userId if needed: uploadFormData.append('userId', currentTeacher?._id || user?._id);
//       const response = await apiClient.axiosInstance.post('/api/upload', uploadFormData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       if (response.success) {
//         const newDoc = {
//           type: documentType,
//           name: file?.name,
//           url: response.data.url,
//           publicId: response.data.publicId,
//           uploadedAt: new Date().toISOString(),
//         };
//         setFormData((prev) => ({
//           ...prev,
//           teacherProfile: {
//             ...prev.teacherProfile,
//             documents: [...(prev.teacherProfile?.documents || []), newDoc],
//           },
//         }));
//         alert('Document uploaded successfully!');
//       }
//     } catch (error) {
//       alert('Failed to upload document');
//     } finally {
//       setUploading(false);
//     }
//   };

//   const removeDocument = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       teacherProfile: {
//         ...prev.teacherProfile,
//         documents: (prev.teacherProfile?.documents || []).filter((_, i) => i !== index),
//       },
//     }));
//   };

//   const addQualification = () => {
//     setFormData((prev) => ({
//       ...prev,
//       teacherProfile: {
//         ...prev.teacherProfile,
//         qualifications: [...(prev.teacherProfile?.qualifications || []), { degree: '', institution: '', year: '', grade: '' }],
//       },
//     }));
//   };

//   const removeQualification = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       teacherProfile: {
//         ...prev.teacherProfile,
//         qualifications: (prev.teacherProfile?.qualifications || []).filter((_, i) => i !== index),
//       },
//     }));
//   };

//   const updateQualification = (index, field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       teacherProfile: {
//         ...prev.teacherProfile,
//         qualifications: (prev.teacherProfile?.qualifications || []).map((q, i) =>
//           i === index ? { ...q, [field]: value } : q
//         ),
//       },
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);

//     try {
//       // Clean payload to avoid sending empty strings for enum/ObjectId fields
//       const cleanPayload = (input) => {
//         if (input === null || input === undefined) return undefined;
//         if (Array.isArray(input)) {
//           const arr = input
//             .map((v) => cleanPayload(v))
//             .filter((v) => v !== undefined);
//           return arr;
//         }
//         if (typeof input === 'object') {
//           const out = {};
//           Object.keys(input).forEach((k) => {
//             const v = cleanPayload(input[k]);
//             if (v !== undefined && v !== '') {
//               out[k] = v;
//             }
//           });
//           return out;
//         }
//         return input;
//       };

//       // Ensure emergencyContact is always an object
//       const payload = cleanPayload({
//         ...formData,
//         teacherProfile: {
//           ...formData.teacherProfile,
//           emergencyContact: {
//             name: formData.teacherProfile?.emergencyContact?.name || '',
//             relationship: formData.teacherProfile?.emergencyContact?.relationship || '',
//             phone: formData.teacherProfile?.emergencyContact?.phone || '',
//           },
//         },
//       }) || {};

//       if (isEditMode) {
//         const response = await apiClient.put(
//           API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.UPDATE.replace(':id', currentTeacher._id),
//           payload
//         );
//         if (response.success) {
//           toast.success('Teacher updated successfully!');
//           setIsModalOpen(false);
//           fetchTeachers();
//         }
//       } else {
//         const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.CREATE, payload);
//         if (response.success) {
//           toast.success('Teacher created successfully!');
//           setIsModalOpen(false);
//           fetchTeachers();
//         }
//       }
//     } catch (error) {
//       toast.error(error.message || 'Failed to save teacher');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleEdit = (teacher) => {
//     setCurrentTeacher(teacher);
//     setFormData({
//       firstName: teacher.firstName || '',
//       lastName: teacher.lastName || '',
//       email: teacher.email || '',
//       phone: teacher.phone || '',
//       alternatePhone: teacher.alternatePhone || '',
//       dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : '',
//       gender: teacher.gender || 'male',
//       bloodGroup: teacher.bloodGroup || '',
//       nationality: teacher.nationality || 'Pakistani',
//       religion: teacher.religion || '',
//       cnic: teacher.cnic || '',
//       status: teacher.status || 'active',
//       profilePhoto: teacher.profilePhoto || { url: '', publicId: '' },
//       address: teacher.address || { street: '', city: '', state: '', country: 'Pakistan', postalCode: '' },
//       teacherProfile: {
//         employeeId: teacher.teacherProfile?.employeeId || teacher.employeeId || '',
//         joiningDate: teacher.teacherProfile?.joiningDate
//           ? teacher.teacherProfile.joiningDate.split('T')[0]
//           : teacher.joiningDate
//           ? teacher.joiningDate.split('T')[0]
//           : new Date().toISOString().split('T')[0],
//         designation: teacher.teacherProfile?.designation || '',
//         departmentId: teacher.teacherProfile?.departmentId?._id || teacher.departmentId?._id || '',
//         department: teacher.teacherProfile?.department || '',
//         employmentType: teacher.teacherProfile?.employmentType || teacher.employmentType || 'full-time',
//         qualifications: teacher.teacherProfile?.qualifications || teacher.qualifications || [],
//         highestQualification: teacher.teacherProfile?.highestQualification || '',
//         yearsOfExperience: teacher.teacherProfile?.yearsOfExperience || teacher.teacherProfile?.experience || '',
//         specialization: teacher.teacherProfile?.specialization || '',
//         previousInstitution: teacher.teacherProfile?.previousInstitution || '',
//         achievements: teacher.teacherProfile?.achievements || '',
//         subjects: (teacher.teacherProfile?.subjects || teacher.assignedSubjects || teacher.subjects || []).map((s) => s._id || s),
//         classes: teacher.teacherProfile?.classes || teacher.assignedClasses || [],
//         salaryDetails: {
//           basicSalary: teacher.teacherProfile?.salaryDetails?.basicSalary || teacher.salary?.basicSalary || '',
//           allowances: {
//             houseRent: teacher.teacherProfile?.salaryDetails?.allowances?.houseRent ?? (teacher.salary?.allowances?.houseRent ?? 0),
//             medical: teacher.teacherProfile?.salaryDetails?.allowances?.medical ?? (teacher.salary?.allowances?.medical ?? 0),
//             transport: teacher.teacherProfile?.salaryDetails?.allowances?.transport ?? (teacher.salary?.allowances?.transport ?? 0),
//             other: teacher.teacherProfile?.salaryDetails?.allowances?.other ?? (teacher.salary?.allowances?.other ?? 0),
//           },
//           deductions: {
//             tax: teacher.teacherProfile?.salaryDetails?.deductions?.tax ?? (teacher.salary?.deductions?.tax ?? 0),
//             providentFund: teacher.teacherProfile?.salaryDetails?.deductions?.providentFund ?? (teacher.salary?.deductions?.providentFund ?? 0),
//             insurance: teacher.teacherProfile?.salaryDetails?.deductions?.insurance ?? (teacher.salary?.deductions?.insurance ?? 0),
//             other: teacher.teacherProfile?.salaryDetails?.deductions?.other ?? (teacher.salary?.deductions?.other ?? 0),
//           },
//         },
//         bankAccount: {
//           bankName: teacher.teacherProfile?.bankAccount?.bankName || teacher.salary?.bankName || '',
//           accountNumber: teacher.teacherProfile?.bankAccount?.accountNumber || teacher.salary?.accountNumber || '',
//           iban: teacher.teacherProfile?.bankAccount?.iban || '',
//           branchCode: teacher.teacherProfile?.bankAccount?.branchCode || '',
//         },
//         emergencyContact: teacher.teacherProfile?.emergencyContact || teacher.emergencyContact || { name: '', relationship: '', phone: '' },
//         documents: teacher.teacherProfile?.documents || teacher.documents || [],
//       },
//     });
//     setIsEditMode(true);
//     setActiveTab('personal');
//     setIsModalOpen(true);
//   };

//   const handleView = (teacher) => {
//     setCurrentTeacher(teacher);
//     setIsViewModalOpen(true);
//   };

//   const handleDelete = async (id) => {
//     if (!confirm('Are you sure you want to delete this teacher?')) return;

//     try {
//       const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.DELETE.replace(':id', id));
//       if (response.success) {
//         alert('Teacher deleted successfully!');
//         fetchTeachers();
//       }
//     } catch (error) {
//       alert(error.message || 'Failed to delete teacher');
//     }
//   };

//   const handleAddNew = () => {
//     setCurrentTeacher(null);
//     setFormData({
//       firstName: '',
//       lastName: '',
//       email: '',
//       phone: '',
//       alternatePhone: '',
//       dateOfBirth: '',
//       gender: 'male',
//       bloodGroup: '',
//       nationality: 'Pakistani',
//       religion: '',
//       cnic: '',
//       status: 'active',
//       profilePhoto: { url: '', publicId: '' },
//       address: { street: '', city: '', state: '', country: 'Pakistan', postalCode: '' },
//       teacherProfile: {
//         employeeId: '',
//         joiningDate: new Date().toISOString().split('T')[0],
//         designation: '',
//         departmentId: '',
//         department: '',
//         employmentType: 'full-time',
//         qualifications: [],
//         highestQualification: '',
//         yearsOfExperience: '',
//         specialization: '',
//         previousInstitution: '',
//         achievements: '',
//         subjects: [],
//         classes: [],
//         salaryDetails: { basicSalary: '', allowances: { houseRent: 0, medical: 0, transport: 0, other: 0 }, deductions: { tax: 0, providentFund: 0, insurance: 0, other: 0 } },
//         bankAccount: { bankName: '', accountNumber: '', iban: '', branchCode: '' },
//         emergencyContact: { name: '', relationship: '', phone: '' },
//         documents: [],
//       },
//     });
//     setIsEditMode(false);
//     setActiveTab('personal');
//     setIsModalOpen(true);
//   };

//   const tabsData = [
//     { id: 'personal', label: 'Personal Info' },
//     { id: 'professional', label: 'Professional' },
//     { id: 'qualifications', label: 'Qualifications' },
//     { id: 'salary', label: 'Salary & Bank' },
//     { id: 'documents', label: 'Documents' },
//   ];

//   if (loading && teachers.length === 0) {
//     return <FullPageLoader message="Loading teachers..." />;
//   }

//   return (
//     <div className="p-6">
//       <Card>
//         <CardHeader className="border-b">
//           <div className="flex items-center justify-between">
//             <CardTitle>Teachers Management</CardTitle>
//             <Button onClick={handleAddNew}>
//               <Plus className="w-4 h-4 mr-2" />
//               Add Teacher
//             </Button>
//           </div>
//         </CardHeader>

//         <CardContent>
//           {/* Filters */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             <Input
//               placeholder="Search teachers..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               icon={Search}
//             />
//             <Dropdown
//               placeholder="Filter by department"
//               value={departmentFilter}
//               onChange={(e) => setDepartmentFilter(e.target.value)}
//               options={[
//                 { value: '', label: 'All Departments' },
//                 ...departments.map((d) => ({ value: d._id, label: d?.name })),
//               ]}
//             />
//             <Dropdown
//               placeholder="Filter by status"
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               options={[{ value: '', label: 'All Status' }, ...TEACHER_STATUS]}
//             />
//           </div>

//           {/* Table */}
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Email</TableHead>
//                 <TableHead>Department</TableHead>
//                 <TableHead>Subjects</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {teachers.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={8} className="text-center text-gray-500">
//                     No teachers found
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 teachers.map((teacher) => (
//                   <TableRow key={teacher._id}>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         {teacher.profilePhoto?.url ? (
//                           <img src={teacher.profilePhoto.url} alt="" className="w-8 h-8 rounded-full object-cover" />
//                         ) : (
//                           <User className="w-8 h-8 p-1 rounded-full bg-gray-100" />
//                         )}
//                         <div>
//                           <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
//                           <div className="text-xs text-gray-500">{teacher.teacherProfile?.specialization || teacher.gender}</div>
//                         </div>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-1 text-sm">
//                         <Mail className="w-3 h-3" />
//                         {teacher.email}
//                       </div>
//                     </TableCell>
//                     <TableCell>{teacher.departmentId?.name || 'Not Assigned'}</TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-1">
//                         <BookOpen className="w-3 h-3" />
//                         {teacher.assignedSubjects?.length || teacher.subjects?.length || 0}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs ${
//                           teacher.status === 'active'
//                             ? 'bg-green-100 text-green-700'
//                             : teacher.status === 'on_leave'
//                             ? 'bg-yellow-100 text-yellow-700'
//                             : teacher.status === 'terminated'
//                             ? 'bg-red-100 text-red-700'
//                             : 'bg-gray-100 text-gray-700'
//                         }`}
//                       >
//                         {teacher.status?.replace('_', ' ')}
//                       </span>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex gap-2">
//                         <Button variant="ghost" size="icon-sm" onClick={() => handleView(teacher)} title="View Details">
//                           <Eye className="w-4 h-4" />
//                         </Button>
//                         <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(teacher)}>
//                           <Edit className="w-4 h-4" />
//                         </Button>
//                         <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(teacher._id)}>
//                           <Trash2 className="w-4 h-4 text-red-600" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>

//           {/* Pagination */}
//           <div className="flex justify-between items-center mt-4">
//             <div className="text-sm text-gray-600">
//               Showing {teachers.length} of {pagination.total} teachers
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
//                 disabled={pagination.page === 1}
//               >
//                 Previous
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
//                 disabled={pagination.page >= pagination.pages}
//               >
//                 Next
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Add/Edit Modal */}
//       <Modal
//         open={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
//         size="xl"
//         footer={
//           <div className="flex justify-end gap-2">
//             <Button variant="outline" onClick={() => setIsModalOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleSubmit} disabled={submitting}>
//               {submitting ? <ButtonLoader /> : isEditMode ? 'Update' : 'Create'}
//             </Button>
//           </div>
//         }
//       >
//         <Tabs tabs={tabsData} activeTab={activeTab} onChange={setActiveTab} />
        
//         <form ref={formRef} onSubmit={handleSubmit}>
//           <div className="max-h-[60vh] overflow-y-auto space-y-4 p-1">
            
//             {/* Personal Info Tab */}
//             {activeTab === 'personal' && (
//               <div className="space-y-4">
//                 {/* Profile Photo Upload */}
//                 <div className="border-b pb-4">
//                   <label className="block text-sm font-medium mb-2">Profile Photo</label>
//                   <div className="flex items-center gap-4">
//                     {formData.profilePhoto?.url ? (
//                       <img src={formData.profilePhoto.url} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
//                     ) : (
//                       <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
//                         <User className="w-10 h-10 text-gray-400" />
//                       </div>
//                     )}
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={(e) => handleProfileUpload(e.target.files[0])}
//                       className="hidden"
//                       id="profile-upload"
//                     />
//                     <label htmlFor="profile-upload" className="cursor-pointer">
//                       <div className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
//                         <Upload className="w-4 h-4" />
//                         {uploading ? 'Uploading...' : 'Upload Photo'}
//                       </div>
//                     </label>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">First Name *</label>
//                     <Input
//                       type="text"
//                       name="firstName"
//                       value={formData.firstName}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Last Name *</label>
//                     <Input
//                       type="text"
//                       name="lastName"
//                       value={formData.lastName}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Email *</label>
//                     <Input
//                       type="email"
//                       name="email"
//                       value={formData.email}
//                       onChange={handleInputChange}
//                       icon={Mail}
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Phone</label>
//                     <Input
//                       type="tel"
//                       name="phone"
//                       value={formData.phone}
//                       onChange={handleInputChange}
//                       icon={Phone}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Alternate Phone</label>
//                     <Input
//                       type="tel"
//                       name="alternatePhone"
//                       value={formData.alternatePhone}
//                       onChange={handleInputChange}
//                       icon={Phone}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Date of Birth</label>
//                     <Input
//                       type="date"
//                       name="dateOfBirth"
//                       value={formData.dateOfBirth}
//                       onChange={handleInputChange}
//                       icon={Calendar}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Gender</label>
//                     <GenderSelect
//                       name="gender"
//                       value={formData.gender}
//                       onChange={handleInputChange}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Blood Group</label>
//                     <BloodGroupSelect
//                       name="bloodGroup"
//                       value={formData.bloodGroup}
//                       onChange={handleInputChange}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Nationality</label>
//                     <Input
//                       type="text"
//                       name="nationality"
//                       value={formData.nationality}
//                       onChange={handleInputChange}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Religion</label>
//                     <Input
//                       type="text"
//                       name="religion"
//                       value={formData.religion}
//                       onChange={handleInputChange}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">CNIC</label>
//                     <Input
//                       type="text"
//                       name="cnic"
//                       value={formData.cnic}
//                       onChange={handleInputChange}
//                       placeholder="XXXXX-XXXXXXX-X"
//                     />
//                   </div>
//                                   <div>
//                     <label className="block text-sm font-medium mb-1">Joining Date</label>
//                     <Input
//                       type="date"
//                       name="teacherProfile.joiningDate"
//                       value={formData.teacherProfile?.joiningDate}
//                       onChange={handleInputChange}
//                       icon={Calendar}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Status</label>
//                     <Dropdown
//                       name="status"
//                       value={formData.status}
//                       onChange={handleInputChange}
//                       options={TEACHER_STATUS}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Department</label>
//                     <Dropdown
//                       name="teacherProfile.departmentId"
//                       value={formData.teacherProfile?.departmentId}
//                       onChange={handleInputChange}
//                       options={[
//                         { value: '', label: 'Select Department' },
//                         ...departments.map((d) => ({ value: d._id, label: d?.name })),
//                       ]}
//                     />
//                   </div>
//                 </div>

//                 {/* Address Section */}
//                 <div className="border-t pt-4">
//                   <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
//                     <MapPin className="w-4 h-4" />
//                     Address Information
//                   </h3>
//                   <div className="space-y-3">
//                     <div>
//                       <label className="block text-sm font-medium mb-1">Street Address</label>
//                       <Input
//                         type="text"
//                         name="address.street"
//                         value={formData.address.street}
//                         onChange={handleInputChange}
//                       />
//                     </div>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium mb-1">City</label>
//                         <Input
//                           type="text"
//                           name="address.city"
//                           value={formData.address.city}
//                           onChange={handleInputChange}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium mb-1">State/Province</label>
//                         <Input
//                           type="text"
//                           name="address.state"
//                           value={formData.address.state}
//                           onChange={handleInputChange}
//                         />
//                       </div>
//                     </div>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium mb-1">Country</label>
//                         <Input
//                           type="text"
//                           name="address.country"
//                           value={formData.address.country}
//                           onChange={handleInputChange}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium mb-1">Postal Code</label>
//                         <Input
//                           type="text"
//                           name="address.postalCode"
//                           value={formData.address.postalCode}
//                           onChange={handleInputChange}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Emergency Contact */}
//                 <div className="border-t pt-4">
//                   <h3 className="text-sm font-semibold mb-3">Emergency Contact</h3>
//                   <div className="space-y-3">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium mb-1">Contact Name</label>
//                         <Input
//                           type="text"
//                           name="teacherProfile.emergencyContact.name"
//                           value={formData.teacherProfile?.emergencyContact?.name}
//                           onChange={handleInputChange}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium mb-1">Relationship</label>
//                         <Input
//                           type="text"
//                           name="teacherProfile.emergencyContact.relationship"
//                           value={formData.teacherProfile?.emergencyContact?.relationship}
//                           onChange={handleInputChange}
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium mb-1">Phone Number</label>
//                       <Input
//                         type="tel"
//                         name="teacherProfile.emergencyContact.phone"
//                         value={formData.teacherProfile?.emergencyContact?.phone}
//                         onChange={handleInputChange}
//                         icon={Phone}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Professional Tab */}
//             {activeTab === 'professional' && (
//               <div className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Highest Qualification</label>
//                     <Input
//                       type="text"
//                       name="teacherProfile.highestQualification"
//                       value={formData.teacherProfile.highestQualification}
//                       onChange={handleInputChange}
//                       placeholder="BSc, MSc, PhD..."
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Years of Experience</label>
//                     <Input
//                       type="number"
//                       name="teacherProfile.yearsOfExperience"
//                       value={formData.teacherProfile.yearsOfExperience}
//                       onChange={handleInputChange}
//                       min="0"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Specialization</label>
//                     <Input
//                       type="text"
//                       name="teacherProfile.specialization"
//                       value={formData.teacherProfile.specialization}
//                       onChange={handleInputChange}
//                       placeholder="Mathematics, Physics, Chemistry..."
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Previous Institution</label>
//                     <Input
//                       type="text"
//                       name="teacherProfile.previousInstitution"
//                       value={formData.teacherProfile.previousInstitution}
//                       onChange={handleInputChange}
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Achievements</label>
//                   <textarea
//                     name="teacherProfile.achievements"
//                     value={formData.teacherProfile.achievements}
//                     onChange={handleInputChange}
//                     className="w-full px-3 py-2 border rounded-lg"
//                     rows="3"
//                     placeholder="List achievements, awards, certifications..."
//                   />
//                 </div>

//                 {/* Assigned Subjects */}
//                 <div className="border-t pt-4">
//                   <label className="block text-sm font-medium mb-2">Assign Subjects</label>
//                   <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
//                     {((filteredSubjects && filteredSubjects.length > 0) ? filteredSubjects : subjects).length === 0 ? (
//                       <p className="text-sm text-gray-500">No subjects available</p>
//                     ) : (
//                       ((filteredSubjects && filteredSubjects.length > 0) ? filteredSubjects : subjects).map((subject) => (
//                         <div key={subject._id} className="flex items-center gap-2">
//                               <input
//                                 type="checkbox"
//                                 checked={formData.teacherProfile?.subjects?.includes(subject._id)}
//                                 onChange={() => handleSubjectToggle(subject._id)}
//                                 className="w-4 h-4"
//                               />
//                           <label className="text-sm">
//                             {subject.name} {subject.code ? `(${subject.code})` : ''}
//                           </label>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//                 {/* Assigned Classes */}
//                 <div className="border-t pt-4">
//                   <label className="block text-sm font-medium mb-2">Assign Classes</label>
//                   <div className="border rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
//                     {classes.length === 0 ? (
//                       <p className="text-sm text-gray-500">No classes available</p>
//                     ) : (
//                       classes.map((cls) => {
//                         const assigned = (formData.teacherProfile?.classes || []).find((c) => String(c.classId) === String(cls._id));
//                         return (
//                           <div key={cls._id} className="border rounded p-2">
//                             <div className="flex items-center justify-between">
//                               <div className="flex items-center gap-2">
//                                 <input
//                                   type="checkbox"
//                                   checked={!!assigned}
//                                   onChange={() => handleClassToggle(cls._id)}
//                                   className="w-4 h-4"
//                                 />
//                                 <div>
//                                   <div className="font-medium">{cls.name} {cls.code ? `(${cls.code})` : ''}</div>
//                                   <div className="text-xs text-gray-500">{cls.grade?.name || ''} • {cls.studentCount || 0} students</div>
//                                 </div>
//                               </div>
//                               {assigned && (
//                                 <div className="flex items-center gap-2">
//                                   <select
//                                     value={assigned.section || ''}
//                                     onChange={(e) => handleClassSectionChange(cls._id, e.target.value)}
//                                     className="px-2 py-1 border rounded"
//                                   >
//                                     <option value="">Select Section</option>
//                                     {(cls.sections || []).map((s) => (
//                                       <option key={s.name} value={s.name}>{s.name}</option>
//                                     ))}
//                                   </select>
//                                   <select
//                                     value={assigned.subjectId || ''}
//                                     onChange={(e) => handleClassSubjectChange(cls._id, e.target.value)}
//                                     className="px-2 py-1 border rounded"
//                                   >
//                                     <option value="">Select Subject</option>
//                                     {(cls.subjects || []).map((sub) => (
//                                       <option key={sub._id} value={sub._id}>{sub.name} {sub.code ? `(${sub.code})` : ''}</option>
//                                     ))}
//                                   </select>
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       })
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Qualifications Tab */}
//             {activeTab === 'qualifications' && (
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-sm font-semibold">Academic Qualifications</h3>
//                   <Button type="button" variant="outline" size="sm" onClick={addQualification}>
//                     <Plus className="w-4 h-4 mr-1" />
//                     Add Qualification
//                   </Button>
//                 </div>

//                 {(formData.teacherProfile?.qualifications || []).length === 0 ? (
//                   <div className="text-center py-8 text-gray-500 border rounded-lg">
//                     No qualifications added yet. Click "Add Qualification" to begin.
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     {(formData.teacherProfile?.qualifications || []).map((qual, index) => (
//                       <div key={index} className="border rounded-lg p-4 relative">
//                         <button
//                           type="button"
//                           onClick={() => removeQualification(index)}
//                           className="absolute top-2 right-2 text-red-600 hover:text-red-800"
//                         >
//                           <X className="w-4 h-4" />
//                         </button>
//                         <div className="grid grid-cols-2 gap-4">
//                           <div>
//                             <label className="block text-sm font-medium mb-1">Degree/Certificate</label>
//                             <Input
//                               type="text"
//                               value={qual.degree}
//                               onChange={(e) => updateQualification(index, 'degree', e.target.value)}
//                               placeholder="BSc, MSc, PhD..."
//                             />
//                           </div>
//                           <div>
//                             <label className="block text-sm font-medium mb-1">Institution</label>
//                             <Input
//                               type="text"
//                               value={qual.institution}
//                               onChange={(e) => updateQualification(index, 'institution', e.target.value)}
//                               placeholder="University/College name"
//                             />
//                           </div>
//                           <div>
//                             <label className="block text-sm font-medium mb-1">Year</label>
//                             <Input
//                               type="text"
//                               value={qual.year}
//                               onChange={(e) => updateQualification(index, 'year', e.target.value)}
//                               placeholder="2020"
//                             />
//                           </div>
//                           <div>
//                             <label className="block text-sm font-medium mb-1">Grade/CGPA</label>
//                             <Input
//                               type="text"
//                               value={qual.grade}
//                               onChange={(e) => updateQualification(index, 'grade', e.target.value)}
//                               placeholder="3.8 / A+"
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Salary & Bank Tab */}
//             {activeTab === 'salary' && (
//               <div className="space-y-4">
//                 <h3 className="text-sm font-semibold">Salary Information</h3>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Basic Salary</label>
//                   <Input
//                     type="number"
//                     name="teacherProfile.salaryDetails.basicSalary"
//                     value={formData.teacherProfile?.salaryDetails?.basicSalary}
//                     onChange={handleInputChange}
//                     placeholder="50000"
//                     min="0"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Allowances</label>
//                   <div className="grid grid-cols-2 gap-3">
//                     <div>
//                       <label className="text-sm mb-1">House Rent</label>
//                       <Input
//                         type="number"
//                         name="teacherProfile.salaryDetails.allowances.houseRent"
//                         value={formData.teacherProfile?.salaryDetails?.allowances?.houseRent}
//                         onChange={handleInputChange}
//                         placeholder="House Rent"
//                         min="0"
//                       />
//                     </div>
//                     <div>
//                       <label className="text-sm mb-1">Medical</label>
//                       <Input
//                         type="number"
//                         name="teacherProfile.salaryDetails.allowances.medical"
//                         value={formData.teacherProfile?.salaryDetails?.allowances?.medical}
//                         onChange={handleInputChange}
//                         placeholder="Medical"
//                         min="0"
//                       />
//                     </div>
//                     <div>
//                       <label className="text-sm mb-1">Transport</label>
//                       <Input
//                         type="number"
//                         name="teacherProfile.salaryDetails.allowances.transport"
//                         value={formData.teacherProfile?.salaryDetails?.allowances?.transport}
//                         onChange={handleInputChange}
//                         placeholder="Transport"
//                         min="0"
//                       />
//                     </div>
//                     <div>
//                       <label className="text-sm mb-1">Other</label>
//                       <Input
//                         type="number"
//                         name="teacherProfile.salaryDetails.allowances.other"
//                         value={formData.teacherProfile?.salaryDetails?.allowances?.other}
//                         onChange={handleInputChange}
//                         placeholder="Other"
//                         min="0"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Deductions</label>
//                   <div className="grid grid-cols-2 gap-3">
//                     <div>
//                       <label className="text-sm mb-1">Tax</label>
//                       <Input
//                         type="number"
//                         name="teacherProfile.salaryDetails.deductions.tax"
//                         value={formData.teacherProfile?.salaryDetails?.deductions?.tax}
//                         onChange={handleInputChange}
//                         placeholder="Tax"
//                         min="0"
//                       />
//                     </div>
//                     <div>
//                       <label className="text-sm mb-1">Provident Fund</label>
//                       <Input
//                         type="number"
//                         name="teacherProfile.salaryDetails.deductions.providentFund"
//                         value={formData.teacherProfile?.salaryDetails?.deductions?.providentFund}
//                         onChange={handleInputChange}
//                         placeholder="Provident Fund"
//                         min="0"
//                       />
//                     </div>
//                     <div>
//                       <label className="text-sm mb-1">Insurance</label>
//                       <Input
//                         type="number"
//                         name="teacherProfile.salaryDetails.deductions.insurance"
//                         value={formData.teacherProfile?.salaryDetails?.deductions?.insurance}
//                         onChange={handleInputChange}
//                         placeholder="Insurance"
//                         min="0"
//                       />
//                     </div>
//                     <div>
//                       <label className="text-sm mb-1">Other</label>
//                       <Input
//                         type="number"
//                         name="teacherProfile.salaryDetails.deductions.other"
//                         value={formData.teacherProfile?.salaryDetails?.deductions?.other}
//                         onChange={handleInputChange}
//                         placeholder="Other"
//                         min="0"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="border-t pt-4">
//                   <h3 className="text-sm font-semibold mb-3">Bank Account Details</h3>
//                   <div className="space-y-3">
//                     <div>
//                       <label className="block text-sm font-medium mb-1">Bank Name</label>
//                       <Input
//                         type="text"
//                         name="teacherProfile.bankAccount.bankName"
//                         value={formData.teacherProfile?.bankAccount?.bankName}
//                         onChange={handleInputChange}
//                         placeholder="Bank Al Habib, HBL, MCB..."
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium mb-1">Account Number</label>
//                       <Input
//                         type="text"
//                         name="teacherProfile.bankAccount.accountNumber"
//                         value={formData.teacherProfile?.bankAccount?.accountNumber}
//                         onChange={handleInputChange}
//                         placeholder="XXXXXXXXXXXX"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium mb-1">IBAN</label>
//                       <Input
//                         type="text"
//                         name="teacherProfile.bankAccount.iban"
//                         value={formData.teacherProfile?.bankAccount?.iban}
//                         onChange={handleInputChange}
//                         placeholder="PK00ABCD0000000000000000"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Documents Tab */}
//             {activeTab === 'documents' && (
//               <div className="space-y-4">
//                 <div className="border-2 border-dashed rounded-lg p-6">
//                   <div className="text-center">
//                     <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
//                     <p className="text-sm font-medium mb-2">Upload Documents</p>
//                     <p className="text-xs text-gray-500 mb-4">CNIC, Certificates, Resume, etc.</p>
//                     <input
//                       type="file"
//                       accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
//                       onChange={(e) => handleDocumentUpload(e.target.files[0])}
//                       className="hidden"
//                       id="document-upload"
//                     />
//                     <label htmlFor="document-upload" className="cursor-pointer">
//                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                         <Upload className="w-4 h-4" />
//                         {uploading ? 'Uploading...' : 'Choose File'}
//                       </div>
//                     </label>
//                   </div>
//                 </div>

//                 {(formData.teacherProfile?.documents || []).length > 0 && (
//                   <div className="space-y-2">
//                     <h3 className="text-sm font-semibold">Uploaded Documents</h3>
//                     {(formData.teacherProfile?.documents || []).map((doc, index) => (
//                       <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
//                         <div className="flex items-center gap-2">
//                           <FileText className="w-4 h-4 text-gray-400" />
//                           <div>
//                             <p className="text-sm font-medium">{doc.name}</p>
//                             <p className="text-xs text-gray-500">{doc.type || 'Document'}</p>
//                           </div>
//                         </div>
//                         <div className="flex gap-2">
//                           <a
//                             href={doc.url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-blue-600 hover:text-blue-800 text-sm"
//                           >
//                             View
//                           </a>
//                           <button
//                             type="button"
//                             onClick={() => removeDocument(index)}
//                             className="text-red-600 hover:text-red-800"
//                           >
//                             <X className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//           </div>
//         </form>
//       </Modal>

//       {/* View Modal */}
//       <Modal
//         open={isViewModalOpen}
//         onClose={() => setIsViewModalOpen(false)}
//         title="Teacher Details"
//         size="xl"
//         footer={
//           <div className="flex justify-end">
//             <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
//               Close
//             </Button>
//           </div>
//         }
//       >
//         {currentTeacher && (
//           <div className="space-y-6 max-h-[70vh] overflow-y-auto">
//             {/* Profile Section */}
//             <div className="flex items-center gap-4 pb-4 border-b">
//               {currentTeacher.profilePhoto?.url ? (
//                 <img src={currentTeacher.profilePhoto.url} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
//               ) : (
//                 <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
//                   <User className="w-12 h-12 text-gray-400" />
//                 </div>
//               )}
//               <div>
//                 <h2 className="text-2xl font-bold">
//                   {currentTeacher.firstName} {currentTeacher.lastName}
//                 </h2>
//                 <p className="text-gray-600">{currentTeacher.employeeId}</p>
//                 <span
//                   className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
//                     currentTeacher.status === 'active'
//                       ? 'bg-green-100 text-green-700'
//                       : currentTeacher.status === 'on_leave'
//                       ? 'bg-yellow-100 text-yellow-700'
//                       : currentTeacher.status === 'terminated'
//                       ? 'bg-red-100 text-red-700'
//                       : 'bg-gray-100 text-gray-700'
//                   }`}
//                 >
//                   {currentTeacher.status?.replace('_', ' ').toUpperCase()}
//                 </span>
//               </div>
//             </div>

//             {/* Personal Information */}
//             <div>
//               <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
//                 <User className="w-5 h-5" />
//                 Personal Information
//               </h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">Email</label>
//                   <p className="flex items-center gap-2">
//                     <Mail className="w-4 h-4" />
//                     {currentTeacher.email}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">Phone</label>
//                   <p className="flex items-center gap-2">
//                     <Phone className="w-4 h-4" />
//                     {currentTeacher.phone || '-'}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">Date of Birth</label>
//                   <p className="flex items-center gap-2">
//                     <Calendar className="w-4 h-4" />
//                     {currentTeacher.dateOfBirth ? new Date(currentTeacher.dateOfBirth).toLocaleDateString() : '-'}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">Gender</label>
//                   <p className="capitalize">{currentTeacher.gender || '-'}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">Blood Group</label>
//                   <p>{currentTeacher.bloodGroup || '-'}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">Nationality</label>
//                   <p>{currentTeacher.nationality || '-'}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">Religion</label>
//                   <p>{currentTeacher.religion || '-'}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">CNIC</label>
//                   <p>{currentTeacher.cnic || '-'}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Employment Information */}
//             <div className="border-t pt-4">
//               <h3 className="text-lg font-semibold mb-3">Employment Information</h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">Department</label>
//                   <p>{currentTeacher.departmentId?.name || 'Not Assigned'}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-500">Joining Date</label>
//                   <p className="flex items-center gap-2">
//                     <Calendar className="w-4 h-4" />
//                     {currentTeacher.joiningDate ? new Date(currentTeacher.joiningDate).toLocaleDateString() : '-'}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Professional Information */}
//             {currentTeacher.teacherProfile && (
//               <div className="border-t pt-4">
//                 <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
//                   <BookOpen className="w-5 h-5" />
//                   Professional Information
//                 </h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Qualification</label>
//                     <p>{currentTeacher.teacherProfile.qualification || '-'}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Experience</label>
//                     <p>{currentTeacher.teacherProfile.experience ? `${currentTeacher.teacherProfile.experience} years` : '-'}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Specialization</label>
//                     <p>{currentTeacher.teacherProfile.specialization || '-'}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Previous Institution</label>
//                     <p>{currentTeacher.teacherProfile.previousInstitution || '-'}</p>
//                   </div>
//                 </div>
//                 {currentTeacher.teacherProfile.achievements && (
//                   <div className="mt-3">
//                     <label className="text-sm font-medium text-gray-500">Achievements</label>
//                     <p className="text-sm mt-1">{currentTeacher.teacherProfile.achievements}</p>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Qualifications */}
//             {currentTeacher.qualifications && currentTeacher.qualifications.length > 0 && (
//               <div className="border-t pt-4">
//                 <h3 className="text-lg font-semibold mb-3">Academic Qualifications</h3>
//                 <div className="space-y-3">
//                   {currentTeacher.qualifications.map((qual, index) => (
//                     <div key={index} className="border rounded-lg p-3 bg-gray-50">
//                       <div className="grid grid-cols-2 gap-2 text-sm">
//                         <div>
//                           <span className="font-medium">Degree:</span> {qual.degree}
//                         </div>
//                         <div>
//                           <span className="font-medium">Institution:</span> {qual.institution}
//                         </div>
//                         <div>
//                           <span className="font-medium">Year:</span> {qual.year}
//                         </div>
//                         <div>
//                           <span className="font-medium">Grade:</span> {qual.grade}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Assigned Subjects */}
//             {(currentTeacher.assignedSubjects?.length > 0 || currentTeacher.subjects?.length > 0) && (
//               <div className="border-t pt-4">
//                 <h3 className="text-lg font-semibold mb-3">Teaching Subjects</h3>
//                 <div className="flex flex-wrap gap-2">
//                   {(currentTeacher.assignedSubjects || currentTeacher.subjects)?.map((subject) => (
//                     <span key={subject._id || subject} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
//                       {subject.name || subject.code || subject}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Salary Information */}
//             {currentTeacher.salary && (
//               <div className="border-t pt-4">
//                 <h3 className="text-lg font-semibold mb-3">Salary & Bank Information</h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Basic Salary</label>
//                     <p className="font-semibold">Rs. {currentTeacher.salary.basicSalary || '-'}</p>
//                   </div>
//                   {currentTeacher.salary.bankName && (
//                     <>
//                       <div>
//                         <label className="text-sm font-medium text-gray-500">Bank Name</label>
//                         <p>{currentTeacher.salary.bankName}</p>
//                       </div>
//                       <div>
//                         <label className="text-sm font-medium text-gray-500">Account Number</label>
//                         <p>{currentTeacher.salary.accountNumber || '-'}</p>
//                       </div>
//                       <div>
//                         <label className="text-sm font-medium text-gray-500">Account Title</label>
//                         <p>{currentTeacher.salary.accountTitle || '-'}</p>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Address */}
//             {currentTeacher.address && (
//               <div className="border-t pt-4">
//                 <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
//                   <MapPin className="w-5 h-5" />
//                   Address
//                 </h3>
//                 {typeof currentTeacher.address === 'object' ? (
//                   <p>
//                     {currentTeacher.address.street && `${currentTeacher.address.street}, `}
//                     {currentTeacher.address.city && `${currentTeacher.address.city}, `}
//                     {currentTeacher.address.state && `${currentTeacher.address.state}, `}
//                     {currentTeacher.address.country || ''}
//                     {currentTeacher.address.postalCode && ` - ${currentTeacher.address.postalCode}`}
//                   </p>
//                 ) : (
//                   <p>{currentTeacher.address}</p>
//                 )}
//               </div>
//             )}

//             {/* Emergency Contact */}
//             {currentTeacher.emergencyContact && currentTeacher.emergencyContact.name && (
//               <div className="border-t pt-4">
//                 <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Name</label>
//                     <p>{currentTeacher.emergencyContact.name}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Relationship</label>
//                     <p>{currentTeacher.emergencyContact.relationship || '-'}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Phone</label>
//                     <p className="flex items-center gap-2">
//                       <Phone className="w-4 h-4" />
//                       {currentTeacher.emergencyContact.phone || '-'}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Documents */}
//             {currentTeacher.documents && currentTeacher.documents.length > 0 && (
//               <div className="border-t pt-4">
//                 <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
//                   <FileText className="w-5 h-5" />
//                   Documents
//                 </h3>
//                 <div className="space-y-2">
//                   {currentTeacher.documents.map((doc, index) => (
//                     <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
//                       <div className="flex items-center gap-2">
//                         <FileText className="w-4 h-4 text-gray-400" />
//                         <div>
//                           <p className="text-sm font-medium">{doc.name}</p>
//                           <p className="text-xs text-gray-500">{doc.type || 'Document'}</p>
//                         </div>
//                       </div>
//                       <a
//                         href={doc.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 hover:text-blue-800 text-sm"
//                       >
//                         View
//                       </a>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// }






'use client';

import { useState, useEffect } from 'react';
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
import FullPageLoader from '@/components/ui/full-page-loader';
import TeacherForm from '@/components/teacher/teacher-form';
import TeacherViewModal from '@/components/teacher/teacher-view-modal';

export default function TeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
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
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    if (user?.branchId) {
      fetchTeachers();
      fetchDepartments();
      fetchClasses();
      fetchSubjects();
    }
  }, [user?.branchId, searchTerm, selectedStatus, selectedDepartment]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        branchId: user.branchId,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedDepartment && { departmentId: selectedDepartment }),
      });

      const response = await apiClient.get(`${API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.LIST}?${params}`);
      if (response?.success) {
        setTeachers(response.data.teachers || []);
      }
    } catch (error) {
      toast.error('Failed to fetch teachers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BRANCH_ADMIN.DEPARTMENTS.LIST}?limit=200&branchId=${user.branchId}`
      );
      if (response?.success) {
        setDepartments(response.data?.departments || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST}?limit=200&branchId=${user.branchId}`
      );
      if (response?.success) {
        setClasses(response.data?.classes || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.LIST}?limit=200&branchId=${user.branchId}`
      );
      if (response?.success) {
        setSubjects(response.data.subjects || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this teacher?')) return;
    setFullPageLoading(true);

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.DELETE.replace(':id', id));
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
    setSelectedTeacher(teacher);
    setShowViewModal(true);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          Teacher Management
        </h1>
        <p className="text-gray-600 mt-1">Manage teachers for {user?.branchId?.name || 'your branch'}</p>
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
            <Dropdown
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              options={[
                { label: 'All Departments', value: '' },
                ...departments.map(dept => ({ 
                  label: dept.name, 
                  value: dept._id 
                }))
              ]}
              placeholder="All Departments"
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
                  <TableHead>Teacher</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Classes/Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {teacher.fullName || `${teacher.firstName} ${teacher.lastName}`}
                        </div>
                        <div className="text-sm text-gray-500">{teacher.teacherProfile?.employeeId}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          {teacher.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {teacher.phone}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {teacher.teacherProfile?.departmentId?.name || '—'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        <Award className="h-3 w-3" />
                        {teacher.teacherProfile?.designation || 'Teacher'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {teacher.teacherProfile?.classes?.length || 0} Classes
                      </div>
                      <div className="text-xs text-gray-500">
                        {teacher.teacherProfile?.subjects?.length || 0} Subjects
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                        teacher.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(teacher.status || 'inactive').replace('_', ' ')}
                      </span>
                    </TableCell>

                    <TableCell>
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
          userRole="branch_admin"
          currentBranchId={user?.branchId}
          editingTeacher={editingTeacher}
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