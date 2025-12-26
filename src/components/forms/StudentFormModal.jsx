'use client';
import { Button } from '@/components/ui/button';
import Tabs from '@/components/ui/tabs';
import Dropdown from '@/components/ui/dropdown';
import BloodGroupSelect from '@/components/ui/blood-group';
import GenderSelect from '@/components/ui/gender-select';
import ClassSelect from '@/components/ui/class-select';
import DepartmentSelect from '@/components/ui/department-select';
import BranchSelect from '@/components/ui/branch-select';
import Input from '@/components/ui/input';
import Modal from '@/components/ui/modal';
// import Textarea from '@/components/ui/textarea';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Upload,
  FileText,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

const STUDENT_FORM_TABS = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'academic', label: 'Academic Info' },
  { id: 'parent', label: 'Parent/Guardian' },
  { id: 'medical', label: 'Medical' },
  { id: 'documents', label: 'Documents' },
];

const StudentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingStudent = null,
  isSubmitting = false,
  branches = [],
  classes = [],
  departments = [],
  userRole = 'branch_admin',
  currentBranchId = null,
}) => {
  const formRef = useRef(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [uploading, setUploading] = useState(false);
  const [pendingProfileFile, setPendingProfileFile] = useState(null);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [profilePreview, setProfilePreview] = useState(null);

  // Initialize form data
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    nationality: 'Pakistani',
    religion: '',
    cnic: '',

    // Address
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
    },

    // Branch & Class
    branchId: userRole === 'super_admin' ? '' : currentBranchId,
    classId: '',
    departmentId: '',
    section: '',

    // Academic
    rollNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    academicYear: new Date().getFullYear().toString(),

    // Parent/Guardian
    father: {
      name: '',
      occupation: '',
      phone: '',
      email: '',
      cnic: '',
      income: 0,
    },
    mother: {
      name: '',
      occupation: '',
      phone: '',
      email: '',
      cnic: '',
    },
    guardian: {
      name: '',
      relation: '',
      phone: '',
      email: '',
      cnic: '',
    },
    guardianType: 'parent',

    // Academic History
    previousSchool: {
      name: '',
      lastClass: '',
      marks: 0,
      leavingDate: '',
    },

    // Fees
    feeDiscount: {
      type: 'fixed',
      amount: 0,
      reason: '',
    },
    transportFee: {
      enabled: false,
      routeId: '',
      amount: 0,
    },

    // Medical
    medicalInfo: {
      allergies: '',
      chronicConditions: '',
      medications: '',
      doctorName: '',
      doctorPhone: '',
    },

    // Emergency Contact
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },

    // Status & Remarks
    status: 'active',
    remarks: '',

    // Uploads
    profilePhoto: null,
    documents: [],
  });

  // Load editing student data
  useEffect(() => {
    if (editingStudent && isOpen) {
      setFormData({
        // Personal Info
        firstName: editingStudent.firstName || '',
        lastName: editingStudent.lastName || '',
        email: editingStudent.email || '',
        phone: editingStudent.phone || '',
        alternatePhone: editingStudent.alternatePhone || '',
        dateOfBirth: editingStudent.dateOfBirth
          ? new Date(editingStudent.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: editingStudent.gender || 'male',
        bloodGroup: editingStudent.bloodGroup || '',
        nationality: editingStudent.nationality || 'Pakistani',
        religion: editingStudent.religion || '',
        cnic: editingStudent.cnic || '',

        // Address
        address: editingStudent.address || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Pakistan',
        },

        // Branch & Class
        branchId: editingStudent.branchId?._id || editingStudent.branchId ||
          (userRole === 'super_admin' ? '' : currentBranchId),
        classId: editingStudent.studentProfile?.classId?._id ||
          editingStudent.studentProfile?.classId || '',
        departmentId: editingStudent.studentProfile?.departmentId?._id || '',
        section: editingStudent.studentProfile?.section || '',

        // Academic
        rollNumber: editingStudent.studentProfile?.rollNumber || '',
        admissionDate: editingStudent.studentProfile?.admissionDate
          ? new Date(editingStudent.studentProfile.admissionDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        academicYear: editingStudent.studentProfile?.academicYear ||
          new Date().getFullYear().toString(),

        // Parent/Guardian
        father: editingStudent.studentProfile?.father || {
          name: '',
          occupation: '',
          phone: '',
          email: '',
          cnic: '',
          income: 0,
        },
        mother: editingStudent.studentProfile?.mother || {
          name: '',
          occupation: '',
          phone: '',
          email: '',
          cnic: '',
        },
        guardian: editingStudent.studentProfile?.guardian || {
          name: '',
          relation: '',
          phone: '',
          email: '',
          cnic: '',
        },
        guardianType: editingStudent.studentProfile?.guardianType || 'parent',

        // Academic History
        previousSchool: editingStudent.studentProfile?.previousSchool || {
          name: '',
          lastClass: '',
          marks: 0,
          leavingDate: '',
        },

        // Fees
        feeDiscount: editingStudent.studentProfile?.feeDiscount || {
          type: 'fixed',
          amount: 0,
          reason: '',
        },
        transportFee: editingStudent.studentProfile?.transportFee || {
          enabled: false,
          routeId: '',
          amount: 0,
        },

        // Medical
        medicalInfo: editingStudent.medicalInfo || {
          allergies: '',
          chronicConditions: '',
          medications: '',
          doctorName: '',
          doctorPhone: '',
        },

        // Emergency Contact
        emergencyContact: editingStudent.emergencyContact || {
          name: '',
          relationship: '',
          phone: '',
        },

        // Status & Remarks
        status: editingStudent.status || 'active',
        remarks: editingStudent.remarks || '',

        // Uploads
        profilePhoto: editingStudent.profilePhoto || null,
        documents: editingStudent.studentProfile?.documents || [],
      });

      // Set profile preview if exists
      if (editingStudent.profilePhoto?.url) {
        setProfilePreview(editingStudent.profilePhoto.url);
      }
    } else if (!editingStudent && isOpen) {
      // Reset form for new student
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        alternatePhone: '',
        dateOfBirth: '',
        gender: 'male',
        bloodGroup: '',
        nationality: 'Pakistani',
        religion: '',
        cnic: '',
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Pakistan',
        },
        branchId: userRole === 'super_admin' ? '' : currentBranchId,
        classId: '',
        departmentId: '',
        section: '',
        rollNumber: '',
        admissionDate: new Date().toISOString().split('T')[0],
        academicYear: new Date().getFullYear().toString(),
        father: {
          name: '',
          occupation: '',
          phone: '',
          email: '',
          cnic: '',
          income: 0,
        },
        mother: {
          name: '',
          occupation: '',
          phone: '',
          email: '',
          cnic: '',
        },
        guardian: {
          name: '',
          relation: '',
          phone: '',
          email: '',
          cnic: '',
        },
        guardianType: 'parent',
        previousSchool: {
          name: '',
          lastClass: '',
          marks: 0,
          leavingDate: '',
        },
        feeDiscount: {
          type: 'fixed',
          amount: 0,
          reason: '',
        },
        transportFee: {
          enabled: false,
          routeId: '',
          amount: 0,
        },
        medicalInfo: {
          allergies: '',
          chronicConditions: '',
          medications: '',
          doctorName: '',
          doctorPhone: '',
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
        },
        status: 'active',
        remarks: '',
        profilePhoto: null,
        documents: [],
      });
      setProfilePreview(null);
    }
  }, [editingStudent, isOpen, userRole, currentBranchId]);

  // Filter classes based on selected branch
  useEffect(() => {
    if (formData.branchId && classes.length > 0) {
      const filteredClasses = classes.filter(
        cls => cls.branchId === formData.branchId ||
          cls.branchId?._id === formData.branchId
      );
      setAvailableClasses(filteredClasses);

      // Reset class selection if current class not in filtered list
      if (formData.classId && !filteredClasses.some(c =>
        c._id === formData.classId || c._id === formData.classId?._id
      )) {
        setFormData(prev => ({ ...prev, classId: '' }));
      }
    } else {
      setAvailableClasses([]);
    }
  }, [formData.branchId, classes]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'transportFee' && child === 'enabled') {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: checked,
          },
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'number' ? parseFloat(value) || 0 : value,
          },
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleNestedObjectChange = (parent, child, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value,
      },
    }));
  };

  // Derived sections for the currently selected class
  const classSections = useMemo(() => {
    if (!formData.classId || !availableClasses || availableClasses.length === 0) return [];
    const cls = availableClasses.find(c => String(c._id) === String(formData.classId) || (c._id?._id && String(c._id._id) === String(formData.classId)));
    return cls?.sections || [];
  }, [formData.classId, availableClasses]);

  // When class changes, if section no longer exists, set default to first section or empty
  useEffect(() => {
    if (formData.classId) {
      if (classSections.length > 0) {
        const exists = classSections.some(s => String(s.name) === String(formData.section));
        if (!exists) {
          setFormData(prev => ({ ...prev, section: classSections[0].name }));
        }
      } else {
        setFormData(prev => ({ ...prev, section: '' }));
      }
    }
  }, [formData.classId, classSections]);

  const handleProfileUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Store file for later upload
      setPendingProfileFile(file);
    } catch (error) {
      toast.error('Failed to process profile photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = (file, customName = '') => {
    if (!file) return;

    const newDocument = {
      file,
      type: customName || 'other',
      name: customName || file.name,
      customName: customName,
      size: file.size,
      preview: URL.createObjectURL(file),
    };

    setPendingDocuments(prev => [...prev, newDocument]);
  };

  const removePendingDocument = (index) => {
    setPendingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (userRole === 'super_admin' && !formData.branchId) {
      toast.error('Please select a branch');
      return;
    }

    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }

    // Prepare data for submission
    const submissionData = {
      // User fields
      role: 'student',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      alternatePhone: formData.alternatePhone,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      nationality: formData.nationality,
      religion: formData.religion,
      cnic: formData.cnic,
      address: formData.address,
      branchId: formData.branchId,
      status: formData.status,
      remarks: formData.remarks,

      // Student Profile fields
      studentProfile: {
        classId: formData.classId,
        ...(formData.departmentId && { departmentId: formData.departmentId }),
        section: formData.section,
        rollNumber: formData.rollNumber,
        admissionDate: formData.admissionDate,
        academicYear: formData.academicYear,
        previousSchool: formData.previousSchool,
        father: formData.father,
        mother: formData.mother,
        guardian: formData.guardian,
        guardianType: formData.guardianType,
        feeDiscount: formData.feeDiscount,
        transportFee: formData.transportFee,
      },

      // Additional fields
      medicalInfo: formData.medicalInfo,
      emergencyContact: formData.emergencyContact,

      // Files to upload
      pendingProfileFile,
      pendingDocuments,

      // Editing mode
      isEditMode: !!editingStudent,
      studentId: editingStudent?._id,
    };

    // Call parent onSubmit
    onSubmit(submissionData);
  };

  const renderPersonalInfoTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Personal Information</h3>
      </div>

      {/* Profile Photo */}
      <div className="border-b pb-6">
        <label className="block text-sm font-medium mb-3">Profile Photo</label>
        <div className="flex items-center gap-6">
          <div className="relative">
            {profilePreview ? (
              <img
                src={profilePreview}
                alt="Profile preview"
                className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleProfileUpload(e.target.files[0])}
              className="hidden"
              id="profile-upload"
            />
            <label htmlFor="profile-upload" className="cursor-pointer">
              <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload Profile Photo'}</span>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: Square image, max 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Shoaib"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Raza"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="student@easeacademy.com"
            icon={Mail}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Phone <span className="text-red-500">*</span>
          </label>
          <Input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+92 300 1234567"
            icon={Phone}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Alternate Phone</label>
          <Input
            type="tel"
            name="alternatePhone"
            value={formData.alternatePhone}
            onChange={handleInputChange}
            placeholder="+92 300 1234567"
            icon={Phone}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">CNIC/B-Form</label>
          <Input
            type="text"
            name="cnic"
            value={formData.cnic}
            onChange={handleInputChange}
            placeholder="XXXXX-XXXXXXX-X"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Date of Birth</label>
          <Input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            icon={Calendar}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Gender</label>
          <GenderSelect
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Blood Group</label>
          <BloodGroupSelect
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Nationality</label>
          <Input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            placeholder="Pakistani"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Religion</label>
          <Input
            type="text"
            name="religion"
            value={formData.religion}
            onChange={handleInputChange}
            placeholder="Islam"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Address Information
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Street Address</label>
            <Input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              placeholder="House #, Street, Area"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <Input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                placeholder="Lahore"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <Input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                placeholder="Punjab"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Postal Code</label>
              <Input
                type="text"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleInputChange}
                placeholder="54000"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademicInfoTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Academic Information</h3>
      </div>

      {/* Branch Selection (only for super admin) */}
      {userRole === 'super_admin' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Branch <span className="text-red-500">*</span>
          </label>
          <BranchSelect
            name="branchId"
            value={formData.branchId}
            onChange={handleInputChange}
            branches={branches}
            placeholder="Select Branch"
            required
          />
        </div>
      )}

      {/* Class & Department */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Class <span className="text-red-500">*</span>
          </label>
          <ClassSelect
            name="classId"
            value={formData.classId}
            onChange={handleInputChange}
            classes={availableClasses}
            placeholder="Select Class"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Section</label>
          {/* {
            // derive sections from selected class in availableClasses
            
          } */}
           {classSections && classSections.length > 0 ? (
            <Dropdown
              name="section"
              value={formData.section}
              onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
              options={[{ value: '', label: 'Select Section' }, ...classSections.map(s => ({ value: s.name, label: s.name }))]}
              placeholder="Select Section"
            />
          ) : (
            <Input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleInputChange}
              placeholder="A"
            />
          )}
          {/* <SectionDropdown /> */}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Academic Year</label>
          <Input
            type="text"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleInputChange}
            placeholder="2024-2025"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Admission Date</label>
          <Input
            type="date"
            name="admissionDate"
            value={formData.admissionDate}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <Dropdown
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'graduated', label: 'Graduated' },
              { value: 'transferred', label: 'Transferred' },
            ]}
            placeholder="Select Status"
          />
        </div>
      </div>

      {/* Previous School */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold mb-4">Previous School Information</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">School Name</label>
              <Input
                type="text"
                name="previousSchool.name"
                value={formData.previousSchool.name}
                onChange={handleInputChange}
                placeholder="Previous School Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Class</label>
              <Input
                type="text"
                name="previousSchool.lastClass"
                value={formData.previousSchool.lastClass}
                onChange={handleInputChange}
                placeholder="e.g., 9th Grade"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Marks/Percentage</label>
              <Input
                type="number"
                name="previousSchool.marks"
                value={formData.previousSchool.marks}
                onChange={handleInputChange}
                placeholder="85.5"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Leaving Date</label>
              <Input
                type="date"
                name="previousSchool.leavingDate"
                value={formData.previousSchool.leavingDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fee Information */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold mb-4">Fee Information</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Fee Discount Type</label>
              <Dropdown
                name="feeDiscount.type"
                value={formData.feeDiscount.type}
                onChange={handleInputChange}
                options={[
                  { value: 'fixed', label: 'Fixed Amount' },
                  { value: 'percentage', label: 'Percentage' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Discount Amount</label>
              <Input
                type="number"
                name="feeDiscount.amount"
                value={formData.feeDiscount.amount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Discount Reason</label>
            <Input
              type="text"
              name="feeDiscount.reason"
              value={formData.feeDiscount.reason}
              onChange={handleInputChange}
              placeholder="Reason for discount"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="transportFeeEnabled"
              name="transportFee.enabled"
              checked={formData.transportFee.enabled}
              onChange={handleInputChange}
              className="rounded border-gray-300"
            />
            <label htmlFor="transportFeeEnabled" className="text-sm font-medium">
              Enable Transport Fee
            </label>
          </div>

          {formData.transportFee.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Transport Fee Amount</label>
                <Input
                  type="number"
                  name="transportFee.amount"
                  value={formData.transportFee.amount}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Route ID (Optional)</label>
                <Input
                  type="text"
                  name="transportFee.routeId"
                  value={formData.transportFee.routeId}
                  onChange={handleInputChange}
                  placeholder="Route identifier"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderParentGuardianTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>
        <div className="w-48">
          <label className="block text-sm font-medium mb-2">Guardian Type</label>
          <Dropdown
            name="guardianType"
            value={formData.guardianType}
            onChange={handleInputChange}
            options={[
              { value: 'parent', label: 'Parent (Father/Mother)' },
              { value: 'guardian', label: 'Guardian (Other)' },
            ]}
          />
        </div>
      </div>

      {formData.guardianType === 'parent' ? (
        <>
          {/* Father Information */}
          <div className="border rounded-lg p-6 space-y-4">
            <h4 className="text-md font-semibold text-gray-700">Father Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Father Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="father.name"
                  value={formData.father.name}
                  onChange={handleInputChange}
                  placeholder="Father's full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Occupation</label>
                <Input
                  type="text"
                  name="father.occupation"
                  value={formData.father.occupation}
                  onChange={handleInputChange}
                  placeholder="Occupation"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  name="father.phone"
                  value={formData.father.phone}
                  onChange={handleInputChange}
                  placeholder="+92 300 1234567"
                  icon={Phone}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  name="father.email"
                  value={formData.father.email}
                  onChange={handleInputChange}
                  placeholder="father@example.com"
                  icon={Mail}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">CNIC</label>
                <Input
                  type="text"
                  name="father.cnic"
                  value={formData.father.cnic}
                  onChange={handleInputChange}
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Monthly Income</label>
                <Input
                  type="number"
                  name="father.income"
                  value={formData.father.income}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Mother Information */}
          <div className="border rounded-lg p-6 space-y-4">
            <h4 className="text-md font-semibold text-gray-700">Mother Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Mother Name</label>
                <Input
                  type="text"
                  name="mother.name"
                  value={formData.mother.name}
                  onChange={handleInputChange}
                  placeholder="Mother's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Occupation</label>
                <Input
                  type="text"
                  name="mother.occupation"
                  value={formData.mother.occupation}
                  onChange={handleInputChange}
                  placeholder="Occupation"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="tel"
                  name="mother.phone"
                  value={formData.mother.phone}
                  onChange={handleInputChange}
                  placeholder="+92 300 1234567"
                  icon={Phone}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  name="mother.email"
                  value={formData.mother.email}
                  onChange={handleInputChange}
                  placeholder="mother@example.com"
                  icon={Mail}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CNIC</label>
              <Input
                type="text"
                name="mother.cnic"
                value={formData.mother.cnic}
                onChange={handleInputChange}
                placeholder="XXXXX-XXXXXXX-X"
              />
            </div>
          </div>
        </>
      ) : (
        /* Guardian Information */
        <div className="border rounded-lg p-6 space-y-4">
          <h4 className="text-md font-semibold text-gray-700">Guardian Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Guardian Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="guardian.name"
                value={formData.guardian.name}
                onChange={handleInputChange}
                placeholder="Guardian's full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Relation</label>
              <Input
                type="text"
                name="guardian.relation"
                value={formData.guardian.relation}
                onChange={handleInputChange}
                placeholder="e.g., Uncle, Aunt, Grandfather"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                name="guardian.phone"
                value={formData.guardian.phone}
                onChange={handleInputChange}
                placeholder="+92 300 1234567"
                icon={Phone}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                name="guardian.email"
                value={formData.guardian.email}
                onChange={handleInputChange}
                placeholder="guardian@example.com"
                icon={Mail}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">CNIC</label>
            <Input
              type="text"
              name="guardian.cnic"
              value={formData.guardian.cnic}
              onChange={handleInputChange}
              placeholder="XXXXX-XXXXXXX-X"
            />
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold mb-4">Emergency Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Contact Name</label>
            <Input
              type="text"
              name="emergencyContact.name"
              value={formData.emergencyContact.name}
              onChange={handleInputChange}
              placeholder="Emergency contact name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Relationship</label>
            <Input
              type="text"
              name="emergencyContact.relationship"
              value={formData.emergencyContact.relationship}
              onChange={handleInputChange}
              placeholder="Relationship to student"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Phone</label>
          <Input
            type="tel"
            name="emergencyContact.phone"
            value={formData.emergencyContact.phone}
            onChange={handleInputChange}
            placeholder="+92 300 1234567"
            icon={Phone}
          />
        </div>
      </div>

      {/* Remarks */}
      <div className="border-t pt-6">
        <label className="block text-sm font-medium mb-2">Remarks</label>
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="Additional notes or remarks..."
        />
      </div>
    </div>
  );

  const renderMedicalTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Medical Information</h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Allergies</label>
        <textarea
          name="medicalInfo.allergies"
          value={formData.medicalInfo.allergies}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="List any known allergies (e.g., peanuts, penicillin, dust)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Chronic Conditions</label>
        <textarea
          name="medicalInfo.chronicConditions"
          value={formData.medicalInfo.chronicConditions}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="List any chronic medical conditions (e.g., asthma, diabetes, epilepsy)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Current Medications</label>
        <textarea
          name="medicalInfo.medications"
          value={formData.medicalInfo.medications}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="List current medications and dosages"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Doctor Name</label>
          <Input
            type="text"
            name="medicalInfo.doctorName"
            value={formData.medicalInfo.doctorName}
            onChange={handleInputChange}
            placeholder="Doctor's name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Doctor Phone</label>
          <Input
            type="tel"
            name="medicalInfo.doctorPhone"
            value={formData.medicalInfo.doctorPhone}
            onChange={handleInputChange}
            placeholder="+92 300 1234567"
            icon={Phone}
          />
        </div>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents</h3>
      </div>

      {/* Document Name Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Document Name</label>
          <Input
            type="text"
            placeholder="Enter document name (e.g., B-Form, Birth Certificate, etc.)"
            value={formData.documentName || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, documentName: e.target.value }))}
            className="mb-4"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => {
              if (!formData.documentName?.trim()) {
                toast.error('Please enter a document name first');
                return;
              }
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
              input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                  handleDocumentUpload(file, formData.documentName.trim());
                  setFormData(prev => ({ ...prev, documentName: '' })); // Clear the input after upload
                }
              };
              input.click();
            }}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
          <p className="text-sm text-gray-500">
            Supported: PDF, DOC, DOCX, JPG, PNG (Max 5MB per file)
          </p>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {pendingDocuments.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-4">Documents to Upload</h4>
          <div className="space-y-3">
            {pendingDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {doc.type} • {(doc.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePendingDocument(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Documents (for edit mode) */}
      {editingStudent?.studentProfile?.documents?.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-4">Existing Documents</h4>
          <div className="space-y-3">
            {editingStudent.studentProfile.documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.name || doc.type || 'Document'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.type} • {doc.uploadedAt ?
                        new Date(doc.uploadedAt).toLocaleDateString() :
                        'Recently uploaded'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfoTab();
      case 'academic':
        return renderAcademicInfoTab();
      case 'parent':
        return renderParentGuardianTab();
      case 'medical':
        return renderMedicalTab();
      case 'documents':
        return renderDocumentsTab();
      default:
        return renderPersonalInfoTab();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeOnBackdrop={false}
      title={editingStudent ? 'Edit Student' : 'Add New Student'}
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div>
            {activeTab !== 'personal' && (
              <Button
                variant="outline"
                onClick={() => {
                  const tabIndex = STUDENT_FORM_TABS.findIndex(tab => tab.id === activeTab);
                  if (tabIndex > 0) {
                    setActiveTab(STUDENT_FORM_TABS[tabIndex - 1].id);
                  }
                }}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'documents' ? (
              <Button
                onClick={() => {
                  const tabIndex = STUDENT_FORM_TABS.findIndex(tab => tab.id === activeTab);
                  if (tabIndex < STUDENT_FORM_TABS.length - 1) {
                    setActiveTab(STUDENT_FORM_TABS[tabIndex + 1].id);
                  }
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editingStudent ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {editingStudent ? 'Update Student' : 'Create Student'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit}>
        <Tabs
          tabs={STUDENT_FORM_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="max-h-[60vh] overflow-y-auto p-1 mt-4">
          {renderTabContent()}
        </div>
      </form>
    </Modal>
  );
};

export default StudentFormModal;