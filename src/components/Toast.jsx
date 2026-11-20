import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from '../systems/NotificationSystem';

/**
 * Toast Notification Container - manages queue display
 */
export function ToastContainer({ 
  notifications = [], 
  onDismiss,
  maxVisible = 5,
  position = 'bottom-right'
}) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  const positionClasses = {
    'top-left': 'toast-top-left',
    'top-right': 'toast-top-right',
    'bottom-left': 'toast-bottom-left',
    'bottom-right': 'toast-bottom-right',
    'top-center': 'toast-top-center',
    'bottom-center': 'toast-bottom-center',
  };
  
  return (
    <div 
      ref={containerRef}
      className={`toast-container ${positionClasses[position] || positionClasses['bottom-right']}`}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {notifications.map((notification, index) => (
        <Toast
          key={notification.id}
          notification={notification}
          index={index}
          total={notifications.length}
          onDismiss={onDismiss}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}

/**
 * Individual Toast Notification
 */
function Toast({ 
  notification, 
  index, 
  total, 
  onDismiss, 
  reducedMotion 
}) {
  const toastRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dismissTimerRef = useRef(null);
  
  // Get type config
  const typeConfig = {
    info: { icon: 'info', color: 'var(--color-accent-cyan)', label: 'Info' },
    success: { icon: 'success', color: 'var(--color-accent-green)', label: 'Success' },
    warning: { icon: 'warning', color: 'var(--color-accent-orange)', label: 'Warning' },
    error: { icon: 'error', color: 'var(--color-button-primary)', label: 'Error' },
    unlock: { icon: 'unlock', color: 'var(--color-button-primary)', label: 'Unlocked!' },
    discovery: { icon: 'discovery', color: 'var(--color-accent-cyan)', label: 'Discovery!' },
    secret: { icon: 'secret', color: 'var(--color-accent-purple)', label: 'Secret!' },
    achievement: { icon: 'achievement', color: 'var(--color-button-secondary)', label: 'Achievement!' },
    milestone: { icon: 'milestone', color: 'var(--color-button-primary)', label: 'MILESTONE' },
    game_complete: { icon: 'game_complete', color: 'var(--color-accent-green)', label: 'COMPLETE!' },
  };
  
  const config = typeConfig[notification.type] || typeConfig.info;
  const isPersistent = notification.persistent || notification.duration === 0;
  const duration = isPersistent ? 0 : (notification.duration || 5000);
  
  // Icons
  const icons = {
    info: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    success: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    warning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    error: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    unlock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    discovery: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 16 16 0 0 1-4 10 15.3 15.3 0 0 1-4-10 16 16 0 0 1 4-10z"/></svg>,
    secret: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    achievement: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M7 13l4 4 8-8"/></svg>,
    milestone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    game_complete: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  };
  
  const Icon = icons[notification.type] || icons.info;
  
  // Entrance animation
  useEffect(() => {
    if (toastRef.current && !reducedMotion) {
      gsap.from(toastRef.current, {
        x: 400,
        opacity: 0,
        duration: 0.4,
        ease: 'back.out(1.7)',
        delay: index * 0.08,
      });
    } else if (toastRef.current) {
      gsap.from(toastRef.current, {
        opacity: 0,
        duration: 0.1,
        delay: index * 0.02,
      });
    }
  }, [index, reducedMotion]);
  
  // Auto-dismiss timer (only for non-persistent)
  useEffect(() => {
    if (isPersistent || isExiting) return;
    
    dismissTimerRef.current = setTimeout(() => {
      dismiss();
    }, duration);
    
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [duration, isPersistent, isExiting]);
  
  // Pause timer on hover
  useEffect(() => {
    if (isHovered && !isPersistent && !isExiting && dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    } else if (!isHovered && !isPersistent && !isExiting && !dismissTimerRef.current) {
      dismissTimerRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    }
  }, [isHovered, isPersistent, isExiting, duration]);
  
  const dismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    
    if (toastRef.current) {
      const exitDuration = reducedMotion ? 0.1 : 0.3;
      gsap.to(toastRef.current, {
        x: 400,
        opacity: 0,
        duration: exitDuration,
        ease: reducedMotion ? 'none' : 'power2.in',
        onComplete: () => {
          onDismiss?.(notification.id);
        },
      });
    } else {
      onDismiss?.(notification.id);
    }
  };
  
  const handleAction = () => {
    if (notification.onAction) {
      notification.onAction();
    }
    if (notification.dismissOnAction !== false) {
      dismiss();
    }
  };
  
  // Calculate stack offset for 3D effect
  const stackOffset = Math.min(index, 4) * 8;
  const stackRotation = Math.min(index, 4) * -1;
  
  return (
    <div
      ref={toastRef}
      className={`toast toast-${notification.type} ${isPersistent ? 'toast-persistent' : ''} ${isExiting ? 'toast-exiting' : ''}`}
      role="alert"
      aria-live={notification.priority === 'critical' ? 'assertive' : 'polite'}
      style={{
        transform: `translateY(${stackOffset}px) rotate(${stackRotation}deg)`,
        zIndex: total - index,
        '--toast-accent': config.color,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="toast-accent-bar" style={{ backgroundColor: config.color }} />
      
      <div className="toast-icon" style={{ color: config.color }}>
        {Icon}
      </div>
      
      <div className="toast-content">
        <div className="toast-header">
          <span className="toast-type-badge" style={{ backgroundColor: config.color }}>
            {config.label}
          </span>
          <div className="toast-title">{notification.title}</div>
        </div>
        {notification.message && (
          <div className="toast-message">{notification.message}</div>
        )}
        {notification.actionLabel && (
          <button 
            className="toast-action-btn"
            onClick={handleAction}
            style={{ borderColor: config.color, color: config.color }}
          >
            {notification.actionLabel}
          </button>
        )}
      </div>
      
      {!isPersistent && (
        <div className="toast-progress-container">
          <div 
            className="toast-progress-bar"
            style={{ 
              backgroundColor: config.color,
              animationDuration: isPersistent ? '0s' : `${duration}ms`,
              animationPlayState: isHovered ? 'paused' : 'running',
            }}
          />
        </div>
      )}
      
      <button 
        className="toast-close"
        onClick={dismiss}
        aria-label="Dismiss notification"
        style={{ color: config.color }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Achievement Notification - Special full-width banner
 */
export function AchievementNotification({ 
  achievement, 
  onDismiss,
  reducedMotion 
}) {
  const containerRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    if (containerRef.current && !reducedMotion) {
      gsap.from(containerRef.current, {
        y: -100,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
      });
    } else if (containerRef.current) {
      gsap.from(containerRef.current, {
        opacity: 0,
        duration: 0.2,
      });
    }
    
    // Auto-dismiss after 8 seconds for achievements
    const timer = setTimeout(() => {
      dismiss();
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [achievement.id, reducedMotion]);
  
  const dismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    
    if (containerRef.current) {
      const exitDuration = reducedMotion ? 0.1 : 0.4;
      gsap.to(containerRef.current, {
        y: -100,
        opacity: 0,
        duration: exitDuration,
        ease: reducedMotion ? 'none' : 'power2.in',
        onComplete: () => onDismiss?.(achievement.id),
      });
    } else {
      onDismiss?.(achievement.id);
    }
  };
  
  const icons = {
    'mouse-pointer-click': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>,
    'heart': <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    'target': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    'arrow-right': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    'zap': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    'skull': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 1 0 8 8 8 8 0 0 0-8-8z"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><path d="M9 14a4 4 0 0 1 6 0"/></svg>,
    'bird': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3a5 5 0 0 1 2.74 9.33L7 21l-5-4V8a6 6 0 0 1 12 0v11l-4-5"/></svg>,
    'alert-triangle': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    'compass': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
    'key': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>,
    'timer': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    'hourglass': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2v6l6 6 6-6V2"/><path d="M6 22v-6l6-6 6 6v6"/></svg>,
    'ban': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    'layout-grid': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    'palette': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="18.5" cy="11.5" r="2.5"/><circle cx="8.5" cy="16.5" r="2.5"/><circle cx="3.5" cy="11.5" r="2.5"/><circle cx="6.5" cy="6.5" r="2.5"/></svg>,
  };
  
  const Icon = icons[achievement.icon] || icons['mouse-pointer-click'];
  
  return (
    <div
      ref={containerRef}
      className={`achievement-notification ${isExiting ? 'exiting' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="achievement-glow" />
      <div className="achievement-icon-bg">
        {Icon}
      </div>
      <div className="achievement-content">
        <div className="achievement-label">🏆 Achievement Unlocked!</div>
        <h3 className="achievement-name">{achievement.name}</h3>
        <p className="achievement-description">{achievement.description}</p>
      </div>
      <button 
        className="achievement-dismiss"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}