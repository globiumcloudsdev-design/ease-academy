// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { useAuth } from '@/hooks/useAuth';
// import apiClient from '@/lib/api-client';
// import { API_ENDPOINTS } from '@/constants/api-endpoints';
// import { toast } from 'sonner';
// import {
//   Users,
//   Plus,
//   Search,
//   Edit,
//   Trash2,
//   Phone,
//   Mail,
//   MapPin,
//   Calendar,
//   GraduationCap,
//   Award,
//   Briefcase,
//   DollarSign,
//   FileText,
//   UserPlus,
//   QrCode,
//   X,
//   BookOpen,
// } from 'lucide-react';
// import { format } from 'date-fns';
// import Modal from '@/components/ui/modal';
// import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
// import { Button } from '@/components/ui/button';
// import Input from '@/components/ui/input';
// import Dropdown from '@/components/ui/dropdown';
// import BranchSelect from '@/components/ui/branch-select';
// import ClassSelect from '@/components/ui/class-select';
// import GenderSelect from '@/components/ui/gender-select';
// import BloodGroupSelect from '@/components/ui/blood-group';
// import SubjectSelect from '@/components/ui/subject-select';
// import DesignationSelect from '@/components/ui/designation-select';
// import DepartmentSelect from '@/components/ui/department-select';
// import DocumentTypeSelect from '@/components/ui/document-type-select';
// import FullPageLoader from '@/components/ui/full-page-loader';
// import ButtonLoader from '@/components/ui/button-loader';
// import { Card, CardContent } from '@/components/ui/card';

// export default function TeachersPage() {
//   const { user } = useAuth();
//   const [teachers, setTeachers] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [classes, setClasses] = useState([]);
//   const [subjects, setSubjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [showQRModal, setShowQRModal] = useState(false);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [selectedQR, setSelectedQR] = useState(null);
//   const [viewingTeacher, setViewingTeacher] = useState(null);
//   const [editingTeacher, setEditingTeacher] = useState(null);
//   const [activeTab, setActiveTab] = useState('personal');
//   const [uploading, setUploading] = useState(false);
//   const [selectedDocType, setSelectedDocType] = useState('');
//   const [filteredSubjects, setFilteredSubjects] = useState([]);
//   const formRef = useRef(null);
//   const [buttonLoading, setButtonLoading] = useState({});
//   const [fullPageLoading, setFullPageLoading] = useState(false);

//   const setButtonLoadingState = (key, val) => setButtonLoading(prev => ({ ...prev, [key]: val }));
//   const isButtonLoading = (key) => !!buttonLoading[key];
  
//   // Filters
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedBranch, setSelectedBranch] = useState('');
//   const [selectedStatus, setSelectedStatus] = useState('');
//   const [selectedDesignation, setSelectedDesignation] = useState('');
//   const [selectedDepartment, setSelectedDepartment] = useState('');

//   // Form state
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     alternatePhone: '',
//     dateOfBirth: '',
//     gender: 'male',
//     bloodGroup: '',
//     nationality: 'Pakistani',
//     cnic: '',
//     religion: '',
//     address: {
//       street: '',
//       city: '',
//       state: '',
//       country: 'Pakistan',
//       postalCode: '',
//     },
//     branchId: '',
//     profilePhoto: {
//       url: '',
//       publicId: '',
//     },
//     teacherProfile: {
//       joiningDate: new Date().toISOString().split('T')[0],
//       designation: 'Teacher',
//       departmentId: '',
//       department: '',
//       qualifications: [],
//       experience: {
//         totalYears: 0,
//         previousInstitutions: [],
//       },
//       subjects: [],
//       classes: [],
//       salaryDetails: {
//         basicSalary: 0,
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
//       emergencyContact: {
//         name: '',
//         relationship: '',
//         phone: '',
//       },
//       documents: [],
//     },
//     status: 'active',
//     remarks: '',
//   });

//   // Qualifications state
//   const [newQualification, setNewQualification] = useState({
//     degree: '',
//     institution: '',
//     yearOfCompletion: '',
//     grade: '',
//     major: '',
//   });

//   // Class assignment state
//   const [newClassAssignment, setNewClassAssignment] = useState({
//     classId: '',
//     subjectId: '',
//   });

//   // Stats
//   const [stats, setStats] = useState({
//     total: 0,
//     active: 0,
//     onLeave: 0,
//     terminated: 0,
//   });

//   useEffect(() => {
//     fetchTeachers();
//     fetchBranches();
//     fetchDepartments();
//     fetchClasses();
//     fetchSubjects();
//   }, [searchTerm, selectedBranch, selectedStatus, selectedDesignation, selectedDepartment]);

//   // Real-time polling
//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (typeof document !== 'undefined' && document.visibilityState === 'visible' && !loading) {
//         fetchTeachers();
//       }
//     }, 10000);
//     return () => clearInterval(interval);
//   }, [searchTerm, selectedBranch, selectedStatus, selectedDesignation, selectedDepartment, loading]);

//   const fetchTeachers = async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams({
//         limit: '100',
//         ...(searchTerm && { search: searchTerm }),
//         ...(selectedBranch && { branchId: selectedBranch }),
//         ...(selectedStatus && { status: selectedStatus }),
//         ...(selectedDesignation && { designation: selectedDesignation }),
//         ...(selectedDepartment && { departmentId: selectedDepartment }),
//       });

//       const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.TEACHERS.LIST}?${params}`);
//       if (response?.success) {
//         const list = response.data || [];
//         setTeachers(list);

//         const total = list.length;
//         const active = list.filter(t => t.status === 'active').length;
//         const onLeave = list.filter(t => t.status === 'on_leave').length;
//         const terminated = list.filter(t => t.status === 'terminated').length;

