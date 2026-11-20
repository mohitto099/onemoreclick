/**
 * Notification System — Centralized notification management with queuing,
 * history, priorities, and reduced-motion support.
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';

// Notification types with default durations (ms)
export const NOTIFICATION_TYPES = {
  // Normal notifications - 5 seconds
  info: { duration: 5000, priority: 'normal', label: 'Info' },
  success: { duration: 5000, priority: 'normal', label: 'Success' },
  warning: { duration: 5000, priority: 'normal', label: 'Warning' },
  error: { duration: 5000, priority: 'normal', label: 'Error' },
  
  // Important messages - 7-10 seconds
  unlock: { duration: 7000, priority: 'high', label: 'Unlock' },
  discovery: { duration: 8000, priority: 'high', label: 'Discovery' },
  secret: { duration: 10000, priority: 'high', label: 'Secret' },
  achievement: { duration: 8000, priority: 'high', label: 'Achievement' },
  
  // Major milestones - persistent until dismissed
  milestone: { duration: 0, priority: 'critical', label: 'Milestone', persistent: true },
  game_complete: { duration: 0, priority: 'critical', label: 'Complete', persistent: true },
};

// Action types
const ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  DISMISS: 'DISMISS',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_HISTORY_LIMIT: 'SET_HISTORY_LIMIT',
};

// Initial state
const initialState = {
  queue: [],        // Currently visible notifications
  history: [],      // All past notifications
  historyLimit: 100,
  isProcessing: false,
};

// Reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD: {
      const notification = {
        ...action.payload,
        id: action.payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: Date.now(),
        dismissed: false,
        read: false,
      };
      
      // Add to queue (visible notifications)
      const newQueue = [...state.queue, notification];
      
      // Add to history
      const newHistory = [notification, ...state.history].slice(0, state.historyLimit);
      
      return {
        ...state,
        queue: newQueue,
        history: newHistory,
      };
    }
    
    case ACTIONS.REMOVE: {
      return {
        ...state,
        queue: state.queue.filter(n => n.id !== action.payload),
      };
    }
    
    case ACTIONS.DISMISS: {
      return {
        ...state,
        queue: state.queue.map(n => 
          n.id === action.payload ? { ...n, dismissed: true } : n
        ),
        history: state.history.map(n => 
          n.id === action.payload ? { ...n, dismissed: true, read: true } : n
        ),
      };
    }
    
    case ACTIONS.CLEAR_ALL: {
      return {
        ...state,
        queue: [],
      };
    }
    
    case ACTIONS.SET_HISTORY_LIMIT: {
      return {
        ...state,
        historyLimit: action.payload,
        history: state.history.slice(0, action.payload),
      };
    }
    
    default:
      return state;
  }
}

// Context
const NotificationContext = createContext(null);

// Provider component
export function NotificationProvider({ children, maxVisible = 5 }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const queueRef = useRef(state.queue);
  const timersRef = useRef(new Map());
  
  // Keep ref in sync
  queueRef.current = state.queue;
  
  // Auto-dismiss timer management
  useEffect(() => {
    // Clear timers for removed notifications
    const currentIds = new Set(state.queue.map(n => n.id));
    timersRef.current.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    });
    
    // Set up auto-dismiss for new notifications
    state.queue.forEach(notification => {
      if (!notification.persistent && !timersRef.current.has(notification.id)) {
        const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
        const duration = typeConfig.duration;
        
        if (duration > 0) {
          const timer = setTimeout(() => {
            dispatch({ type: ACTIONS.REMOVE, payload: notification.id });
            timersRef.current.delete(notification.id);
          }, duration);
          timersRef.current.set(notification.id, timer);
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [state.queue]);
  
  // Limit visible notifications
  useEffect(() => {
    if (state.queue.length > maxVisible) {
      const toRemove = state.queue.slice(0, state.queue.length - maxVisible);
      toRemove.forEach(n => dispatch({ type: ACTIONS.REMOVE, payload: n.id }));
    }
  }, [state.queue.length, maxVisible]);
  
  // Actions
  const addNotification = useCallback((notification) => {
    dispatch({ type: ACTIONS.ADD, payload: notification });
  }, []);
  
  const removeNotification = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE, payload: id });
  }, []);
  
  const dismissNotification = useCallback((id) => {
    dispatch({ type: ACTIONS.DISMISS, payload: id });
  }, []);
  
  const clearAll = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, []);
  
  const markAsRead = useCallback((id) => {
    dispatch({
      type: ACTIONS.DISMISS,
      payload: id,
    });
  }, []);
  
  // Convenience methods for different notification types
  const notify = useCallback((options) => {
    const {
      type = 'info',
      title,
      message,
      persistent = false,
      duration,
      onAction,
      actionLabel,
      ...rest
    } = options;
    
    const typeConfig = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    
    addNotification({
      type,
      title,
      message,
      persistent: persistent || typeConfig.persistent || false,
      duration: duration || typeConfig.duration,
      priority: typeConfig.priority,
      onAction,
      actionLabel,
      ...rest,
    });
  }, [addNotification]);
  
  // Specific notification helpers
  const showInfo = useCallback((title, message, options = {}) => 
    notify({ type: 'info', title, message, ...options }), [notify]);
  
  const showSuccess = useCallback((title, message, options = {}) => 
    notify({ type: 'success', title, message, ...options }), [notify]);
  
  const showWarning = useCallback((title, message, options = {}) => 
    notify({ type: 'warning', title, message, ...options }), [notify]);
  
  const showError = useCallback((title, message, options = {}) => 
    notify({ type: 'error', title, message, ...options }), [notify]);
  
  const showUnlock = useCallback((title, message, options = {}) => 
    notify({ type: 'unlock', title, message, ...options }), [notify]);
  
  const showDiscovery = useCallback((title, message, options = {}) => 
    notify({ type: 'discovery', title, message, ...options }), [notify]);
  
  const showSecret = useCallback((title, message, options = {}) => 
    notify({ type: 'secret', title, message, ...options }), [notify]);
  
  const showAchievement = useCallback((title, message, options = {}) => 
    notify({ type: 'achievement', title, message, ...options }), [notify]);
  
  const showMilestone = useCallback((title, message, options = {}) => 
    notify({ type: 'milestone', title, message, persistent: true, ...options }), [notify]);
  
  const showGameComplete = useCallback((title, message, options = {}) => 
    notify({ type: 'game_complete', title, message, persistent: true, ...options }), [notify]);
  
  // History actions
  const clearHistory = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, []);
  
  const getHistory = useCallback(() => state.history, [state.history]);
  
  const getUnreadCount = useCallback(() => 
    state.history.filter(n => !n.read).length, [state.history]);
  
  const value = {
    // State
    queue: state.queue,
    history: state.history,
    unreadCount: state.history.filter(n => !n.read).length,
    
    // Core actions
    addNotification,
    removeNotification,
    dismissNotification,
    clearAll,
    markAsRead,
    clearHistory,
    getHistory,
    getUnreadCount,
    
    // Typed notifications
    notify,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showUnlock,
    showDiscovery,
    showSecret,
    showAchievement,
    showMilestone,
    showGameComplete,
    
    // Config
    NOTIFICATION_TYPES,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return reducedMotion;
}

import { useState } from 'react';