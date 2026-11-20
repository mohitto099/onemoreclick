import { useState } from 'react';

/**
 * Achievement Centre Panel
 */
export function AchievementCentre({ achievements = [], unlocked = [], onClose }) {
  const [filter, setFilter] = useState('all');

  const categories = ['all', ...new Set(achievements.map(a => a.category))];

  const filteredAchievements = filter === 'all'
    ? achievements
    : achievements.filter(a => a.category === filter);

  const getIcon = (name) => {
    const icons = {
      'mouse-pointer-click': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>,
      'heart': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
      'target': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
      'arrow-right': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
      'zap': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
      'skull': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 1 0 8 8 8 8 0 0 0-8-8z"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><path d="M9 14a4 4 0 0 1 6 0"/></svg>,
      'bird': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3a5 5 0 0 1 2.74 9.33L7 21l-5-4V8a6 6 0 0 1 12 0v11l-4-5"/></svg>,
      'alert-triangle': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      'compass': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
      'key': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>,
      'timer': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      'hourglass': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2v6l6 6 6-6V2"/><path d="M6 22v-6l6-6 6 6v6"/></svg>,
      'ban': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
      'layout-grid': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
      'palette': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="18.5" cy="11.5" r="2.5"/><circle cx="8.5" cy="16.5" r="2.5"/><circle cx="3.5" cy="11.5" r="2.5"/><circle cx="6.5" cy="6.5" r="2.5"/></svg>,
    };
    return icons[name] || icons['help-circle'];
  };

  return (
    <div className="panel achievement-centre-panel" role="dialog" aria-label="Achievement Centre">
      <div className="panel-header">
        <h2 className="panel-title">Achievement Centre</h2>
        <div className="achievement-summary">
          <span>{unlocked.length} / {achievements.length} unlocked</span>
        </div>
        <button className="btn btn-ghost panel-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="panel-content">
        {/* Category filters */}
        <div className="achievement-filters" role="tablist">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-tab ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
              role="tab"
              aria-selected={filter === cat}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Achievement grid */}
        <div className="achievement-grid" role="list">
          {filteredAchievements.map(achievement => {
            const isUnlocked = unlocked.includes(achievement.id);
            return (
              <article
                key={achievement.id}
                className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                role="listitem"
              >
                <div className="achievement-icon">
                  {isUnlocked ? getIcon(achievement.icon) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="4" />
                      <line x1="6" y1="10" x2="18" y2="10" />
                    </svg>
                  )}
                </div>
                <h3 className="achievement-name">{isUnlocked ? achievement.name : '???'}</h3>
                <p className="achievement-description">
                  {isUnlocked ? achievement.description : 'Locked — discover how to unlock!'}
                </p>
                <div className="achievement-category">{achievement.category}</div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}