//         setStats({ total, active, onLeave, terminated });
//       }
//     } catch (error) {
//       toast.error('Failed to fetch teachers');
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchBranches = async () => {
//     try {
//       const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST}?limit=200`);
//       if (response?.success) {
//         setBranches(response.data?.branches || response.data || []);
//       }
//     } catch (error) {
//       console.error('Failed to fetch branches:', error);
//     }
//   };

//   const fetchDepartments = async () => {
//     try {
//       const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.LIST}?limit=200`);
//       if (response?.success) {
//         setDepartments(response.data?.departments || response.data || []);
//       }
//     } catch (error) {
//       console.error('Failed to fetch departments:', error);
//     }
//   };

//   const fetchClasses = async () => {
//     try {
//       const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST}?limit=200`);
//       if (response?.success) {
//         setClasses(response.data?.classes || response.data || []);
//       }
//     } catch (error) {
//       console.error('Failed to fetch classes:', error);
//     }
//   };

//   const fetchSubjects = async () => {
//     try {
//       const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.SUBJECTS.LIST}?limit=200`);
//       if (response?.success) {
//         setSubjects(response.data || []);
//       }
//     } catch (error) {
//       console.error('Failed to fetch subjects:', error);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setButtonLoadingState('submitTeacher', true);
//     setFullPageLoading(true);

//     try {
//       if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.branchId) {
//         toast.error('Please fill all required fields');
//         return;
//       }

//       const payload = {
//         ...formData,
//         teacherProfile: {
//           ...formData.teacherProfile,
//           departmentId: formData.teacherProfile.departmentId || undefined,
//         },
//       };

//       let response;
//       if (editingTeacher) {
//         response = await apiClient.put(`${API_ENDPOINTS.SUPER_ADMIN.TEACHERS.UPDATE.replace(':id', editingTeacher._id)}`, payload);
//       } else {
//         response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.TEACHERS.CREATE, payload);
//       }

//       if (response?.success) {
//         toast.success(editingTeacher ? 'Teacher updated successfully' : 'Teacher created successfully with QR code');
//         fetchTeachers();
//         handleCloseModal();
//       } else {
//         toast.error(response?.message || 'Operation failed');
//       }
//     } catch (error) {
//       toast.error(error.message || 'Failed to save teacher');
//       console.error(error);
//     } finally {
//       setButtonLoadingState('submitTeacher', false);
//       setFullPageLoading(false);
//     }
//   };

//   const handleEdit = (teacher) => {
//     setEditingTeacher(teacher);
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
//       cnic: teacher.cnic || '',
//       religion: teacher.religion || '',
//       address: teacher.address || {
//         street: '',
//         city: '',
//         state: '',
//         country: 'Pakistan',
//         postalCode: '',
//       },
//       branchId: teacher.branchId?._id || '',
//       profilePhoto: teacher.profilePhoto || { url: '', publicId: '' },
//       teacherProfile: {
//         joiningDate: teacher.teacherProfile?.joiningDate ? teacher.teacherProfile.joiningDate.split('T')[0] : '',
//         designation: teacher.teacherProfile?.designation || 'Teacher',
//         departmentId: teacher.teacherProfile?.departmentId?._id || '',
//         department: teacher.teacherProfile?.department || '',
//         qualifications: teacher.teacherProfile?.qualifications || [],
//         experience: teacher.teacherProfile?.experience || { totalYears: 0, previousInstitutions: [] },
//         subjects: teacher.teacherProfile?.subjects?.map(s => s._id || s) || [],
//         classes: teacher.teacherProfile?.classes || [],
//         salaryDetails: teacher.teacherProfile?.salaryDetails || {
//           basicSalary: 0,
//           allowances: { houseRent: 0, medical: 0, transport: 0, other: 0 },
//           deductions: { tax: 0, providentFund: 0, insurance: 0, other: 0 },
//         },
//         emergencyContact: teacher.teacherProfile?.emergencyContact || { name: '', relationship: '', phone: '' },
//         documents: teacher.teacherProfile?.documents || [],
//       },
//       status: teacher.status || 'active',
//       remarks: teacher.remarks || '',
//     });
//     setShowModal(true);
//   };

//   const handleDelete = async (id) => {
//     if (!confirm('Are you sure you want to deactivate this teacher?')) return;
//     setButtonLoadingState('deleteTeacher', true);
//     setFullPageLoading(true);

//     try {
//       const response = await apiClient.delete(API_ENDPOINTS.SUPER_ADMIN.TEACHERS.DELETE.replace(':id', id));

//       if (response.success) {
//         toast.success('Teacher deactivated successfully');
//         fetchTeachers();
//       }
//     } catch (error) {
//       toast.error(error.message || 'Failed to delete teacher');
//       console.error(error);
//     } finally {
//       setButtonLoadingState('deleteTeacher', false);
//       setFullPageLoading(false);
//     }
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//     setEditingTeacher(null);
//     setActiveTab('personal');
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
//       cnic: '',
//       religion: '',
//       address: { street: '', city: '', state: '', country: 'Pakistan', postalCode: '' },
//       branchId: '',
//       teacherProfile: {
//         joiningDate: new Date().toISOString().split('T')[0],
//         designation: 'Teacher',
//         departmentId: '',
//         department: '',
//         qualifications: [],
//         experience: { totalYears: 0, previousInstitutions: [] },
//         subjects: [],
//         classes: [],
//         salaryDetails: {
//           basicSalary: 0,
//           allowances: { houseRent: 0, medical: 0, transport: 0, other: 0 },
//           deductions: { tax: 0, providentFund: 0, insurance: 0, other: 0 },
//         },
//         emergencyContact: { name: '', relationship: '', phone: '' },
//       },
//       status: 'active',
//       remarks: '',
//     });
//   };

//   const addQualification = () => {
//     if (!newQualification.degree || !newQualification.institution) {
//       toast.error('Please fill degree and institution');
//       return;
//     }
//     setFormData({
//       ...formData,
//       teacherProfile: {
//         ...formData.teacherProfile,
//         qualifications: [...formData.teacherProfile.qualifications, newQualification],
//       },
//     });
//     setNewQualification({ degree: '', institution: '', yearOfCompletion: '', grade: '', major: '' });
//   };

//   const removeQualification = (index) => {
//     setFormData({
//       ...formData,
//       teacherProfile: {
//         ...formData.teacherProfile,
//         qualifications: formData.teacherProfile.qualifications.filter((_, i) => i !== index),
//       },
//     });
//   };

//   const addClassAssignment = () => {
//     if (!newClassAssignment.classId || !newClassAssignment.subjectId) {
//       toast.error('Please select both class and subject');
//       return;
//     }
//     setFormData({
//       ...formData,
//       teacherProfile: {
//         ...formData.teacherProfile,
//         classes: [...formData.teacherProfile.classes, newClassAssignment],
//       },
//     });
//     setNewClassAssignment({ classId: '', subjectId: '' });
//     setFilteredSubjects([]); // Reset filtered subjects
//   };

//   // Filter subjects based on selected class
//   const handleClassSelection = (classId) => {
//     setNewClassAssignment({ ...newClassAssignment, classId, subjectId: '' });
    
//     if (classId) {
//       const selectedClass = classes.find(c => c._id === classId);
//       if (selectedClass?.subjects && selectedClass.subjects.length > 0) {
//         // Filter subjects that belong to this class
//         const classSubjectIds = selectedClass.subjects.map(s => typeof s === 'object' ? s._id : s);
//         const filtered = subjects.filter(subject => classSubjectIds.includes(subject._id));
//         setFilteredSubjects(filtered);
//       } else {
//         // If class has no specific subjects, show all
//         setFilteredSubjects(subjects);
//       }
//     } else {
//       setFilteredSubjects([]);
//     }
//   };

//   const removeClassAssignment = (index) => {
//     setFormData({
//       ...formData,
//       teacherProfile: {
//         ...formData.teacherProfile,
//         classes: formData.teacherProfile.classes.filter((_, i) => i !== index),
//       },
//     });
//   };

//   // File upload handlers
//   const handleProfilePhotoUpload = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith('image/')) {
//       toast.error('Please select an image file');
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       toast.error('Image size should be less than 5MB');
//       return;
//     }

//     setUploading(true);
//     const formDataUpload = new FormData();
//     formDataUpload.append('file', file);
//     formDataUpload.append('fileType', 'profile');
//     formDataUpload.append('folder', 'teachers/profiles');

//     // If editing, pass the teacher's userId
//     if (editingTeacher) {
//       formDataUpload.append('userId', editingTeacher._id);
//     }

//     try {
//       const data = await apiClient.post(API_ENDPOINTS.COMMON.UPLOAD, formDataUpload, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       if (data.success) {
//         const photoData = {
//           url: data.url,
//           publicId: data.publicId,
//           uploadedAt: new Date(),
//         };

//         // Update local form state
//         setFormData({
//           ...formData,
//           profilePhoto: photoData,
//         });

//         // If editing existing teacher, save to database immediately
//         if (editingTeacher) {
//           try {
//             const updateResponse = await apiClient.put(
//               API_ENDPOINTS.SUPER_ADMIN.TEACHERS.UPDATE.replace(':id', editingTeacher._id),
//               { profilePhoto: photoData }
//             );
            
//             if (updateResponse.success) {
//               setEditingTeacher({
//                 ...editingTeacher,
//                 profilePhoto: photoData,
//               });
//               toast.success('Profile photo updated and saved successfully');
//               fetchTeachers(); // Refresh list
//             } else {
//               toast.error('Failed to save profile photo');
//             }
//           } catch (updateError) {
//             console.error('Failed to save profile photo:', updateError);
//             toast.error('Photo uploaded but failed to save. Please try again.');
//           }
//         } else {
//           toast.success('Profile photo ready. Click "Add Teacher" to save.');
//         }
//       } else {
//         toast.error(data.message || 'Upload failed');
//       }
//     } catch (error) {
//       toast.error(error.message || 'Failed to upload image');
//       console.error(error);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDocumentUpload = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!selectedDocType) {
//       toast.error('Please select document type first');
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       toast.error('Document size should be less than 10MB');
//       return;
//     }

//     setUploading(true);
//     const formDataUpload = new FormData();
//     formDataUpload.append('file', file);
//     formDataUpload.append('fileType', 'teacher_document');
//     formDataUpload.append('documentType', selectedDocType);
//     formDataUpload.append('folder', 'teachers/documents');

//     // If editing, pass the teacher's userId
//     if (editingTeacher) {
//       formDataUpload.append('userId', editingTeacher._id);
//     }

//     try {
//       const data = await apiClient.post(API_ENDPOINTS.COMMON.UPLOAD, formDataUpload, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       if (data.success) {
//         const newDocument = {
//           type: selectedDocType,
//           name: file.name,
//           url: data.url,
//           publicId: data.publicId,
//           uploadedAt: new Date(),
//         };

//         const updatedDocuments = [...(formData.teacherProfile.documents || []), newDocument];

//         // Update local form state
//         setFormData({
//           ...formData,
//           teacherProfile: {
//             ...formData.teacherProfile,
//             documents: updatedDocuments,
//           },
//         });

//         // Reset document type selection
//         setSelectedDocType('');

//         // If editing existing teacher, also update editingTeacher state
//         if (editingTeacher) {
//           setEditingTeacher({
//             ...editingTeacher,
//             teacherProfile: {
//               ...editingTeacher.teacherProfile,
//               documents: updatedDocuments,
//             },
//           });
//           toast.success('Document uploaded successfully');
//           fetchTeachers(); // Refresh list
//         } else {
//           toast.success('Document ready. Click "Add Teacher" to save.');
//         }
//       } else {
//         toast.error(data.message || 'Upload failed');
//       }
//     } catch (error) {
//       toast.error(error.message || 'Failed to upload document');
//       console.error(error);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const removeDocument = (index) => {
//     setFormData({
//       ...formData,
//       teacherProfile: {
//         ...formData.teacherProfile,
//         documents: formData.teacherProfile.documents.filter((_, i) => i !== index),
//       },
//     });
//   };

//   const handleViewQR = (teacher) => {
//     setSelectedQR(teacher);
//     setShowQRModal(true);
//   };

//   const handleViewTeacher = (teacher) => {
//     setViewingTeacher(teacher);
//     setShowViewModal(true);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//     {fullPageLoading && <FullPageLoader message={editingTeacher ? 'Saving changes...' : 'Processing...'} />}
//       {/* Header */}
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//           <Users className="h-8 w-8 text-blue-600" />
//           Teacher Management
//         </h1>
//         <p className="text-gray-600 mt-1">Manage teachers, assignments, and QR codes</p>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         <Card>
//           <CardContent>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Total Teachers</p>
//                 <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
//               </div>
//               <div className="p-3 bg-blue-50 rounded-lg">
//                 <Users className="h-6 w-6 text-blue-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Active</p>
//                 <p className="text-2xl font-bold text-green-600">{stats.active}</p>
//               </div>
//               <div className="p-3 bg-green-50 rounded-lg">
//                 <GraduationCap className="h-6 w-6 text-green-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">On Leave</p>
//                 <p className="text-2xl font-bold text-yellow-600">{stats.onLeave}</p>
//               </div>
//               <div className="p-3 bg-yellow-50 rounded-lg">
//                 <Calendar className="h-6 w-6 text-yellow-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Terminated</p>
//                 <p className="text-2xl font-bold text-red-600">{stats.terminated}</p>
//               </div>
//               <div className="p-3 bg-red-50 rounded-lg">
//                 <Trash2 className="h-6 w-6 text-red-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters and Actions */}
//       <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
//         <div className="flex flex-col lg:flex-row gap-4">
//           <div className="flex-1">
//             <Input
//               placeholder="Search by name, email, phone, employee ID..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               icon={Search}
//             />
//           </div>

//           <div className="w-full lg:w-48">
//             <BranchSelect
//               id="branch-filter"
//               name="branch"
//               value={selectedBranch}
//               onChange={(e) => setSelectedBranch(e.target.value)}
//               branches={branches}
//               placeholder="All Branches"
//             />
//           </div>

//           <div className="w-full lg:w-48">
//             <DesignationSelect
//               id="designation-filter"
//               name="designation"
//               value={selectedDesignation}
//               onChange={(e) => setSelectedDesignation(e.target.value)}
//               options={[
//                 // { label: 'All Designations', value: '' },
//                 { label: 'Principal', value: 'Principal' },
//                 { label: 'Vice Principal', value: 'Vice Principal' },
//                 { label: 'Head Teacher', value: 'Head Teacher' },
//                 { label: 'Senior Teacher', value: 'Senior Teacher' },
//                 { label: 'Teacher', value: 'Teacher' },
//               ]}
//               placeholder="All Designations"
//             />
//           </div>

//           <div className="w-full lg:w-48">
//             <Dropdown
//               id="status-filter"
//               name="status"
//               value={selectedStatus}
//               onChange={(e) => setSelectedStatus(e.target.value)}
//               options={[
//                 { label: 'All Status', value: '' },
//                 { label: 'Active', value: 'active' },
//                 { label: 'On Leave', value: 'on_leave' },
//                 { label: 'Terminated', value: 'terminated' },
//               ]}
//               placeholder="All Status"
//             />
//           </div>

//           <Button onClick={() => setShowModal(true)} variant="default" className="whitespace-nowrap">
//             <Plus className="h-5 w-5" />
//             Add Teacher
//           </Button>
//         </div>
        
//       </div>

//       {/* Teachers Table */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//         {loading ? (
//           <div className="p-8 text-center text-gray-500">Loading teachers...</div>
//         ) : teachers.length === 0 ? (
//           <div className="p-12 text-center">
//             <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//             <p className="text-gray-500 text-lg">No teachers found</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader className="bg-gray-50">
//                 <TableRow>
//                   <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Teacher</TableHead>
//                   <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</TableHead>
//                   <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Branch</TableHead>
//                   <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Designation</TableHead>
//                   <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Classes</TableHead>
//                   {/* <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">QR Code</TableHead> */}
//                   <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</TableHead>
//                   <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>

//               <TableBody>
//                 {teachers.map((teacher) => (
//                   <TableRow key={teacher._id} className="hover:bg-gray-50">
//                     <TableCell className="px-6 py-4">
//                       <div>
//                         <div className="text-sm font-medium text-gray-900">
//                           {teacher.fullName || `${teacher.firstName} ${teacher.lastName}`}
//                         </div>
//                         <div className="text-sm text-gray-500">{teacher.teacherProfile?.employeeId}</div>
//                       </div>
//                     </TableCell>

//                     <TableCell className="px-6 py-4">
//                       <div className="space-y-1">
//                         <div className="flex items-center gap-2 text-sm text-gray-600">
//                           <Mail className="h-4 w-4" />
//                           {teacher.email}
//                         </div>
//                         <div className="flex items-center gap-2 text-sm text-gray-600">
//                           <Phone className="h-4 w-4" />
//                           {teacher.phone}
//                         </div>
//                       </div>
//                     </TableCell>

//                     <TableCell className="px-6 py-4">
//                       <div className="text-sm text-gray-900">{teacher.branchId?.name || '—'}</div>
//                       <div className="text-xs text-gray-500">{teacher.branchId?.city || '—'}</div>
//                     </TableCell>

//                     <TableCell className="px-6 py-4">
//                       <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
//                         <Award className="h-3 w-3" />
//                         {teacher.teacherProfile?.designation || 'Teacher'}
//                       </span>
//                     </TableCell>

//                     <TableCell className="px-6 py-4">
//                       <div className="text-sm text-gray-900">
//                         {teacher.teacherProfile?.classes?.length || 0} Classes
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         {teacher.teacherProfile?.subjects?.length || 0} Subjects
//                       </div>
//                     </TableCell>

//                     {/* <TableCell className="px-6 py-4">
//                       {teacher.teacherProfile?.qr?.url ? (
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleViewQR(teacher)}
//                           className="inline-flex items-center gap-1"
//                         >
//                           <QrCode className="h-4 w-4" />
//                           View QR
//                         </Button>
//                       ) : (
//                         <span className="text-xs text-gray-400">No QR</span>
//                       )}
//                     </TableCell> */}

