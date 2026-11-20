import { useState, useEffect } from 'react';

/**
 * Settings Panel
 */
export function SettingsPanel({
  onClose,
  theme,
  themes,
  setTheme,
  isThemeUnlocked,
  soundEnabled,
  volume,
  toggleSound,
  setVolume,
  onReset,
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="panel settings-panel" role="dialog" aria-label="Settings">
      <div className="panel-header">
        <h2 className="panel-title">Settings</h2>
        <button className="btn btn-ghost panel-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="panel-content">
        {/* Audio Section */}
        <section className="settings-section">
          <h3 className="settings-section-title">Audio</h3>
          <div className="settings-row">
            <label className="settings-label">
              <span>Sound Effects</span>
              <button
                className={`btn ${soundEnabled ? 'btn-secondary' : 'btn-ghost'} toggle-btn`}
                onClick={toggleSound}
                aria-pressed={soundEnabled}
              >
                {soundEnabled ? 'ON' : 'OFF'}
              </button>
            </label>
          </div>
          {soundEnabled && (
            <div className="settings-row">
              <label className="settings-label">
                <span>Volume: {Math.round(volume * 100)}%</span>
                <input
                  type="range"
                  className="volume-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  aria-label="Volume"
                />
              </label>
            </div>
          )}
        </section>

        {/* Theme Section */}
        <section className="settings-section">
          <h3 className="settings-section-title">Theme</h3>
          <p className="settings-section-description">Change the visual style of the experience.</p>
          <div className="theme-options">
            {themes.map(t => (
              <button
                key={t.id}
                className={`theme-option ${theme === t.id ? 'active' : ''} ${!isThemeUnlocked(t.id) && t.id !== 'default' ? 'locked' : ''}`}
                onClick={() => isThemeUnlocked(t.id) && setTheme(t.id)}
                disabled={!isThemeUnlocked(t.id) && t.id !== 'default'}
                aria-pressed={theme === t.id}
              >
                <div className={`theme-option-preview ${t.preview}`} />
                <div className="theme-option-info">
                  <div className="theme-option-name">{t.name}</div>
                  <div className="theme-option-desc">
                    {!isThemeUnlocked(t.id) && t.id !== 'default' ? 'Locked — reach milestone to unlock' : theme === t.id ? 'Active' : 'Click to apply'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Accessibility Section */}
        <section className="settings-section">
          <h3 className="settings-section-title">Accessibility</h3>
          <div className="settings-row">
            <label className="settings-label">
              <span>Reduce Motion</span>
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={window.matchMedia('(prefers-reduced-motion: reduce)').matches}
                onChange={(e) => document.documentElement.classList.toggle('reduce-motion', e.target.checked)}
              />
            </label>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-section danger-zone">
          <h3 className="settings-section-title">Danger Zone</h3>
          <p className="settings-section-description">These actions cannot be undone.</p>

          {showResetConfirm ? (
            <div className="reset-confirmation">
              <p>Are you sure? This will delete ALL progress:</p>
              <ul>
                <li>Click count</li>
                <li>Unlocked features & buttons</li>
                <li>Achievements</li>
                <li>Mini-game high scores</li>
                <li>Discovered secrets</li>
              </ul>
              <div className="reset-buttons">
                <button className="btn btn-danger" onClick={() => { onReset(); setShowResetConfirm(false); }}>
                  Yes, Reset Everything
                </button>
                <button className="btn btn-ghost" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
              Reset All Progress
            </button>
          )}
        </section>

        {/* Version info */}
        <section className="settings-section version-info">
          <p>ONE MORE CLICK v1.0.0</p>
          <p className="settings-section-description">Built with React, GSAP, Howler.js & love</p>
        </section>
      </div>
    </div>
  );
}