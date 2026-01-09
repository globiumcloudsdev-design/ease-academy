'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

// Notification Types
const NOTIFICATION_TYPES = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'general', label: 'ℹ️ General' },
  { value: 'assignment', label: '📝 Assignment' },
  { value: 'fee_reminder', label: '💰 Fee Reminder' },
  { value: 'event', label: '🎉 Event' },
  { value: 'holiday', label: '🏖️ Holiday' },
];

export default function BranchAdminNotification() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // ✅ Branch Admin ko Branch select krne ki zaroorat nahi
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    targetRole: 'student', 
    // targetBranch: 'auto' // Backend khud handle karega
  });

  const getCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      let token = getCookie('token') || getCookie('accessToken');
      if (!token) token = localStorage.getItem('token') || localStorage.getItem('accessToken');

      if (!token) {
        setStatus({ type: 'error', message: 'Auth Token Missing' });
        return;
      }

      // ✅ API Wahi same rahegi
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.SEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: `✅ Sent to Branch! (${data.message})` });
        setFormData({
          title: '',
          message: '',
          type: 'announcement',
          targetRole: 'student',
        });
      } else {
        setStatus({ type: 'error', message: `❌ Error: ${data.message}` });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: '❌ Server Error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🏫 Branch Notification
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          This notification will be sent only to users in <b>Your Branch</b>.
        </p>
      </div>

      {status.message && (
        <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${
          status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {status.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Target Role */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Send To</label>
                <div className="relative">
                  <select
                    name="targetRole"
                    value={formData.targetRole}
                    onChange={handleChange}
                    className="w-full p-3 pl-4 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="student">👨‍🎓 Students</option>
                    <option value="parent">👨‍👩‍👦 Parents</option>
                    <option value="teacher">👩‍🏫 Teachers</option>
                    <option value="staff">💼 Staff</option>
                  </select>
                </div>
              </div>

              {/* Notification Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {NOTIFICATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Branch Meeting"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
              <textarea
                name="message"
                required
                rows="5"
                placeholder="Type message for your branch..."
                value={formData.message}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button type="submit" disabled={loading} className={`px-8 py-3 text-white text-sm font-bold rounded-lg shadow-md ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {loading ? 'Sending...' : '🚀 Send to My Branch'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}