//                     <TableCell className="px-6 py-4">
//                       <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                         teacher.status === 'active' ? 'bg-green-100 text-green-800' :
//                         teacher.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
//                         'bg-red-100 text-red-800'
//                       }`}>
//                         {(teacher.status || 'inactive').replace('_', ' ').charAt(0).toUpperCase() + (teacher.status || 'inactive').slice(1).replace('_', ' ')}
//                       </span>
//                     </TableCell>

//                     <TableCell className="px-6 py-4">
//                       <div className="flex items-center gap-2">
//                         <Button 
//                           onClick={() => handleViewTeacher(teacher)} 
//                           variant="ghost" 
//                           size="icon-sm"
//                           title="View Details"
//                         >
//                           <FileText className="h-4 w-4 text-blue-600" />
//                         </Button>
//                         <Button onClick={() => handleEdit(teacher)} variant="ghost" size="icon-sm" title="Edit">
//                           <Edit className="h-4 w-4" />
//                         </Button>
//                         <Button onClick={() => handleDelete(teacher._id)} variant="ghost" size="icon-sm" title="Delete">
//                           <Trash2 className="h-4 w-4 text-red-600" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         )}
//       </div>

//       {/* Modal */}
//       <Modal
//         open={showModal}
//         onClose={handleCloseModal}
//         title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
//         size="xl"
//         footer={(
//           <div className="flex justify-end gap-3">
//             <Button type="button" onClick={handleCloseModal} variant="outline" disabled={isButtonLoading('submitTeacher') || fullPageLoading}>
//               Cancel
//             </Button>
//             <Button
//               type="button"
//               onClick={() => formRef.current && (formRef.current.requestSubmit ? formRef.current.requestSubmit() : formRef.current.submit())}
//               variant="default"
//               disabled={isButtonLoading('submitTeacher')}
//             >
//               {isButtonLoading('submitTeacher') ? <ButtonLoader size={4} /> : (editingTeacher ? 'Update Teacher' : 'Add Teacher')}
//             </Button>
//           </div>
//         )}
//       >
//         {/* Tabs */}
//         <div className="border-b border-gray-200 mb-6">
//           <nav className="-mb-px flex space-x-8">
//             {[
//               { id: 'personal', label: 'Personal Info', icon: UserPlus },
//               { id: 'academic', label: 'Academic Details', icon: GraduationCap },
//               { id: 'salary', label: 'Salary & Leave', icon: DollarSign },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
//                   activeTab === tab.id
//                     ? 'border-blue-500 text-blue-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 <tab.icon className="h-5 w-5" />
//                 {tab.label}
//               </button>
//             ))}
//           </nav>
//         </div>

