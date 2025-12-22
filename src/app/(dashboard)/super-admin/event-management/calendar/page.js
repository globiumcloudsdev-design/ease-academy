'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import API_ENDPOINTS from '@/constants/api-endpoints';
import BranchSelect from '@/components/ui/branch-select';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import ButtonLoader from '@/components/ui/button-loader';
import FullPageLoader from '@/components/ui/full-page-loader';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';

export default function CalendarViewPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'academic',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    branchId: '',
    allDay: false,
    status: 'scheduled',
  });

  useEffect(() => {
    fetchEvents();
    fetchBranches();
  }, [currentDate, selectedBranch]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const paramsObj = {
        limit: 500,
        ...(selectedBranch && { branchId: selectedBranch }),
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EVENTS.LIST, { params: paramsObj });
      
      if (response.success) {
        // Normalise backend wrapper shapes: { data: { events } } or { events } or array
        const payload = response.data || response.data?.events || response.data?.data || response;
        if (payload.events) setEvents(payload.events);
        else if (Array.isArray(payload)) setEvents(payload);
        else if (payload.data && Array.isArray(payload.data.events)) setEvents(payload.data.events);
        else setEvents(payload);
      }
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { params: { limit: 100 } });
      if (response.success) setBranches(response.data.branches);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  }; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, branchId: formData.branchId || null };
      payload.createdBy = user?._id || user?.id || null;

      const response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.EVENTS.CREATE, payload);
      
      if (response.success) {
        toast.success('Event created successfully');
        fetchEvents();
        handleCloseModal();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create event');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedDate(null);
    setFormData({
      title: '',
      description: '',
      eventType: 'academic',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      branchId: '',
      allDay: false,
      status: 'scheduled',
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: format(date, 'yyyy-MM-dd'),
    });
    setShowEventModal(true);
  };

  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!Array.isArray(events)) return [];
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventStart.toDateString() === date.toDateString() || 
             (eventStart <= date && date <= eventEnd);
    });
  };

  const eventTypes = {
    academic: 'bg-blue-100 text-blue-800',
    holiday: 'bg-red-100 text-red-800',
    exam: 'bg-purple-100 text-purple-800',
    meeting: 'bg-yellow-100 text-yellow-800',
    sports: 'bg-green-100 text-green-800',
    cultural: 'bg-pink-100 text-pink-800',
    workshop: 'bg-indigo-100 text-indigo-800',
    seminar: 'bg-cyan-100 text-cyan-800',
    parent_teacher: 'bg-orange-100 text-orange-800',
    celebration: 'bg-rose-100 text-rose-800',
    other: 'bg-gray-100 text-gray-800',
  };

  if (loading) return <FullPageLoader message="Loading events..." />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="h-7 w-7" />
          Event Calendar
        </h1>
        <p className="text-gray-600 mt-1">View and manage events</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-bold text-gray-900 w-40 text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-4"
          >
            Today
          </button>
        </div>

        <div className="flex gap-4">
          <BranchSelect
            id="calendar-branch"
            name="branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            branches={branches}
            placeholder="All Branches"
            className="px-0"
          />

          <Button onClick={() => setShowEventModal(true)} className="px-4 py-2 flex items-center gap-2"><Plus className="h-5 w-5" />Add Event</Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-0 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0">
          {daysInMonth.map((date, index) => {
            const dateEvents = getEventsForDate(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isTodayDate = isToday(date);

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`min-h-32 p-2 border border-gray-200 cursor-pointer transition-colors hover:bg-blue-50 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${isTodayDate ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(date, 'd')}
                </div>
                
                {/* Events */}
                <div className="space-y-1">
                  {dateEvents.slice(0, 2).map((event) => (
                    <div
                      key={event._id}
                      className={`text-xs p-1 rounded truncate ${eventTypes[event.eventType] || eventTypes.other}`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dateEvents.length > 2 && (
                    <div className="text-xs text-gray-600 px-1">
                      +{dateEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Panel */}
      {selectedDate && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Events on {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          
          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-600">No events on this date</p>
          ) : (
            <div className="space-y-4">
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event._id} className={`p-4 rounded-lg border-l-4 ${
                  eventTypes[event.eventType] ? 'border-' + eventTypes[event.eventType].split(' ')[0].replace('bg-', '') : ''
                } bg-gray-50`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
                      <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${eventTypes[event.eventType]}`}>
                        {event.eventType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.status === 'completed' ? 'bg-green-100 text-green-800' :
                      event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                  )}
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    {!event.allDay && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {event.startTime} {event.endTime && `- ${event.endTime}`}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event Modal */}
      <Modal open={showEventModal} onClose={handleCloseModal} title="Add New Event" size="lg" closeOnBackdrop>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Event Title *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Event title" />
            </div>

            <div className="md:col-span-2">
              <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" />
            </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                  <Dropdown
                    name="eventType"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    options={[
                      { label: 'Academic', value: 'academic' },
                      { label: 'Holiday', value: 'holiday' },
                      { label: 'Exam', value: 'exam' },
                      { label: 'Meeting', value: 'meeting' },
                      { label: 'Sports', value: 'sports' },
                      { label: 'Cultural', value: 'cultural' },
                      { label: 'Workshop', value: 'workshop' },
                      { label: 'Seminar', value: 'seminar' },
                      { label: 'Parent-Teacher', value: 'parent_teacher' },
                      { label: 'Celebration', value: 'celebration' },
                      { label: 'Other', value: 'other' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                  <BranchSelect id="calendar-modal-branch" name="branch" required value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} branches={branches} placeholder="Select Branch" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <input
                      type="checkbox"
                      checked={formData.allDay}
                      onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                      className="mr-2"
                    />
                    All Day Event
                  </label>
                </div>

                {!formData.allDay && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <Input label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Location (optional)" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Dropdown
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                      { label: 'Scheduled', value: 'scheduled' },
                      { label: 'Ongoing', value: 'ongoing' },
                      { label: 'Completed', value: 'completed' },
                      { label: 'Cancelled', value: 'cancelled' },
                      { label: 'Postponed', value: 'postponed' },
                    ]}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <ButtonLoader /> : 'Create Event'}</Button>
              </div>
            </form>
          </Modal>
    </div>
  );
}
