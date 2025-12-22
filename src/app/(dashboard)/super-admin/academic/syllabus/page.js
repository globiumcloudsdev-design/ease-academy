'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { FileText, Plus, Search, Edit, Trash2, X, Eye, BookOpen, Calendar, User, CheckCircle } from 'lucide-react';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import BranchSelect from '@/components/ui/branch-select';
import ClassSelect from '@/components/ui/class-select';
import LevelSelect from '@/components/ui/level-select';
import GradeSelect from '@/components/ui/grade-select';
import StreamSelect from '@/components/ui/stream-select';
import GradeStreamSubjectSelect from '@/components/ui/grade-stream-subject-select';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function SyllabusPage() {
  const { user } = useAuth();
  const [syllabus, setSyllabus] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [levels, setLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSyllabus, setViewingSyllabus] = useState(null);
  const [editingSyllabus, setEditingSyllabus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    title: '',
    academicYear: `${currentYear}-${currentYear + 1}`,
    subjectId: '',
    classId: '',
    branchId: '',
    levelId: '',
    gradeId: '',
    streamId: '',
    overview: '',
    status: 'draft',
    courseObjectives: [],
    learningOutcomes: [],
    teachingMethods: [],
    chapters: [],
    assessmentPlan: {
      continuousAssessment: 20,
      midTermExam: 30,
      finalExam: 50,
      project: 0,
      practical: 0,
    },
  });
  const formRef = useRef(null);

  // temp inputs for arrays
  const [newObjective, setNewObjective] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [newMethod, setNewMethod] = useState('');
  const [newChapter, setNewChapter] = useState({ chapterNumber: '', chapterName: '', marks: '' });

  useEffect(() => {
    fetchSyllabus();
    fetchSubjects();
    fetchClasses();
    fetchBranches();
    fetchLevels();
    fetchStreams();
  }, [searchTerm, selectedSubject, selectedBranch, selectedClassFilter]);

  // Load filtered subjects when grade/stream changes in form
  useEffect(() => {
    if (formData.gradeId) {
      loadFilteredSubjects(formData.gradeId, formData.streamId);
    } else {
      setFilteredSubjects([]);
    }
  }, [formData.gradeId, formData.streamId]);

  const loadFilteredSubjects = async (gradeId, streamId) => {
    try {
      const params = new URLSearchParams();
      if (gradeId) params.append('gradeId', gradeId);
      if (streamId) params.append('streamId', streamId);
      
      const res = await apiClient.get(`${API_ENDPOINTS.SCHOOL.GRADE_STREAM_SUBJECTS.LIST}?${params}`);
      if (res?.success) {
        const subjects = (res.data || []).map(item => item.subjectId).filter(Boolean);
        setFilteredSubjects(subjects);
      }
    } catch (err) {
      console.error('Failed to load filtered subjects:', err);
    }
  };

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBranch && { branchId: selectedBranch }),
        ...(selectedClassFilter && { classId: selectedClassFilter }),
        ...(selectedSubject && { subjectId: selectedSubject }),
      });

      const response = await apiClient.get(`/api/super-admin/syllabus?${params}`);

      if (response.success) {
        setSyllabus(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch syllabus');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects. If classId is provided, fetch only subjects for that class.
  // When called without classId (e.g. top-level filter) it returns all subjects.
  const fetchSubjects = async (classId, branchId) => {
    try {
      const params = new URLSearchParams({ limit: '200', ...(classId && { classId }), ...(branchId && { branchId }) });
      const response = await apiClient.get(`/api/super-admin/subjects?${params}`);
      if (response?.success) {
        const list = response.data || response.data?.subjects || [];
        setSubjects(list);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchClasses = async (branchId) => {
    try {
      const params = new URLSearchParams({ limit: '200', ...(branchId && { branchId }) });
      const response = await apiClient.get(`/api/super-admin/classes?${params}`);
      if (response?.success) {
        const list = response.data || response.data?.classes || [];
        setClasses(list);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/branches?limit=200');
      if (response?.success) {
        const list = response.data?.branches || response.data || [];
        setBranches(list);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await apiClient.get('/api/school/levels?limit=100');
      if (response?.success) {
        setLevels(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch levels:', error);
    }
  };

  const fetchGrades = async (levelId) => {
    try {
      const params = new URLSearchParams({ limit: '100', ...(levelId && { levelId }) });
      const response = await apiClient.get(`/api/school/grades?${params}`);
      if (response?.success) {
        setGrades(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    }
  };

  const fetchStreams = async () => {
    try {
      const response = await apiClient.get('/api/school/streams?limit=100');
      if (response?.success) {
        setStreams(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSyllabus) {
        const response = await apiClient.put(
          `/api/super-admin/syllabus/${editingSyllabus._id}`,
          formData
        );
        if (response.success) {
          toast.success('Syllabus updated successfully');
          fetchSyllabus();
          handleCloseModal();
        }
      } else {
        const response = await apiClient.post('/api/super-admin/syllabus', formData);
        if (response.success) {
          toast.success('Syllabus created successfully');
          fetchSyllabus();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save syllabus');
      console.error(error);
    }
  };

  const handleEdit = async (syl) => {
    setEditingSyllabus(syl);
    setFormData({
      title: syl.title || '',
      academicYear: syl.academicYear || '',
      subjectId: syl.subjectId?._id || '',
      classId: syl.classId?._id || '',
      branchId: syl.branchId?._id || '',
      levelId: syl.levelId?._id || '',
      gradeId: syl.gradeId?._id || '',
      streamId: syl.streamId?._id || '',
      overview: syl.overview || '',
      status: syl.status || 'draft',
      courseObjectives: syl.courseObjectives || [],
      learningOutcomes: syl.learningOutcomes || [],
      teachingMethods: syl.teachingMethods || [],
      chapters: syl.chapters || [],
      assessmentPlan: syl.assessmentPlan || {
        continuousAssessment: 20,
        midTermExam: 30,
        finalExam: 50,
        project: 0,
        practical: 0,
      },
    });
    // preload classes & subjects for this branch/class so modal dropdowns are populated
    const branchId = syl.branchId?._id || '';
    const classId = syl.classId?._id || '';
    if (branchId) fetchClasses(branchId);
    if (classId) fetchSubjects(classId, branchId);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      const response = await apiClient.delete(`/api/super-admin/syllabus/${id}`);
      
      if (response.success) {
        toast.success('Syllabus archived successfully');
        fetchSyllabus();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleView = (syl) => {
    setViewingSyllabus(syl);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSyllabus(null);
    const currentYear = new Date().getFullYear();
    setFormData({
      title: '',
      academicYear: `${currentYear}-${currentYear + 1}`,
      subjectId: '',
      classId: '',
      branchId: '',
      levelId: '',
      gradeId: '',
      streamId: '',
      overview: '',
      status: 'draft',
      courseObjectives: [],
      learningOutcomes: [],
      teachingMethods: [],
      chapters: [],
      assessmentPlan: {
        continuousAssessment: 20,
        midTermExam: 30,
        finalExam: 50,
        project: 0,
        practical: 0,
      },
    });
    setFilteredSubjects([]);
    setNewObjective('');
    setNewOutcome('');
    setNewMethod('');
    setNewChapter({ chapterNumber: '', chapterName: '', marks: '' });
  };

  return (
    <div className="p-6">
      <div className="mb-6 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-7 w-7" />
          Syllabus Management
        </h1>
        <p className="text-gray-600 mt-1">Create and manage course syllabus</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search syllabus..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={Search} />
          </div>

          <div className="w-full sm:w-56">
            <Dropdown id="filter-branch" name="branch" value={selectedBranch} onChange={(e) => {
              const b = e.target.value; setSelectedBranch(b);
              if (b) { fetchClasses(b); fetchSubjects(undefined, b); } else { fetchClasses(); fetchSubjects(); }
            }} options={[{label: 'All Branches', value: ''}, ...branches.map(br=>({label: br.name, value: br._id}))]} placeholder="All Branches" />
          </div>

          <div className="w-full sm:w-56">
            <Dropdown id="filter-class" name="class" value={selectedClassFilter} onChange={(e)=>setSelectedClassFilter(e.target.value)} options={[{label:'All Classes', value:''}, ...classes.map(c=>({label:c.name,value:c._id}))]} placeholder="All Classes" />
          </div>

          <div className="w-full sm:w-56">
            <Dropdown id="filter-subject" name="subject" value={selectedSubject} onChange={(e)=>setSelectedSubject(e.target.value)} options={[{label:'All Subjects', value:''}, ...subjects.map(s=>({label:s.name, value:s._id}))]} placeholder="All Subjects" />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Add Syllabus
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : syllabus.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No syllabus found</div>
        ) : (
          <Table className="w-full">
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="bg-white divide-y divide-gray-200">
              {syllabus.map((syl) => (
                <TableRow key={syl._id} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4 text-sm font-medium text-gray-900">{syl.title}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">{syl.subjectId?.name || '-'}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">{syl.gradeId?.name || '-'}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">{syl.streamId?.name || <span className="italic text-gray-400">All</span>}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">{syl.academicYear}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      syl.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : syl.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {syl.status.charAt(0).toUpperCase() + syl.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(syl)} className="text-green-600 hover:text-green-900" title="View"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleEdit(syl)} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(syl._id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingSyllabus ? 'Edit Syllabus' : 'Add New Syllabus'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit?.() || formRef.current?.submit?.()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingSyllabus ? 'Update' : 'Add'} Syllabus
            </button>
          </div>
        }
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Syllabus Title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Mathematics Grade 10 Science Stream 2025-2026"
                  />
                </div>

                <BranchSelect
                  label="Branch (Optional)"
                  name="branchId"
                  value={formData.branchId}
                  onChange={(e) => {
                    const branchId = e.target.value;
                    setFormData({ ...formData, branchId, classId: '' });
                    if (branchId) fetchClasses(branchId);
                    else fetchClasses();
                  }}
                  branches={branches}
                  placeholder="Select Branch (optional)"
                />

                <ClassSelect
                  label="Class (Optional)"
                  name="classId"
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  classes={classes}
                  placeholder="Select Class (optional)"
                />

                <LevelSelect
                  label="Level"
                  name="levelId"
                  value={formData.levelId}
                  onChange={(e) => {
                    const levelId = e.target.value;
                    setFormData({ ...formData, levelId, gradeId: '', streamId: '', subjectId: '' });
                  }}
                  placeholder="Select Level"
                />

                <GradeSelect
                  label="Grade"
                  name="gradeId"
                  levelId={formData.levelId}
                  value={formData.gradeId}
                  onChange={(e) => {
                    const gradeId = e.target.value;
                    setFormData({ ...formData, gradeId, subjectId: '' });
                  }}
                  placeholder={formData.levelId ? "Select Grade" : "Select Level first"}
                />

                <StreamSelect
                  label="Stream (Optional)"
                  name="streamId"
                  value={formData.streamId}
                  onChange={(e) => {
                    const streamId = e.target.value;
                    setFormData({ ...formData, streamId, subjectId: '' });
                  }}
                  placeholder="Select Stream (optional)"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <Dropdown
                    name="subjectId"
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    options={
                      !formData.gradeId
                        ? [{ label: 'Select Grade first', value: '' }]
                        : filteredSubjects.length === 0
                        ? [{ label: 'No subjects mapped to this grade/stream', value: '' }]
                        : [
                            { label: 'Select Subject', value: '' },
                            ...filteredSubjects.map(s => ({ label: s.name || s, value: s._id || s }))
                          ]
                    }
                    placeholder="Select Subject"
                  />
                </div>

                <Input
                  label="Academic Year"
                  type="text"
                  required
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="e.g. 2025-2026"
                />

                <Dropdown
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { label: 'Draft', value: 'draft' },
                    { label: 'Submitted', value: 'submitted' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Published', value: 'published' }
                  ]}
                  placeholder="Select Status"
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overview</label>
                  <textarea
                    value={formData.overview}
                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    rows="3"
                    placeholder="Brief description of the syllabus..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

                {/* Course Objectives */}
                <Card>
                  <CardContent>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Objectives</label>
                    <div className="space-y-2">
                      {formData.courseObjectives.map((obj, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded">
                          <div className="text-sm text-gray-800">{obj}</div>
                          <button type="button" onClick={() => setFormData({ ...formData, courseObjectives: formData.courseObjectives.filter((_, i) => i !== idx) })} className="text-red-600">Remove</button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <input value={newObjective} onChange={(e) => setNewObjective(e.target.value)} placeholder="Add objective" className="flex-1 px-3 py-2 border rounded" />
                        <button type="button" onClick={() => { if (newObjective.trim()) { setFormData({ ...formData, courseObjectives: [...formData.courseObjectives, newObjective.trim()] }); setNewObjective(''); } }} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Outcomes */}
                <Card className="mt-4">
                  <CardContent>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Learning Outcomes</label>
                    <div className="space-y-2">
                      {formData.learningOutcomes.map((out, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded">
                          <div className="text-sm text-gray-800">{out}</div>
                          <button type="button" onClick={() => setFormData({ ...formData, learningOutcomes: formData.learningOutcomes.filter((_, i) => i !== idx) })} className="text-red-600">Remove</button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <input value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} placeholder="Add outcome" className="flex-1 px-3 py-2 border rounded" />
                        <button type="button" onClick={() => { if (newOutcome.trim()) { setFormData({ ...formData, learningOutcomes: [...formData.learningOutcomes, newOutcome.trim()] }); setNewOutcome(''); } }} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Teaching Methods */}
                <Card className="mt-4">
                  <CardContent>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Methods</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.teachingMethods.map((m, idx) => (
                        <div key={idx} className="px-2 py-1 bg-gray-100 rounded flex items-center gap-2">
                          <span className="text-sm text-gray-800">{m}</span>
                          <button type="button" onClick={() => setFormData({ ...formData, teachingMethods: formData.teachingMethods.filter((_, i) => i !== idx) })} className="text-red-600">x</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="Add method (e.g. Lecture)" className="flex-1 px-3 py-2 border rounded" />
                      <button type="button" onClick={() => { if (newMethod.trim()) { setFormData({ ...formData, teachingMethods: [...formData.teachingMethods, newMethod.trim()] }); setNewMethod(''); } }} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
                    </div>
                  </CardContent>
                </Card>

                {/* Chapters */}
                <Card className="mt-4">
                  <CardContent>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chapters</label>
                    <div className="space-y-2">
                      {formData.chapters.map((ch, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded">
                          <div>
                            <div className="text-sm font-medium">{ch.chapterName} (#{ch.chapterNumber})</div>
                            <div className="text-xs text-gray-600">Marks: {ch.marks}</div>
                          </div>
                          <button type="button" onClick={() => setFormData({ ...formData, chapters: formData.chapters.filter((_, i) => i !== idx) })} className="text-red-600">Remove</button>
                        </div>
                      ))}

                      <div className="grid grid-cols-3 gap-2">
                        <input value={newChapter.chapterNumber} onChange={(e) => setNewChapter({ ...newChapter, chapterNumber: e.target.value })} placeholder="Chapter #" className="px-3 py-2 border rounded" />
                        <input value={newChapter.chapterName} onChange={(e) => setNewChapter({ ...newChapter, chapterName: e.target.value })} placeholder="Chapter title" className="px-3 py-2 border rounded" />
                        <input value={newChapter.marks} onChange={(e) => setNewChapter({ ...newChapter, marks: e.target.value })} placeholder="Marks" className="px-3 py-2 border rounded" />
                      </div>
                      <div className="flex justify-end">
                        <button type="button" onClick={() => {
                          if (!newChapter.chapterName) return;
                          setFormData({ ...formData, chapters: [...formData.chapters, { ...newChapter }] });
                          setNewChapter({ chapterNumber: '', chapterName: '', marks: '' });
                        }} className="px-3 py-2 bg-blue-600 text-white rounded">Add Chapter</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assessment Plan */}
                <Card className="mt-4">
                  <CardContent>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Plan (percentage)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Continuous Assessment</label>
                        <input type="number" value={formData.assessmentPlan.continuousAssessment} onChange={(e) => setFormData({ ...formData, assessmentPlan: { ...formData.assessmentPlan, continuousAssessment: Number(e.target.value) } })} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Mid Term Exam</label>
                        <input type="number" value={formData.assessmentPlan.midTermExam} onChange={(e) => setFormData({ ...formData, assessmentPlan: { ...formData.assessmentPlan, midTermExam: Number(e.target.value) } })} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Final Exam</label>
                        <input type="number" value={formData.assessmentPlan.finalExam} onChange={(e) => setFormData({ ...formData, assessmentPlan: { ...formData.assessmentPlan, finalExam: Number(e.target.value) } })} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Project</label>
                        <input type="number" value={formData.assessmentPlan.project} onChange={(e) => setFormData({ ...formData, assessmentPlan: { ...formData.assessmentPlan, project: Number(e.target.value) } })} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Practical</label>
                        <input type="number" value={formData.assessmentPlan.practical} onChange={(e) => setFormData({ ...formData, assessmentPlan: { ...formData.assessmentPlan, practical: Number(e.target.value) } })} className="w-full px-3 py-2 border rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </form>
      </Modal>

      {/* View Syllabus Modal */}
      <Modal
        open={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingSyllabus(null); }}
        title="Syllabus Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowViewModal(false); setViewingSyllabus(null); }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowViewModal(false);
                handleEdit(viewingSyllabus);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Syllabus
            </button>
          </div>
        }
      >
        {viewingSyllabus && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{viewingSyllabus.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Subject</p>
                  <p className="text-sm font-semibold text-gray-900">{viewingSyllabus.subjectId?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Grade</p>
                  <p className="text-sm font-semibold text-gray-900">{viewingSyllabus.gradeId?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Stream</p>
                  <p className="text-sm font-semibold text-gray-900">{viewingSyllabus.streamId?.name || <span className="italic text-gray-400">All Streams</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Academic Year</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {viewingSyllabus.academicYear}
                  </p>
                </div>
              </div>
              {(viewingSyllabus.branchId || viewingSyllabus.classId) && (
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-blue-200">
                  {viewingSyllabus.branchId && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Branch</p>
                      <p className="text-sm font-semibold text-gray-900">{viewingSyllabus.branchId?.name}</p>
                    </div>
                  )}
                  {viewingSyllabus.classId && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Class</p>
                      <p className="text-sm font-semibold text-gray-900">{viewingSyllabus.classId?.name}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Academic Hierarchy */}
            {(viewingSyllabus.levelId || viewingSyllabus.gradeId || viewingSyllabus.streamId) && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Academic Hierarchy
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {viewingSyllabus.levelId && (
                      <div>
                        <p className="text-xs text-gray-500">Level</p>
                        <p className="text-sm font-medium text-gray-900">{viewingSyllabus.levelId?.name || '-'}</p>
                      </div>
                    )}
                    {viewingSyllabus.gradeId && (
                      <div>
                        <p className="text-xs text-gray-500">Grade</p>
                        <p className="text-sm font-medium text-gray-900">{viewingSyllabus.gradeId?.name || '-'}</p>
                      </div>
                    )}
                    {viewingSyllabus.streamId && (
                      <div>
                        <p className="text-xs text-gray-500">Stream</p>
                        <p className="text-sm font-medium text-gray-900">{viewingSyllabus.streamId?.name || '-'}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status */}
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-5 w-5 ${viewingSyllabus.status === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                viewingSyllabus.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : viewingSyllabus.status === 'submitted'
                  ? 'bg-blue-100 text-blue-800'
                  : viewingSyllabus.status === 'published'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {viewingSyllabus.status?.charAt(0).toUpperCase() + viewingSyllabus.status?.slice(1)}
              </span>
            </div>

            {/* Overview */}
            {viewingSyllabus.overview && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Overview</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{viewingSyllabus.overview}</p>
                </CardContent>
              </Card>
            )}

            {/* Course Objectives */}
            {viewingSyllabus.courseObjectives?.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Course Objectives</h3>
                  <ul className="space-y-2">
                    {viewingSyllabus.courseObjectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold text-sm mt-0.5">{idx + 1}.</span>
                        <span className="text-sm text-gray-700">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Learning Outcomes */}
            {viewingSyllabus.learningOutcomes?.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Learning Outcomes</h3>
                  <ul className="space-y-2">
                    {viewingSyllabus.learningOutcomes.map((out, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{out}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Teaching Methods */}
            {viewingSyllabus.teachingMethods?.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Teaching Methods</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingSyllabus.teachingMethods.map((method, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-200">
                        {method}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chapters */}
            {viewingSyllabus.chapters?.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Chapters/Units</h3>
                  <div className="space-y-3">
                    {viewingSyllabus.chapters.map((ch, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              Chapter {ch.chapterNumber}: {ch.chapterName}
                            </p>
                            {ch.duration && (
                              <p className="text-xs text-gray-500 mt-1">
                                {ch.duration.weeks && `${ch.duration.weeks} weeks`}
                                {ch.duration.hours && ` • ${ch.duration.hours} hours`}
                              </p>
                            )}
                          </div>
                          {ch.marks && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              {ch.marks} marks
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assessment Plan */}
            {viewingSyllabus.assessmentPlan && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Assessment Plan</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(viewingSyllabus.assessmentPlan).map(([key, value]) => (
                      <div key={key} className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 capitalize mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">{value}%</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <p className="text-sm text-gray-500">
                      Total: <span className="font-semibold text-gray-900">
                        {Object.values(viewingSyllabus.assessmentPlan).reduce((sum, val) => sum + (Number(val) || 0), 0)}%
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prepared/Approved By */}
            {(viewingSyllabus.preparedBy || viewingSyllabus.approvedBy) && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {viewingSyllabus.preparedBy && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Prepared By
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {viewingSyllabus.preparedBy?.firstName} {viewingSyllabus.preparedBy?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{viewingSyllabus.preparedBy?.employeeId}</p>
                      </div>
                    )}
                    {viewingSyllabus.approvedBy && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Approved By
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {viewingSyllabus.approvedBy?.firstName} {viewingSyllabus.approvedBy?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{viewingSyllabus.approvedBy?.employeeId}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