//         <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
//           {/* Personal Info Tab */}
//           {activeTab === 'personal' && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
//                   <input
//                     type="text"
//                     required
//                     value={formData.firstName}
//                     onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
//                   <input
//                     type="text"
//                     required
//                     value={formData.lastName}
//                     onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
//                   <input
//                     type="email"
//                     required
//                     value={formData.email}
//                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
//                   <input
//                     type="tel"
//                     required
//                     value={formData.phone}
//                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
//                   <input
//                     type="tel"
//                     value={formData.alternatePhone}
//                     onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
//                   <input
//                     type="date"
//                     required
//                     value={formData.dateOfBirth}
//                     onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
//                   <GenderSelect
//                     id="gender"
//                     name="gender"
//                     value={formData.gender}
//                     onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
//                     placeholder="Select Gender"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
//                   <BloodGroupSelect
//                     id="bloodGroup"
//                     name="bloodGroup"
//                     value={formData.bloodGroup}
//                     onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
//                     placeholder="Select Blood Group"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
//                   <input
//                     type="text"
//                     value={formData.cnic}
//                     onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
//                     placeholder="42101-1234567-1"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
//                   <input
//                     type="text"
//                     value={formData.religion}
//                     onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
//                   <input
//                     type="text"
//                     value={formData.nationality}
//                     onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
//                   <BranchSelect
//                     id="branchId"
//                     name="branchId"
//                     value={formData.branchId}
//                     onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
//                     branches={branches}
//                     placeholder="Select Branch"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//                   <Dropdown
//                     id="status"
//                     name="status"
//                     value={formData.status}
//                     onChange={(e) => setFormData({ ...formData, status: e.target.value })}
//                     options={[
//                       { label: 'Active', value: 'active' },
//                       { label: 'On Leave', value: 'on_leave' },
//                       { label: 'Terminated', value: 'terminated' },
//                     ]}
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
//                   <input
//                     type="text"
//                     value={formData.address.city}
//                     onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
//                   <input
//                     type="text"
//                     value={formData.address.street}
//                     onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
//                   <input
//                     type="text"
//                     value={formData.address.state}
//                     onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
//                   <input
//                     type="text"
//                     value={formData.address.postalCode}
//                     onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>

