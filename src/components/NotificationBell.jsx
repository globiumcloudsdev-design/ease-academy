'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react'; 
import { useAuth } from '@/hooks/useAuth'; 
// import { API_ENDPOINTS } from '@/constants/api-endpoints';


export default function NotificationBell() {
  const { user } = useAuth(); // ✅ User data seedha Context se liya (No LocalStorage needed for user)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotis = async () => {
    // Agar user load nahi hua ya login nahi hai, to return ho jao
    if (!user || !user._id) {
        // Fallback: Agar context me id na ho (rare case), to id dhundo
        // user.id ya user._id dono check kar rahe hain
        return;
    }

    const userId = user._id || user.id;
    
    // Token hum localStorage se utha lenge (Kyunki Login ne 'accessToken' save kiya tha)
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    try {
      const res = await fetch(`/api/notifications/web-notifications?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error("Notification Fetch Error:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      // Optimistically update UI
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));

      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error('Mark read failed', err);
    }
  };

  // ✅ Dependency Array me 'user' daal diya
  // Jaise hi Login complete hoga aur 'user' milega, ye fetch karega
  useEffect(() => {
    if (user) {
      fetchNotis();
      
      // Polling: Har 15 second me refresh
      const interval = setInterval(fetchNotis, 15000);
      return () => clearInterval(interval);
    }
  }, [user]); // <-- Jab user change hoga tab chalega

  // Click outside logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 🔔 Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        
        {/* Red Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
          </span>
        )}
      </button>

      {/* 📜 Dropdown List */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-sm text-gray-700">Notifications</h3>
            <button className="text-xs text-blue-600 hover:underline" onClick={fetchNotis}>Refresh</button>
          </div>

          <div className="max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                <Bell className="h-8 w-8 text-gray-300 mb-2" />
                No new notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={async () => {
                    // If there's a link, navigate. Otherwise open modal detail view.
                    if (n.link) {
                      if (!n.isRead) await markAsRead(n._id);
                      setIsOpen(false);
                      router.push(n.link);
                      return;
                    }
                    if (!n.isRead) await markAsRead(n._id);
                    setSelectedNotification(n);
                    setIsOpen(false);
                  }}
                  className={`p-3 border-b hover:bg-gray-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider 
                      ${n.type === 'announcement' ? 'bg-purple-100 text-purple-700' : 
                        n.type === 'fee_reminder' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {n.type?.replace('_', ' ') || 'General'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-800 leading-tight mb-1">{n.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t bg-gray-50 text-center">
            <button className="text-xs font-medium text-blue-600 hover:text-blue-800 transition">
              View All History
            </button>
          </div>
        </div>
      )}

      {/* Modal: Notification Detail */}
      {selectedNotification && (
        <div className="fixed inset-0 z-60 flex items-center justify-center" aria-hidden="false">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedNotification(null)} />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-title"
            className="relative w-full max-w-lg mx-4 transform transition-all duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/5">
              <div className="flex items-start gap-4 p-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                    <Bell className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 id="notif-title" className="text-lg font-semibold text-gray-900 truncate">{selectedNotification.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 truncate">{selectedNotification.type?.replace('_', ' ') || 'General'} • {new Date(selectedNotification.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-start">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    aria-label="Close notification"
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                  </button>
                </div>
              </div>

              <div className="px-5 pb-4">
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">{selectedNotification.message}</div>
              </div>

              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!selectedNotification.isRead && (
                    <button
                      onClick={async (e) => { e.stopPropagation(); await markAsRead(selectedNotification._id); setSelectedNotification({ ...selectedNotification, isRead: true }); }}
                      className="text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
                      Mark as read
                    </button>
                  )}
                  {selectedNotification.link && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedNotification(null); router.push(selectedNotification.link); }}
                      className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Open link
                    </button>
                  )}
                </div>

                <div>
                  <button onClick={() => setSelectedNotification(null)} className="text-sm text-gray-600 hover:text-gray-800">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}