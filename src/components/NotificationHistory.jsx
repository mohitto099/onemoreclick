import { useState, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from '../systems/NotificationSystem';
import { useNotifications } from '../systems/NotificationSystem';

/**
 * Notification History Panel - Shows all past notifications
 */
export function NotificationHistory({ onClose, isOpen }) {
  const { history, getUnreadCount, markAsRead, clearHistory } = useNotifications();
  const reducedMotion = useReducedMotion();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const panelRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation on open/close
  useEffect(() => {
    if (panelRef.current) {
      setIsAnimating(true);
      if (isOpen) {
        gsap.from(panelRef.current, {
          x: 400,
          opacity: 0,
          duration: reducedMotion ? 0.1 : 0.4,
          ease: 'back.out(1.7)',
          onComplete: () => setIsAnimating(false),
        });
      } else if (!reducedMotion) {
        gsap.to(panelRef.current, {
          x: 400,
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => setIsAnimating(false),
        });
      }
    }
  }, [isOpen, reducedMotion]);
  
  // Filter notifications
  const filteredHistory = useMemo(() => {
    let result = history;
    
    if (filter !== 'all') {
      result = result.filter(n => n.type === filter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [history, filter, searchQuery]);
  
  // Group by date
  const groupedHistory = useMemo(() => {
    const groups = {};
    filteredHistory.forEach(notification => {
      const date = new Date(notification.timestamp);
      const dateKey = date.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });
    return groups;
  }, [filteredHistory]);
  
  // Types for filter
  const availableTypes = useMemo(() => {
    const types = new Set(history.map(n => n.type));
    return ['all', ...Array.from(types)];
  }, [history]);
  
  const getTypeConfig = (type) => {
    const configs = {
      info: { label: 'Info', color: 'var(--color-accent-cyan)' },
      success: { label: 'Success', color: 'var(--color-accent-green)' },
      warning: { label: 'Warning', color: 'var(--color-accent-orange)' },
      error: { label: 'Error', color: 'var(--color-button-primary)' },
      unlock: { label: 'Unlock', color: 'var(--color-button-primary)' },
      discovery: { label: 'Discovery', color: 'var(--color-accent-cyan)' },
      secret: { label: 'Secret', color: 'var(--color-accent-purple)' },
      achievement: { label: 'Achievement', color: 'var(--color-button-secondary)' },
      milestone: { label: 'Milestone', color: 'var(--color-button-primary)' },
      game_complete: { label: 'Complete', color: 'var(--color-accent-green)' },
    };
    return configs[type] || configs.info;
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };
  
  const icons = {
    info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    error: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    unlock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    discovery: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 16 16 0 0 1-4 10 15.3 15.3 0 0 1-4-10 16 16 0 0 1 4-10z"/></svg>,
    secret: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    achievement: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M7 13l4 4 8-8"/></svg>,
    milestone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    game_complete: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  };
  
  if (!isOpen && !isAnimating) return null;
  
  return (
    <div 
      ref={panelRef}
      className={`notification-history-panel ${isOpen ? 'open' : ''} ${isAnimating ? 'animating' : ''}`}
      role="dialog"
      aria-label="Notification History"
    >
      <div className="history-header">
        <div className="history-title-section">
          <h2 className="history-title">Notification History</h2>
          <span className="history-count">{history.length} total</span>
        </div>
        <div className="history-actions">
          <button 
            className="btn btn-ghost history-filter-btn"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
          >
            All
          </button>
          <button 
            className="btn btn-ghost history-filter-btn"
            onClick={() => setFilter('unread')}
            aria-pressed={filter === 'unread'}
          >
            Unread ({getUnreadCount()})
          </button>
          {availableTypes.filter(t => t !== 'all' && t !== 'unread').map(type => (
            <button
              key={type}
              className="btn btn-ghost history-filter-btn"
              onClick={() => setFilter(type)}
              aria-pressed={filter === type}
              style={{ borderColor: getTypeConfig(type).color }}
            >
              {getTypeConfig(type).label}
            </button>
          ))}
          <button 
            className="btn btn-ghost history-clear-btn"
            onClick={clearHistory}
            disabled={history.length === 0}
          >
            Clear All
          </button>
          <button 
            className="btn btn-ghost history-close-btn"
            onClick={onClose}
            aria-label="Close history"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="history-search">
        <input
          type="search"
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="history-search-input"
          aria-label="Search notifications"
        />
      </div>
      
      <div className="history-content">
        {Object.keys(groupedHistory).length === 0 ? (
          <div className="history-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p>No notifications found</p>
            {searchQuery && <p className="history-empty-hint">Try adjusting your search</p>}
          </div>
        ) : (
          <div className="history-list">
            {Object.entries(groupedHistory).map(([date, notifications]) => (
              <div key={date} className="history-date-group">
                <div className="history-date-header">{date}</div>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`history-item ${notification.read ? 'read' : 'unread'} history-type-${notification.type}`}
                    style={{ '--notification-color': getTypeConfig(notification.type).color }}
                  >
                    <div className="history-item-icon" style={{ color: getTypeConfig(notification.type).color }}>
                      {icons[notification.type] || icons.info}
                    </div>
                    <div className="history-item-content">
                      <div className="history-item-header">
                        <span className="history-item-type" style={{ backgroundColor: getTypeConfig(notification.type).color }}>
                          {getTypeConfig(notification.type).label}
                        </span>
                        <span className="history-item-time">{formatTime(notification.timestamp)}</span>
                      </div>
                      <div className="history-item-title">{notification.title}</div>
                      {notification.message && (
                        <div className="history-item-message">{notification.message}</div>
                      )}
                    </div>
                    {!notification.read && (
                      <button
                        className="history-mark-read"
                        onClick={() => markAsRead(notification.id)}
                        aria-label="Mark as read"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useRef } from 'react';