//               {/* Profile Photo Upload */}
//               <div className="border-t pt-4 mt-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>
//                 <div className="flex items-center gap-4">
//                   {formData.profilePhoto?.url && (
//                     <div className="relative">
//                       <img
//                         src={formData.profilePhoto.url}
//                         alt="Profile"
//                         className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setFormData({ ...formData, profilePhoto: { url: '', publicId: '' } })}
//                         className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
//                       >
//                         <X className="h-3 w-3" />
//                       </button>
//                     </div>
//                   )}
//                   <div>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleProfilePhotoUpload}
//                       className="hidden"
//                       id="profilePhoto"
//                       disabled={uploading}
//                     />
//                     <label
//                       htmlFor="profilePhoto"
//                       className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
//                     >
//                       <UserPlus className="h-4 w-4" />
//                       {uploading ? 'Uploading...' : (formData.profilePhoto?.url ? 'Change Photo' : 'Upload Photo')}
//                     </label>
//                     <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG, GIF)</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Academic Details Tab */}
//           {activeTab === 'academic' && (
//             <div className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
//                   <input
//                     type="date"
//                     value={formData.teacherProfile.joiningDate}
//                     onChange={(e) => setFormData({
//                       ...formData,
//                       teacherProfile: { ...formData.teacherProfile, joiningDate: e.target.value }
//                     })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
//                   <DesignationSelect
//                     id="designation"
//                     name="designation"
//                     value={formData.teacherProfile.designation}
//                     onChange={(e) => setFormData({
//                       ...formData,
//                       teacherProfile: { ...formData.teacherProfile, designation: e.target.value }
//                     })}
//                     options={[
//                       { label: 'Principal', value: 'Principal' },
//                       { label: 'Vice Principal', value: 'Vice Principal' },
//                       { label: 'Head Teacher', value: 'Head Teacher' },
//                       { label: 'Senior Teacher', value: 'Senior Teacher' },
//                       { label: 'Teacher', value: 'Teacher' },
//                       { label: 'Junior Teacher', value: 'Junior Teacher' },
//                       { label: 'Subject Specialist', value: 'Subject Specialist' },
//                     ]}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
//                   <DepartmentSelect
//                     id="departmentId"
//                     name="departmentId"
//                     value={formData.teacherProfile.departmentId}
//                     onChange={(e) => setFormData({
//                       ...formData,
//                       teacherProfile: { ...formData.teacherProfile, departmentId: e.target.value }
//                     })}
//                     departments={departments}
//                     placeholder="No Department"
//                   />
//                 </div>
//               </div>

//               {/* Subjects */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Subjects (Select all subjects teacher can teach)</label>
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
//                   {subjects.map((subject) => (
//                     <label key={subject._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
//                       <input
//                         type="checkbox"
//                         checked={formData.teacherProfile.subjects.includes(subject._id)}
//                         onChange={(e) => {
//                           const subjectId = subject._id;
//                           if (e.target.checked) {
//                             setFormData({
//                               ...formData,
//                               teacherProfile: {
//                                 ...formData.teacherProfile,
//                                 subjects: [...formData.teacherProfile.subjects, subjectId]
//                               }
//                             });
//                           } else {
//                             setFormData({
//                               ...formData,
//                               teacherProfile: {
//                                 ...formData.teacherProfile,
//                                 subjects: formData.teacherProfile.subjects.filter(s => s !== subjectId)
//                               }
//                             });
//                           }
//                         }}
//                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span className="text-sm text-gray-700">{subject.name}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               {/* Class Assignments */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Class Assignments</label>
//                 <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                     <ClassSelect
//                       id="newClassId"
//                       name="newClassId"
//                       value={newClassAssignment.classId}
//                       onChange={(e) => handleClassSelection(e.target.value)}
//                       classes={classes}
//                       placeholder="Select Class"
//                     />

//                     <SubjectSelect
//                       id="newSubjectId"
//                       name="newSubjectId"
//                       value={newClassAssignment.subjectId}
//                       onChange={(e) => setNewClassAssignment({ ...newClassAssignment, subjectId: e.target.value })}
//                       subjects={(filteredSubjects.length > 0
//                         ? filteredSubjects
//                         : subjects.filter(s => formData.teacherProfile.subjects.includes(s._id)))}
//                       disabled={!newClassAssignment.classId}
//                     />

//                     <Button type="button" onClick={addClassAssignment} variant="secondary" size="default">
//                       <Plus className="h-4 w-4" />
//                       Add Assignment
//                     </Button>
//                   </div>

//                   {formData.teacherProfile.classes.length > 0 && (
//                     <div className="mt-3 space-y-2">
//                       {formData.teacherProfile.classes.map((assignment, index) => {
//                         const cls = classes.find(c => c._id === assignment.classId);
//                         const subj = subjects.find(s => s._id === assignment.subjectId);
//                         return (
//                           <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
//                             <div className="flex items-center gap-2">
//                               <BookOpen className="h-4 w-4 text-blue-600" />
//                               <span className="text-sm font-medium">{cls?.name || 'Unknown Class'} - {subj?.name || 'Unknown Subject'}</span>
//                             </div>
//                             <Button type="button" onClick={() => removeClassAssignment(index)} variant="ghost" size="icon-sm">
//                               <X className="h-4 w-4 text-red-600" />
//                             </Button>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Qualifications */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
//                 <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
//                   <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
//                     <input
//                       type="text"
//                       placeholder="Degree"
//                       value={newQualification.degree}
//                       onChange={(e) => setNewQualification({ ...newQualification, degree: e.target.value })}
//                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Institution"
//                       value={newQualification.institution}
//                       onChange={(e) => setNewQualification({ ...newQualification, institution: e.target.value })}
//                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Year"
//                       value={newQualification.yearOfCompletion}
//                       onChange={(e) => setNewQualification({ ...newQualification, yearOfCompletion: e.target.value })}
//                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Grade/CGPA"
//                       value={newQualification.grade}
//                       onChange={(e) => setNewQualification({ ...newQualification, grade: e.target.value })}
//                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                     <Button type="button" onClick={addQualification} variant="secondary">
//                       <Plus className="h-4 w-4" />
//                       Add
//                     </Button>
//                   </div>

