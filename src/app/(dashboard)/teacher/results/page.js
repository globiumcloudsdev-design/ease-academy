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
import { Search, Eye, Download, TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function TeacherResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [examFilter, setExamFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    fetchResults();
    fetchExams();
    fetchClasses();
  }, [examFilter, classFilter, pagination.page]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (examFilter) params.examId = examFilter;
      if (classFilter) params.classId = classFilter;

      const response = await apiClient.get(API_ENDPOINTS.TEACHER.RESULTS.LIST, params);
      if (response.success) {
        setResults(response.data.results);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.EXAMS.LIST, { limit: 100 });
      if (response.success) {
        setExams(response.data.exams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
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

  const handleViewDetails = (result) => {
    setCurrentResult(result);
    setIsModalOpen(true);
  };

  const handleDownloadReport = async (resultId) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.RESULTS.DOWNLOAD.replace(':id', resultId), {}, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `result_${resultId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download report');
    }
  };

  if (loading && results.length === 0) {
    return <FullPageLoader message="Loading results..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Student Results</CardTitle>
            <Button onClick={() => handleDownloadReport('all')}>
              <Download className="w-4 h-4 mr-2" />
              Download All Reports
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Dropdown
              placeholder="Filter by exam"
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              options={[
                { value: '', label: 'All Exams' },
                ...exams.map((e) => ({ value: e._id, label: e.title })),
              ]}
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
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Marks Obtained</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow key={result._id}>
                    <TableCell className="font-medium">
                      {result.studentId?.firstName} {result.studentId?.lastName}
                      <div className="text-sm text-gray-500">{result.studentId?.admissionNumber}</div>
                    </TableCell>
                    <TableCell>{result.examId?.title || 'N/A'}</TableCell>
                    <TableCell>{result.classId?.name || 'N/A'}</TableCell>
                    <TableCell>{result.marksObtained || 0}</TableCell>
                    <TableCell>{result.totalMarks || 0}</TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {result.percentage ? `${result.percentage}%` : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.grade === 'A'
                            ? 'bg-green-100 text-green-700'
                            : result.grade === 'B'
                            ? 'bg-blue-100 text-blue-700'
                            : result.grade === 'C'
                            ? 'bg-yellow-100 text-yellow-700'
                            : result.grade === 'D'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {result.grade || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          result.status === 'pass'
                            ? 'bg-green-100 text-green-700'
                            : result.status === 'fail'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {result.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleViewDetails(result)} title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDownloadReport(result._id)} title="Download Report">
                          <Download className="w-4 h-4" />
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
              Showing {results.length} of {pagination.total} results
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

      {/* View Details Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Result Details"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {currentResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Student</label>
                <p className="font-semibold">
                  {currentResult.studentId?.firstName} {currentResult.studentId?.lastName}
                </p>
                <p className="text-sm text-gray-500">{currentResult.studentId?.admissionNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Exam</label>
                <p className="font-semibold">{currentResult.examId?.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Class</label>
                <p className="font-semibold">{currentResult.classId?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Subject</label>
                <p className="font-semibold">{currentResult.examId?.subject?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
              <div className="text-center">
                <label className="text-sm font-medium text-gray-500">Marks Obtained</label>
                <p className="text-2xl font-bold text-blue-600">{currentResult.marksObtained || 0}</p>
              </div>
              <div className="text-center">
                <label className="text-sm font-medium text-gray-500">Total Marks</label>
                <p className="text-2xl font-bold">{currentResult.totalMarks || 0}</p>
              </div>
              <div className="text-center">
                <label className="text-sm font-medium text-gray-500">Percentage</label>
                <p className="text-2xl font-bold text-green-600">{currentResult.percentage || 0}%</p>
              </div>
              <div className="text-center">
                <label className="text-sm font-medium text-gray-500">Grade</label>
                <p className="text-2xl font-bold text-purple-600">{currentResult.grade || 'N/A'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentResult.status === 'pass'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {currentResult.status === 'pass' ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>

            {currentResult.remarks && (
              <div>
                <label className="text-sm font-medium text-gray-500">Remarks</label>
                <p className="mt-1 text-sm">{currentResult.remarks}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500">Exam Date</label>
              <p className="mt-1">
                {currentResult.examId?.date ? new Date(currentResult.examId.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
