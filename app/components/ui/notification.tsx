import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Define notification types
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Define notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

// Create context for notifications
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Helper functions to add specific notification types
export const useNotifications = () => {
  const { addNotification } = useNotification();

  const success = useCallback((message: string, title?: string, duration = 5000) => {
    addNotification({ type: 'success', message, title, duration });
  }, [addNotification]);

  const error = useCallback((message: string, title?: string, duration = 5000) => {
    addNotification({ type: 'error', message, title, duration });
  }, [addNotification]);

  const info = useCallback((message: string, title?: string, duration = 5000) => {
    addNotification({ type: 'info', message, title, duration });
  }, [addNotification]);

  const warning = useCallback((message: string, title?: string, duration = 5000) => {
    addNotification({ type: 'warning', message, title, duration });
  }, [addNotification]);

  return { success, error, info, warning };
};

// Container component to display notifications
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem 
            key={notification.id} 
            notification={notification} 
            onClose={() => removeNotification(notification.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Individual notification item
const NotificationItem: React.FC<{ 
  notification: Notification; 
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const { id, type, title, message, duration = 5000 } = notification;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-emerald-500" size={16} strokeWidth={2} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={16} strokeWidth={2} />;
      case 'info':
        return <Info className="text-blue-500" size={16} strokeWidth={2} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={16} strokeWidth={2} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Alert
        variant={type}
        size="lg"
        isNotification={true}
        icon={getIcon()}
        action={
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X size={14} />
          </Button>
        }
        layout="complex"
        className="min-w-[300px]"
      >
        {title && <div className="font-medium">{title}</div>}
        <div className={title ? "text-sm text-muted-foreground" : ""}>{message}</div>
      </Alert>
    </motion.div>
  );
};