//                   {formData.teacherProfile.qualifications.length > 0 && (
//                     <div className="mt-3 space-y-2">
//                       {formData.teacherProfile.qualifications.map((qual, index) => (
//                         <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
//                           <div>
//                             <div className="text-sm font-medium">{qual.degree} - {qual.institution}</div>
//                             <div className="text-xs text-gray-500">{qual.yearOfCompletion} | Grade: {qual.grade}</div>
//                           </div>
//                           <Button type="button" onClick={() => removeQualification(index)} variant="ghost" size="icon-sm">
//                             <X className="h-4 w-4 text-red-600" />
//                           </Button>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Salary & Leave Tab */}
//           {activeTab === 'salary' && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
//                   <input
//                     type="number"
//                     value={formData.teacherProfile.salaryDetails.basicSalary}
//                     onChange={(e) => setFormData({
//                       ...formData,
//                       teacherProfile: {
//                         ...formData.teacherProfile,
//                         salaryDetails: {
//                           ...formData.teacherProfile.salaryDetails,
//                           basicSalary: Number(e.target.value)
//                         }
//                       }
//                     })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">House Rent Allowance</label>
//                   <input
//                     type="number"
//                     value={formData.teacherProfile.salaryDetails.allowances.houseRent}
//                     onChange={(e) => setFormData({
//                       ...formData,
//                       teacherProfile: {
//                         ...formData.teacherProfile,
//                         salaryDetails: {
//                           ...formData.teacherProfile.salaryDetails,
//                           allowances: {
//                             ...formData.teacherProfile.salaryDetails.allowances,
//                             houseRent: Number(e.target.value)
//                           }
//                         }
//                       }
//                     })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
//                   <input
//                     type="number"
//                     value={formData.teacherProfile.salaryDetails.allowances.medical}
//                     onChange={(e) => setFormData({
//                       ...formData,
//                       teacherProfile: {
//                         ...formData.teacherProfile,
//                         salaryDetails: {
//                           ...formData.teacherProfile.salaryDetails,
//                           allowances: {
//                             ...formData.teacherProfile.salaryDetails.allowances,
//                             medical: Number(e.target.value)
//                           }
//                         }
//                       }
//                     })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance</label>
//                   <input
//                     type="number"
//                     value={formData.teacherProfile.salaryDetails.allowances.transport}
//                     onChange={(e) => setFormData({
//                       ...formData,
//                       teacherProfile: {
//                         ...formData.teacherProfile,
//                         salaryDetails: {
//                           ...formData.teacherProfile.salaryDetails,
//                           allowances: {
//                             ...formData.teacherProfile.salaryDetails.allowances,
//                             transport: Number(e.target.value)
//                           }
//                         }
//                       }
//                     })}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs text-gray-600 mb-1">Name</label>
//                     <input
//                       type="text"
//                       value={formData.teacherProfile.emergencyContact.name}
//                       onChange={(e) => setFormData({
//                         ...formData,
//                         teacherProfile: {
//                           ...formData.teacherProfile,
//                           emergencyContact: {
//                             ...formData.teacherProfile.emergencyContact,
//                             name: e.target.value
//                           }
//                         }
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs text-gray-600 mb-1">Relationship</label>
//                     <input
//                       type="text"
//                       value={formData.teacherProfile.emergencyContact.relationship}
//                       onChange={(e) => setFormData({
//                         ...formData,
//                         teacherProfile: {
//                           ...formData.teacherProfile,
//                           emergencyContact: {
//                             ...formData.teacherProfile.emergencyContact,
//                             relationship: e.target.value
//                           }
//                         }
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs text-gray-600 mb-1">Phone</label>
//                     <input
//                       type="tel"
//                       value={formData.teacherProfile.emergencyContact.phone}
//                       onChange={(e) => setFormData({
//                         ...formData,
//                         teacherProfile: {
//                           ...formData.teacherProfile,
//                           emergencyContact: {
//                             ...formData.teacherProfile.emergencyContact,
//                             phone: e.target.value
//                           }
//                         }
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Documents Upload Section */}
//               <div className="border-t pt-4 mt-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-3">Documents</label>
//                 <div className="space-y-3">
//                   {formData.teacherProfile.documents && formData.teacherProfile.documents.length > 0 && (
//                     <div className="space-y-2">
//                       {formData.teacherProfile.documents.map((doc, index) => (
//                         <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
//                           <div className="flex items-center gap-3">
//                             <FileText className="h-5 w-5 text-gray-400" />
//                             <div>
//                               <p className="text-sm font-medium text-gray-900">{doc.type}</p>
//                               <p className="text-xs text-gray-500">
//                                 {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Uploaded'}
//                               </p>
//                             </div>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             <a
//                               href={doc.url}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-blue-600 hover:text-blue-800 text-sm"
//                             >
//                               View
//                             </a>
//                             <button
//                               type="button"
//                               onClick={() => removeDocument(index)}
//                               className="text-red-600 hover:text-red-800"
//                             >
//                               <X className="h-4 w-4" />
//                             </button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                   <div className="space-y-3">
//                     {/* Document Type Dropdown */}
//                     <div>
//                       <label className="block text-xs font-medium text-gray-600 mb-1">Document Type</label>
//                       <DocumentTypeSelect
//                         id="documentType"
//                         name="documentType"
//                         value={selectedDocType}
//                         onChange={(e) => setSelectedDocType(e.target.value)}
//                         options={[
//                           { label: 'Select Type', value: '' },
//                           { label: 'CNIC', value: 'cnic' },
//                           { label: 'CV / Resume', value: 'cv' },
//                           { label: 'Degree Certificate', value: 'degree' },
//                           { label: 'Experience Letter', value: 'experience_letter' },
//                           { label: 'Teaching Certificate', value: 'certificate' },
//                           { label: 'Photo', value: 'photo' },
//                           { label: 'Other', value: 'other' },
//                         ]}
//                       />
//                     </div>
                    
