"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import ClassSelect from "@/components/ui/class-select";
import {
  FileText,
  Calendar,
  Clock,
  Users,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    classId: "",
    dueDate: "",
    totalMarks: "",
    allowLateSubmission: false,
    attachments: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { mockClasses } = await import("@/data/teacher");
      await new Promise((resolve) => setTimeout(resolve, 800));

      setClasses(mockClasses);

      const mockAssignments = [
        {
          _id: "1",
          title: "Quadratic Equations - Problem Set",
          classId: "1",
          className: "Advanced Mathematics",
          description:
            "Solve 20 problems on quadratic equations covering all topics",
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
          totalMarks: 50,
          totalStudents: 10,
          allowLateSubmission: true,
          submissions: [
            {
              studentId: 1,
              studentName: "Zara Khalid",
              roll: "701",
              submittedAt: new Date().toISOString(),
              status: "submitted",
              marks: 45,
            },
            {
              studentId: 2,
              studentName: "Shahzad Ali",
              roll: "702",
              submittedAt: new Date().toISOString(),
              status: "submitted",
              marks: null,
            },
            {
              studentId: 3,
              studentName: "Maryam Noor",
              roll: "703",
              submittedAt: null,
              status: "pending",
              marks: null,
            },
          ],
          status: "active",
        },
        {
          _id: "2",
          title: "Newton's Laws Lab Report",
          classId: "2",
          className: "Physics Fundamentals",
          description:
            "Write a detailed lab report on Newton's three laws of motion",
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          totalMarks: 100,
          totalStudents: 8,
          allowLateSubmission: false,
          submissions: [
            {
              studentId: 1,
              studentName: "Ahmed Khan",
              roll: "801",
              submittedAt: new Date().toISOString(),
              status: "submitted",
              marks: 85,
            },
          ],
          status: "active",
        },
      ];

      setAssignments(mockAssignments);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = () => {
    if (
      !formData.title ||
      !formData.classId ||
      !formData.dueDate ||
      !formData.totalMarks
    ) {
      alert("Please fill all required fields");
      return;
    }

    const selectedClass = classes.find((c) => c._id === formData.classId);

    const newAssignment = {
      _id: Date.now().toString(),
      ...formData,
      className: selectedClass?.name || "",
      totalStudents: selectedClass?.studentCount || 0,
      submissions: [],
      status: "active",
    };

    setAssignments([newAssignment, ...assignments]);
    setShowCreateModal(false);
    resetForm();
    alert("Assignment created successfully!");
  };

  const handleEditAssignment = () => {
    if (
      !formData.title ||
      !formData.classId ||
      !formData.dueDate ||
      !formData.totalMarks
    ) {
      alert("Please fill all required fields");
      return;
    }

    setAssignments(
      assignments.map((a) =>
        a._id === selectedAssignment._id
          ? {
              ...a,
              ...formData,
              className: classes.find((c) => c._id === formData.classId)?.name,
            }
          : a
      )
    );

    setShowCreateModal(false);
    setIsEditing(false);
    setSelectedAssignment(null);
    resetForm();
    alert("Assignment updated successfully!");
  };

  const handleOpenEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      classId: assignment.classId,
      dueDate: assignment.dueDate.split("T")[0],
      totalMarks: assignment.totalMarks,
      allowLateSubmission: assignment.allowLateSubmission,
      attachments: assignment.attachments || [],
    });
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      setAssignments(assignments.filter((a) => a._id !== id));
      alert("Assignment deleted successfully!");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      classId: "",
      dueDate: "",
      totalMarks: "",
      allowLateSubmission: false,
      attachments: [],
    });
  };

  const getStatusInfo = (assignment) => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (assignment.status === "completed") {
      return { label: "Completed", color: "bg-gray-500" };
    }

    if (diffDays < 0) {
      return { label: "Overdue", color: "bg-red-500" };
    }

    if (diffDays === 0) {
      return { label: "Due Today", color: "bg-orange-500 animate-pulse" };
    }

    if (diffDays === 1) {
      return { label: "Due Tomorrow", color: "bg-yellow-500" };
    }

    return { label: `${diffDays} days left`, color: "bg-blue-500" };
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "all") return true;
    if (filter === "active") return assignment.status === "active";
    if (filter === "overdue") {
      const dueDate = new Date(assignment.dueDate);
      return dueDate < new Date();
    }
    return true;
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage student assignments
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsEditing(false);
            setShowCreateModal(true);
          }}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          All ({assignments.length})
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          onClick={() => setFilter("active")}
          size="sm"
        >
          Active ({assignments.filter((a) => a.status === "active").length})
        </Button>
        <Button
          variant={filter === "overdue" ? "default" : "outline"}
          onClick={() => setFilter("overdue")}
          size="sm"
        >
          Overdue (
          {assignments.filter((a) => new Date(a.dueDate) < new Date()).length})
        </Button>
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {filteredAssignments.map((assignment, index) => {
          const statusInfo = getStatusInfo(assignment);
          const submittedCount =
            assignment.submissions?.filter((s) => s.status === "submitted")
              .length || 0;
          const submissionRate =
            assignment.totalStudents > 0
              ? Math.round((submittedCount / assignment.totalStudents) * 100)
              : 0;

          return (
            <motion.div
              key={assignment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">
                            {assignment.title}
                          </h3>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {assignment.className}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.description}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground lg:ml-16">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Due:{" "}
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{assignment.totalMarks} marks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{assignment.totalStudents} students</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Stats */}
                  <div className="text-center lg:text-right flex-shrink-0">
                    <div className="mb-3">
                      <p className="text-3xl font-bold text-primary">
                        {submissionRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-green-600 font-medium">
                        {submittedCount} submitted
                      </p>
                      <p className="text-orange-600 font-medium">
                        {assignment.totalStudents - submittedCount} pending
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 mb-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                      style={{ width: `${submissionRate}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowDetailModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(assignment)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(assignment._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">
            No assignments found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "all"
              ? "Create your first assignment"
              : `No ${filter} assignments`}
          </p>
        </Card>
      )}

      {/* Create/Edit Assignment Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setIsEditing(false);
          resetForm();
        }}
        title={isEditing ? "Edit Assignment" : "Create New Assignment"}
        size="lg"
      >
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Assignment Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Quadratic Equations Problem Set"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the assignment..."
              rows={3}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Class <span className="text-red-500">*</span>
            </label>
            <ClassSelect
              id="assignment-class"
              name="class"
              value={formData.classId}
              onChange={(e) =>
                setFormData({ ...formData, classId: e.target.value })
              }
              classes={classes}
              placeholder="Choose a class..."
              className="w-full"
            />
          </div>

          {/* Due Date and Marks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.totalMarks}
                onChange={(e) =>
                  setFormData({ ...formData, totalMarks: e.target.value })
                }
                placeholder="e.g., 100"
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Late Submission */}
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
            <input
              type="checkbox"
              id="lateSubmission"
              checked={formData.allowLateSubmission}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allowLateSubmission: e.target.checked,
                })
              }
              className="w-4 h-4 rounded border-gray-300"
            />
            <label
              htmlFor="lateSubmission"
              className="text-sm font-medium cursor-pointer"
            >
              Allow late submissions
            </label>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Attachments (Optional)
            </label>
            <input
              type="file"
              id="fileUpload"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setFormData({
                  ...formData,
                  attachments: [
                    ...(formData.attachments || []),
                    ...files.map((f) => f.name),
                  ],
                });
              }}
              className="hidden"
            />
            <div
              onClick={() => document.getElementById("fileUpload").click()}
              className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20 hover:bg-muted/40"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, PPT (Max 10MB)
              </p>
            </div>

            {/* File List */}
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm">{file}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({
                          ...formData,
                          attachments: formData.attachments.filter(
                            (_, i) => i !== index
                          ),
                        });
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setIsEditing(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={
                isEditing ? handleEditAssignment : handleCreateAssignment
              }
              className="flex-1"
            >
              {isEditing ? "Update Assignment" : "Create Assignment"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <Modal
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAssignment(null);
          }}
          title="Assignment Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Assignment Info */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-5 rounded-lg border border-primary/20">
              <h3 className="font-bold text-xl mb-2">
                {selectedAssignment.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedAssignment.className}
              </p>
              <p className="text-sm mb-4">{selectedAssignment.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Due:{" "}
                    {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{selectedAssignment.totalMarks} marks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{selectedAssignment.totalStudents} students</span>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student Submissions
              </h4>

              {selectedAssignment.submissions &&
              selectedAssignment.submissions.length > 0 ? (
                <div className="space-y-2">
                  {selectedAssignment.submissions.map((submission) => (
                    <div
                      key={submission.studentId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
                          {submission.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium">
                            {submission.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Roll: {submission.roll}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {submission.status === "submitted" ? (
                          <>
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Submitted
                            </Badge>
                            {submission.marks !== null && (
                              <span className="text-sm font-semibold text-primary">
                                {submission.marks}/
                                {selectedAssignment.totalMarks}
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No submissions yet</p>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {selectedAssignment.submissions?.filter(
                    (s) => s.status === "submitted"
                  ).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Submitted</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {selectedAssignment.totalStudents -
                    (selectedAssignment.submissions?.filter(
                      (s) => s.status === "submitted"
                    ).length || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
