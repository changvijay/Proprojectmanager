
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationType } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationContextType {
  addNotification: (message: string, type?: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: NotificationType = 'info', duration = 5000) => {
    const id = crypto.randomUUID();
    const newNotification: Notification = { id, message, type, duration };
    
    setNotifications((prev) => [...prev, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              pointer-events-auto transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-full fade-in
              flex items-start p-4 rounded-lg shadow-lg border-l-4
              ${notification.type === 'success' ? 'bg-white border-green-500 text-gray-800' : ''}
              ${notification.type === 'error' ? 'bg-white border-red-500 text-gray-800' : ''}
              ${notification.type === 'warning' ? 'bg-white border-amber-500 text-gray-800' : ''}
              ${notification.type === 'info' ? 'bg-white border-blue-500 text-gray-800' : ''}
            `}
          >
            <div className="flex-shrink-0 mr-3">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="flex-1 text-sm font-medium">{notification.message}</div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