//                     {/* Upload Button */}
//                     <input
//                       type="file"
//                       accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
//                       onChange={handleDocumentUpload}
//                       className="hidden"
//                       id="documentUpload"
//                       disabled={uploading || !selectedDocType}
//                     />
//                     <label
//                       htmlFor="documentUpload"
//                       className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
//                         !selectedDocType || uploading
//                           ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
//                           : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
//                       }`}
//                     >
//                       <FileText className="h-4 w-4" />
//                       {uploading ? 'Uploading...' : 'Upload Document'}
//                     </label>
//                     <p className="text-xs text-gray-500 mt-1">
//                       {!selectedDocType ? 'Please select document type first' : 'Max 10MB (PDF, DOC, DOCX, Images)'}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </form>
//       </Modal>

//       {/* QR Code View Modal */}
//       {showQRModal && selectedQR && (
//         <Modal
//           open={showQRModal}
//           onClose={() => { setShowQRModal(false); setSelectedQR(null); }}
//           title="Teacher QR Code"
//           size="md"
//         >
//           <div className="p-6 space-y-6">
//             {/* Teacher Info */}
//             <div className="text-center border-b pb-4">
//               {selectedQR.profilePhoto?.url && (
//                 <img
//                   src={selectedQR.profilePhoto.url}
//                   alt={selectedQR.fullName || `${selectedQR.firstName} ${selectedQR.lastName}`}
//                   className="h-20 w-20 rounded-full object-cover mx-auto mb-3 border-2 border-blue-200"
//                 />
//               )}
//               <h3 className="text-xl font-bold text-gray-900">
//                 {selectedQR.fullName || `${selectedQR.firstName} ${selectedQR.lastName}`}
//               </h3>
//               <p className="text-sm text-gray-600">{selectedQR.teacherProfile?.designation || 'Teacher'}</p>
//               <p className="text-xs text-gray-500 mt-1">
//                 Employee ID: {selectedQR.teacherProfile?.employeeId || 'N/A'}
//               </p>
//             </div>

//             {/* QR Code Display */}
//             {selectedQR.teacherProfile?.qr?.url ? (
//               <div className="space-y-4">
//                 <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-gray-200">
//                   <img
//                     src={selectedQR.teacherProfile.qr.url}
//                     alt="Teacher QR Code"
//                     className="w-64 h-64 object-contain"
//                   />
//                 </div>
                
//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                   <div className="flex items-start gap-3">
//                     <QrCode className="h-5 w-5 text-blue-600 mt-0.5" />
//                     <div>
//                       <p className="text-sm font-medium text-blue-900">Scan this QR code for:</p>
//                       <ul className="text-xs text-blue-700 mt-1 space-y-1 ml-4 list-disc">
//                         <li>Quick attendance marking</li>
//                         <li>Teacher identification</li>
//                         <li>Access teacher profile</li>
//                       </ul>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Download Button */}
//                 <div className="flex gap-2">
//                   <a
//                     href={selectedQR.teacherProfile.qr.url}
//                     download={`${selectedQR.firstName}_${selectedQR.lastName}_QR.png`}
//                     className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                   >
//                     <FileText className="h-4 w-4" />
//                     Download QR Code
//                   </a>
//                   <a
//                     href={selectedQR.teacherProfile.qr.url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
//                   >
//                     <QrCode className="h-4 w-4" />
//                     Open in New Tab
//                   </a>
//                 </div>

//                 <div className="text-center">
//                   <p className="text-xs text-gray-500">
//                     Generated: {selectedQR.teacherProfile.qr.uploadedAt 
//                       ? new Date(selectedQR.teacherProfile.qr.uploadedAt).toLocaleString()
//                       : 'Unknown'}
//                   </p>
//                 </div>
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-3" />
//                 <p className="text-gray-500">No QR code generated yet</p>
//                 <p className="text-xs text-gray-400 mt-1">QR code will be generated automatically</p>
//               </div>
//             )}
//           </div>
//         </Modal>
//       )}

