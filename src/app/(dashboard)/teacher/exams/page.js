"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import {
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";

export default function TeacherExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  // Modal state used for both Create and Edit
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [newExam, setNewExam] = useState({
    title: "",
    className: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    duration: 60,
    room: "",
    totalMarks: 100,
    passingMarks: 40,
    studentsEnrolled: 0,
  });

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockExams = [
        {
          _id: "1",
          title: "Mid-term Exam - Mathematics",
          className: "Mathematics 101",
          date: new Date(Date.now() + 86400000).toISOString(),
          startTime: "10:00 AM",
          endTime: "12:00 PM",
          duration: 120,
          room: "A-101",
          totalMarks: 100,
          passingMarks: 40,
          status: "upcoming",
          studentsEnrolled: 30,
        },
        {
          _id: "2",
          title: "Final Exam - Physics",
          className: "Physics 201",
          date: new Date(Date.now() + 86400000 * 7).toISOString(),
          startTime: "09:00 AM",
          endTime: "12:00 PM",
          duration: 180,
          room: "B-205",
          totalMarks: 100,
          passingMarks: 40,
          status: "upcoming",
          studentsEnrolled: 25,
        },
        {
          _id: "3",
          title: "Quiz - Chemistry",
          className: "Chemistry 301",
          date: new Date(Date.now() + 86400000 * 3).toISOString(),
          startTime: "11:00 AM",
          endTime: "12:00 PM",
          duration: 60,
          room: "C-102",
          totalMarks: 50,
          passingMarks: 20,
          status: "upcoming",
          studentsEnrolled: 28,
        },
        {
          _id: "4",
          title: "Mid-term Exam - Biology",
          className: "Biology 401",
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
          startTime: "10:00 AM",
          endTime: "12:00 PM",
          duration: 120,
          room: "D-303",
          totalMarks: 100,
          passingMarks: 40,
          status: "completed",
          studentsEnrolled: 22,
        },
      ];

      setExams(mockExams);
    } catch (error) {
      console.error("Error loading exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (date, status) => {
    if (status === "completed") {
      return <Badge className="bg-gray-500">Completed</Badge>;
    }

    const examDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return <Badge className="bg-red-500 animate-pulse">Today</Badge>;
    } else if (diffDays === 1) {
      return <Badge className="bg-orange-500">Tomorrow</Badge>;
    } else if (diffDays <= 7) {
      return <Badge className="bg-yellow-500">In {diffDays} days</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const filteredExams = exams.filter((exam) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return exam.status === "upcoming";
    if (filter === "past") return exam.status === "completed";
    return true;
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exams Management</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage exams
          </p>
        </div>
        <Button
          onClick={() => {
            setModalMode("create");
            setEditingId(null);
            setNewExam({
              title: "",
              className: "",
              date: new Date().toISOString().split("T")[0],
              startTime: "09:00",
              endTime: "10:00",
              duration: 60,
              room: "",
              totalMarks: 100,
              passingMarks: 40,
              studentsEnrolled: 0,
            });
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Exam
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Exams ({exams.length})
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming ({exams.filter((e) => e.status === "upcoming").length})
        </Button>
        <Button
          variant={filter === "past" ? "default" : "outline"}
          onClick={() => setFilter("past")}
        >
          Past ({exams.filter((e) => e.status === "completed").length})
        </Button>
      </div>

      {/* Exams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredExams.map((exam, index) => (
          <motion.div
            key={exam._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {getStatusBadge(exam.date, exam.status)}
              </div>

              {/* Exam Header */}
              <div className="mb-4 pr-24">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors mb-1">
                  {exam.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{exam.className}</span>
                </div>
              </div>

              {/* Exam Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(exam.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {exam.startTime} - {exam.endTime} ({exam.duration} mins)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>Room: {exam.room}</span>
                </div>
              </div>

              {/* Marks Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Marks
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {exam.totalMarks}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Passing</p>
                  <p className="text-xl font-bold text-green-600">
                    {exam.passingMarks}
                  </p>
                </div>
              </div>

              {/* Students */}
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{exam.studentsEnrolled} students enrolled</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setModalMode("edit");
                    setEditingId(exam._id);
                    setNewExam({
                      title: exam.title || "",
                      className: exam.className || "",
                      date: new Date(exam.date).toISOString().split("T")[0],
                      startTime: exam.startTime || "09:00",
                      endTime: exam.endTime || "10:00",
                      duration: exam.duration || 60,
                      room: exam.room || "",
                      totalMarks: exam.totalMarks || 100,
                      passingMarks: exam.passingMarks || 40,
                      studentsEnrolled: exam.studentsEnrolled || 0,
                    });
                    setShowModal(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Hover Effect */}
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary/60 w-0 group-hover:w-full transition-all duration-300" />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredExams.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">No exams found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "all" ? "Create your first exam" : `No ${filter} exams`}
          </p>
        </div>
      )}

      {/* Create/Edit Exam Modal (rendered outside conditional) */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
        }}
        title={"Create Exam"}
        size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowModal(false); setEditingId(null); }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // simple validation
                if (!newExam.title || !newExam.date) {
                  alert("Please provide exam title and date");
                  return;
                }

                if (modalMode === "create") {
                  const exam = {
                    _id: Date.now().toString(),
                    ...newExam,
                    status: new Date(newExam.date) < new Date() ? "completed" : "upcoming",
                  };
                  setExams((prev) => [exam, ...prev]);
                } else if (modalMode === "edit" && editingId) {
                  setExams((prev) => prev.map((e) => (e._id === editingId ? { ...e, ...newExam, status: new Date(newExam.date) < new Date() ? "completed" : "upcoming" } : e)));
                }

                setShowModal(false);
                setEditingId(null);
              }}
            >
              {modalMode === "create" ? "Create Exam" : "Save Changes"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={newExam.title}
              onChange={(e) => setNewExam((s) => ({ ...s, title: e.target.value }))}
              placeholder="Exam Title"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded"
                value={newExam.date}
                onChange={(e) => setNewExam((s) => ({ ...s, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Class / Subject</label>
              <input
                className="w-full px-3 py-2 border rounded"
                value={newExam.className}
                onChange={(e) => setNewExam((s) => ({ ...s, className: e.target.value }))}
                placeholder="e.g. Mathematics 101"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border rounded"
                value={newExam.startTime}
                onChange={(e) => setNewExam((s) => ({ ...s, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border rounded"
                value={newExam.endTime}
                onChange={(e) => setNewExam((s) => ({ ...s, endTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (mins)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded"
                value={newExam.duration}
                onChange={(e) => setNewExam((s) => ({ ...s, duration: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Total Marks</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded"
                value={newExam.totalMarks}
                onChange={(e) => setNewExam((s) => ({ ...s, totalMarks: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Passing Marks</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded"
                value={newExam.passingMarks}
                onChange={(e) => setNewExam((s) => ({ ...s, passingMarks: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room</label>
              <input
                className="w-full px-3 py-2 border rounded"
                value={newExam.room}
                onChange={(e) => setNewExam((s) => ({ ...s, room: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
