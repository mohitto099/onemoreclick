import { useState } from 'react';

/**
 * Button Collection Panel
 */
export function ButtonCollection({ buttons = [], onClose, onSelectButton }) {
  const allButtons = [
    { id: 'main', name: 'Main Button', description: 'The original button. Simple, elegant, clickable.', icon: 'mouse-pointer-click' },
    { id: 'button_2', name: 'Second Button', description: 'A faithful companion. Unlocked at 10 clicks.', icon: 'plus-circle' },
    { id: 'button_3', name: 'Third Button', description: 'Three\'s a crowd. Unlocked at 50 clicks.', icon: 'layout-grid' },
    { id: 'button_4', name: 'Chaos Button', description: 'Unpredictable. Unlocked at 100 clicks.', icon: 'zap' },
    { id: 'button_5', name: 'Mystery Button', description: 'Who knows what it does?', icon: 'help-circle' },
    { id: 'forbidden', name: 'Forbidden Button', description: 'Pulsates with dark energy. Unlocked at 250 clicks.', icon: 'alert-triangle' },
    { id: 'ultimate', name: 'The Ultimate Button', description: 'The final button. Unlocked at 1000 clicks.', icon: 'crown' },
  ];

  return (
    <div className="panel button-collection-panel" role="dialog" aria-label="Button Collection">
      <div className="panel-header">
        <h2 className="panel-title">Button Collection</h2>
        <button className="btn btn-ghost panel-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="panel-content">
        <p className="panel-description">Discovered buttons appear here. Click to learn more.</p>

        <div className="button-grid" role="list">
          {allButtons.map(btn => {
            const discovered = buttons.includes(btn.id);
            return (
              <article
                key={btn.id}
                className={`button-card ${discovered ? 'discovered' : 'locked'}`}
                role="listitem"
              >
                <div className="button-card-icon">
                  {discovered ? (
                    <Icon name={btn.icon} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="4" />
                      <line x1="6" y1="10" x2="18" y2="10" />
                    </svg>
                  )}
                </div>
                <h3 className="button-card-name">{discovered ? btn.name : '???'}</h3>
                <p className="button-card-description">
                  {discovered ? btn.description : 'Locked — keep clicking to unlock!'}
                </p>
                <div className="button-card-status">
                  {discovered ? (
                    <span className="status-badge unlocked">Discovered</span>
                  ) : (
                    <span className="status-badge locked">Locked</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple icon component
 */
function Icon({ name }) {
  const icons = {
    'mouse-pointer-click': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>,
    'plus-circle': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    'layout-grid': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    'zap': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    'help-circle': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    'alert-triangle': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    'crown': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  };
  return icons[name] || icons['help-circle'];
}

import React from 'react';