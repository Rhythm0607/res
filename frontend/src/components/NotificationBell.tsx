import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Clock, AlertCircle, FileText, User } from 'lucide-react';
import { notificationService, NotificationResponse } from '../services/notificationService';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleNotificationClick = (notification: NotificationResponse) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'job': return <FileText size={16} />;
      case 'candidate': return <User size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getColorClass = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-background text-muted';
    switch(type) {
      case 'job': return 'bg-primary/10 text-primary';
      case 'candidate': return 'bg-success/15 text-success';
      default: return 'bg-warning/15 text-warning';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl transition-colors"
        style={{ color: '#333F3C', backgroundColor: isOpen ? '#EBEDE8' : 'transparent' }}
        onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = '#EBEDE8' }}
        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ backgroundColor: '#dc2626', border: '2px solid white' }}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="font-bold text-text text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-96">
              {isLoading ? (
                <div className="p-8 text-center text-muted flex justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center text-muted mb-3">
                    <CheckCircle size={24} />
                  </div>
                  <p className="text-sm font-bold text-text">You're all caught up!</p>
                  <p className="text-xs text-muted mt-1">No new notifications</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b border-border last:border-b-0 cursor-pointer transition-colors flex gap-3 ${
                        notification.is_read ? 'hover:bg-background/40' : 'bg-primary/5 hover:bg-primary/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getColorClass(notification.type, notification.is_read)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${notification.is_read ? 'text-text' : 'text-text'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-muted uppercase tracking-wider">
                          <Clock size={10} />
                          {new Date(notification.created_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0 pt-1">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 bg-background/50 border-t border-border text-center">
                <button className="text-[11px] font-bold text-muted hover:text-primary transition-colors">
                  View Notification Settings
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