//       {/* View Teacher Details Modal */}
//       {showViewModal && viewingTeacher && (
//         <Modal
//           open={showViewModal}
//           onClose={() => setShowViewModal(false)}
//           title="Teacher Details"
//           size="xl"
//         >
//           <div className="space-y-6">
//             {/* Header with Profile Photo */}
//             <div className="flex items-center gap-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
//               <div className="flex-shrink-0">
//                 {viewingTeacher.profilePhoto?.url ? (
//                   <img
//                     src={viewingTeacher.profilePhoto.url}
//                     alt={viewingTeacher.fullName}
//                     className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
//                   />
//                 ) : (
//                   <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
//                     {viewingTeacher.firstName?.[0]}{viewingTeacher.lastName?.[0]}
//                   </div>
//                 )}
//               </div>
//               <div className="flex-1">
//                 <h2 className="text-2xl font-bold text-gray-900 mb-1">
//                   {viewingTeacher.fullName || `${viewingTeacher.firstName} ${viewingTeacher.lastName}`}
//                 </h2>
//                 <p className="text-sm text-gray-600 font-medium mb-2">{viewingTeacher.teacherProfile?.designation || 'Teacher'}</p>
//                 <div className="flex items-center gap-4 text-sm">
//                   <span className="flex items-center gap-1 text-gray-600">
//                     <Award className="h-4 w-4" />
//                     {viewingTeacher.teacherProfile?.employeeId || 'N/A'}
//                   </span>
//                   <span className={`px-3 py-1 text-xs font-medium rounded-full ${
//                     viewingTeacher.status === 'active' ? 'bg-green-100 text-green-800' :
//                     viewingTeacher.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
//                     'bg-red-100 text-red-800'
//                   }`}>
//                     {(viewingTeacher.status || 'inactive').replace('_', ' ').toUpperCase()}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Personal Information */}
//             <div className="bg-white border border-gray-200 rounded-lg p-6">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                 <Users className="h-5 w-5 text-blue-600" />
//                 Personal Information
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="flex items-start gap-3">
//                   <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
//                   <div>
//                     <p className="text-xs text-gray-500">Email</p>
//                     <p className="text-sm font-medium text-gray-900">{viewingTeacher.email}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
//                   <div>
//                     <p className="text-xs text-gray-500">Phone</p>
//                     <p className="text-sm font-medium text-gray-900">{viewingTeacher.phone}</p>
//                   </div>
//                 </div>
//                 {viewingTeacher.cnic && (
//                   <div className="flex items-start gap-3">
//                     <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
//                     <div>
//                       <p className="text-xs text-gray-500">CNIC</p>
//                       <p className="text-sm font-medium text-gray-900">{viewingTeacher.cnic}</p>
//                     </div>
//                   </div>
//                 )}
//                 <div className="flex items-start gap-3">
//                   <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
//                   <div>
//                     <p className="text-xs text-gray-500">Date of Birth</p>
//                     <p className="text-sm font-medium text-gray-900">
//                       {viewingTeacher.dateOfBirth ? format(new Date(viewingTeacher.dateOfBirth), 'dd MMM yyyy') : 'N/A'}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <Users className="h-5 w-5 text-gray-400 mt-0.5" />
//                   <div>
//                     <p className="text-xs text-gray-500">Gender</p>
//                     <p className="text-sm font-medium text-gray-900 capitalize">{viewingTeacher.gender || 'N/A'}</p>
//                   </div>
//                 </div>
//                 {viewingTeacher.bloodGroup && (
//                   <div className="flex items-start gap-3">
//                     <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
//                     <div>
//                       <p className="text-xs text-gray-500">Blood Group</p>
//                       <p className="text-sm font-medium text-gray-900">{viewingTeacher.bloodGroup}</p>
//                     </div>
//                   </div>
//                 )}
//                 {viewingTeacher.religion && (
//                   <div className="flex items-start gap-3">
//                     <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
//                     <div>
//                       <p className="text-xs text-gray-500">Religion</p>
//                       <p className="text-sm font-medium text-gray-900">{viewingTeacher.religion}</p>
//                     </div>
//                   </div>
//                 )}
//                 <div className="flex items-start gap-3">
//                   <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
//                   <div>
//                     <p className="text-xs text-gray-500">Address</p>
//                     <p className="text-sm font-medium text-gray-900">
//                       {[viewingTeacher.address?.street, viewingTeacher.address?.city, viewingTeacher.address?.country]
//                         .filter(Boolean).join(', ') || 'N/A'}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Academic Information */}
//             <div className="bg-white border border-gray-200 rounded-lg p-6">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                 <GraduationCap className="h-5 w-5 text-blue-600" />
//                 Academic Information
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div className="flex items-start gap-3">
//                   <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
//                   <div>
//                     <p className="text-xs text-gray-500">Joining Date</p>
//                     <p className="text-sm font-medium text-gray-900">
//                       {viewingTeacher.teacherProfile?.joiningDate 
//                         ? format(new Date(viewingTeacher.teacherProfile.joiningDate), 'dd MMM yyyy') 
//                         : 'N/A'}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
//                   <div>
//                     <p className="text-xs text-gray-500">Department</p>
//                     <p className="text-sm font-medium text-gray-900">
//                       {viewingTeacher.teacherProfile?.departmentId?.name || 'N/A'}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Subjects */}
//               {viewingTeacher.teacherProfile?.subjects?.length > 0 && (
//                 <div className="mb-4">
//                   <p className="text-xs text-gray-500 mb-2">Subjects</p>
//                   <div className="flex flex-wrap gap-2">
//                     {viewingTeacher.teacherProfile.subjects.map((subject, idx) => (
//                       <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
//                         {subject.name || subject}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Classes */}
//               {viewingTeacher.teacherProfile?.classes?.length > 0 && (
//                 <div>
//                   <p className="text-xs text-gray-500 mb-2">Class Assignments</p>
//                   <div className="space-y-2">
//                     {viewingTeacher.teacherProfile.classes.map((cls, idx) => (
//                       <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
//                         <BookOpen className="h-4 w-4 text-blue-600" />
//                         <span className="text-sm font-medium">
//                           {cls.classId?.name || 'Unknown'} - {cls.subjectId?.name || 'Unknown'}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Qualifications */}
//               {viewingTeacher.teacherProfile?.qualifications?.length > 0 && (
//                 <div className="mt-4">
//                   <p className="text-xs text-gray-500 mb-2">Qualifications</p>
//                   <div className="space-y-2">
//                     {viewingTeacher.teacherProfile.qualifications.map((qual, idx) => (
//                       <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
//                         <p className="text-sm font-medium text-gray-900">{qual.degree} - {qual.institution}</p>
//                         <p className="text-xs text-gray-500">{qual.yearOfCompletion} | Grade: {qual.grade || 'N/A'}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Salary Information */}
//             {viewingTeacher.teacherProfile?.salaryDetails && (
//               <div className="bg-white border border-gray-200 rounded-lg p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                   <DollarSign className="h-5 w-5 text-blue-600" />
//                   Salary Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="bg-green-50 p-4 rounded-lg border border-green-200">
//                     <p className="text-xs text-green-600 mb-1">Basic Salary</p>
//                     <p className="text-lg font-bold text-green-900">
//                       Rs. {viewingTeacher.teacherProfile.salaryDetails.basicSalary?.toLocaleString() || 0}
//                     </p>
//                   </div>
//                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
//                     <p className="text-xs text-blue-600 mb-1">Total Allowances</p>
//                     <p className="text-lg font-bold text-blue-900">
//                       Rs. {Object.values(viewingTeacher.teacherProfile.salaryDetails.allowances || {})
//                         .reduce((sum, val) => sum + (val || 0), 0).toLocaleString()}
//                     </p>
//                   </div>
//                   <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
//                     <p className="text-xs text-purple-600 mb-1">Net Salary</p>
//                     <p className="text-lg font-bold text-purple-900">
//                       Rs. {(
//                         (viewingTeacher.teacherProfile.salaryDetails.basicSalary || 0) +
//                         Object.values(viewingTeacher.teacherProfile.salaryDetails.allowances || {})
//                           .reduce((sum, val) => sum + (val || 0), 0) -
//                         Object.values(viewingTeacher.teacherProfile.salaryDetails.deductions || {})
//                           .reduce((sum, val) => sum + (val || 0), 0)
//                       ).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Documents */}
//             {viewingTeacher.teacherProfile?.documents?.length > 0 && (
//               <div className="bg-white border border-gray-200 rounded-lg p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                   <FileText className="h-5 w-5 text-blue-600" />
//                   Documents
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   {viewingTeacher.teacherProfile.documents.map((doc, idx) => (
//                     <a
//                       key={idx}
//                       href={doc.url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
//                     >
//                       <FileText className="h-5 w-5 text-blue-600" />
//                       <div className="flex-1">
//                         <p className="text-sm font-medium text-gray-900 capitalize">{doc.type?.replace('_', ' ')}</p>
//                         <p className="text-xs text-gray-500">
//                           {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd MMM yyyy') : 'N/A'}
//                         </p>
//                       </div>
//                     </a>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Emergency Contact */}
//             {viewingTeacher.teacherProfile?.emergencyContact?.name && (
//               <div className="bg-white border border-gray-200 rounded-lg p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                   <Phone className="h-5 w-5 text-blue-600" />
//                   Emergency Contact
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <p className="text-xs text-gray-500">Name</p>
//                     <p className="text-sm font-medium text-gray-900">
//                       {viewingTeacher.teacherProfile.emergencyContact.name}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500">Relationship</p>
//                     <p className="text-sm font-medium text-gray-900">
//                       {viewingTeacher.teacherProfile.emergencyContact.relationship || 'N/A'}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500">Phone</p>
//                     <p className="text-sm font-medium text-gray-900">
//                       {viewingTeacher.teacherProfile.emergencyContact.phone || 'N/A'}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </Modal>
//       )}
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
import BranchSelect from '@/components/ui/branch-select';
import FullPageLoader from '@/components/ui/full-page-loader';
import TeacherForm from '@/components/teacher/teacher-form';
import TeacherViewModal from '@/components/teacher/teacher-view-modal';

export default function TeachersPage() {
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