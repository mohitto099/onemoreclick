import { useEffect, useRef } from 'react';
import { useChaosEngine } from '../systems/ChaosEngine';
import { useProgression } from '../systems/ProgressionSystem';
import { useAudio } from '../systems/AudioManager';
import { useAchievements } from '../systems/AchievementSystem';
import { useSound } from '../hooks/useSound';

/**
 * Main Button — The central interactive element
 */
export function MainButton({ onClick, isActive = true, className = '', label = 'DO NOT PRESS', style: inlineStyle = {} }) {
  const buttonRef = useRef(null);
  const { playSound, resume } = useAudio();
  const { handleClick, triggerEvent, handleLongPress, handleKonami } = useChaosEngine();
  const { incrementClicks } = useProgression();
  const { checkAchievements } = useAchievements();
  const { play: playClickSound } = useSound('click');

  const pressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef(null);

  // Initialize audio on first interaction
  const initAudio = () => {
    resume();
  };

  const handleMouseDown = (e) => {
    initAudio();
    if (!isActive) return;

    isLongPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      handleLongPress();
      playSound('suspense');
    }, 2000);

    // Visual press feedback
    if (buttonRef.current) {
      buttonRef.current.classList.add('animate-button-press');
      setTimeout(() => buttonRef.current?.classList.remove('animate-button-press'), 150);
    }
  };

  const handleMouseUp = (e) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return; // Long press handled separately
    }

    // Regular click
    handleClick(e);
    incrementClicks(1);
    playClickSound();
    checkAchievements();

    // Track rapid clicks for multi-click detection
    clickCountRef.current++;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      if (clickCountRef.current >= 3) {
        triggerEvent('triple_click');
      }
      clickCountRef.current = 0;
    }, 400);
  };

  const handleMouseLeave = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  // Keyboard support
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleMouseDown(e);
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      handleMouseUp(e);
    }
  };

  // Konami code listener
  useEffect(() => {
    const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    let index = 0;

    const handler = (e) => {
      if (e.code === sequence[index]) {
        index++;
        if (index === sequence.length) {
          handleKonami();
          index = 0;
        }
      } else {
        index = 0;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKonami]);

  // Apply dynamic styles from GSAP transforms
  const style = {
    ...inlineStyle,
    transformOrigin: 'center center',
  };

  return (
    <button
      ref={buttonRef}
      className={`btn btn-primary main-button ${className}`}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={!isActive}
      style={style}
      aria-label="Main button"
      tabIndex={0}
    >
      {label}
    </button>
  );
}

/**
 * Click Counter — Animated number display
 */
export function ClickCounter({ count = 0, className = '' }) {
  const prevCountRef = useRef(count);
  const displayRef = useRef(count);

  useEffect(() => {
    if (count !== prevCountRef.current) {
      displayRef.current = count;
      prevCountRef.current = count;
    }
  }, [count]);

  return (
    <div className={`click-counter ${className}`} role="status" aria-live="polite">
      <span className="counter-label">Clicks</span>
      <span className="counter-value animate-count-up" data-count={displayRef.current}>
        {displayRef.current.toLocaleString()}
      </span>
    </div>
  );
}

/**
 * Status Message — Rotating humorous messages
 */
export function StatusMessage({ message = '', className = '', type = 'info' }) {
  const [currentMessage, setCurrentMessage] = React.useState(message);
  const [messageType, setMessageType] = React.useState(type);

  const messages = [
    'You could stop anytime. But you won\'t.',
    'The button watches. It waits.',
    'Click. Click. Click. Satisfied?',
    'Every click feeds the button.',
    'The button remembers every press.',
    'One more click won\'t hurt. Right?',
    'Your finger must be tired. Keep going.',
    'The button judges your rhythm.',
    'Click count: classified.',
    'Warning: Button addiction detected.',
  ];

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setMessageType(type);
      return;
    }

    // Auto-rotate messages
    let index = 0;
    const interval = setInterval(() => {
      setCurrentMessage(messages[index]);
      index = (index + 1) % messages.length;
    }, 8000);

    return () => clearInterval(interval);
  }, [message, type]);

  const typeClasses = {
    info: 'status-info',
    success: 'status-success',
    warning: 'status-warning',
    error: 'status-error',
  };

  return (
    <div className={`status-message ${typeClasses[messageType] || 'status-info'} ${className}`} role="status" aria-live="polite">
      <span className="status-text">{currentMessage}</span>
    </div>
  );
}

/**
 * Sound Controls — Toggle and volume
 */
export function SoundControls({ className = '' }) {
  const { enabled, volume, toggleSound, setVolume, playSound } = useAudio();

  return (
    <div className={`sound-controls ${className}`} role="group" aria-label="Sound controls">
      <button
        className={`btn ${enabled ? 'btn-secondary' : 'btn-ghost'} sound-toggle`}
        onClick={toggleSound}
        aria-label={enabled ? 'Disable sound' : 'Enable sound'}
        aria-pressed={enabled}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {enabled ? (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </>
          ) : (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </>
          )}
        </svg>
        <span className="sound-label">{enabled ? 'ON' : 'OFF'}</span>
      </button>

      {enabled && (
        <div className="volume-slider-container">
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
        </div>
      )}
    </div>
  );
}

/**
 * Progress Bar — Visual milestone indicator
 */
export function ProgressBar({ className = '' }) {
  const { progress, getProgress, getNextMilestone } = useProgression();
  const { current, next, remaining } = getProgress(progress.totalClicks);

  return (
    <div className={`progress-bar-container ${className}`} role="progressbar" aria-valuenow={Math.round(current)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-header">
        <span className="progress-label">Progress</span>
        {next && (
          <span className="progress-next">
            {next.name} in {remaining} clicks
          </span>
        )}
      </div>
      <div className="progress-track">
        <div
          className="progress-fill animate-progress-fill"
          style={{ width: `${current}%`, '--progress-width': `${current}%` }}
        >
          <div className="progress-shine" />
        </div>
      </div>
      <div className="progress-milestones">
        {MILESTONES.slice(0, 6).map((m, i) => (
          <div
            key={m.id}
            className={`milestone-marker ${progress.totalClicks >= m.clicks ? 'unlocked' : ''}`}
            style={{ left: `${(m.clicks / 1000) * 100}%` }}
            title={`${m.name} (${m.clicks} clicks)`}
          />
        ))}
      </div>
    </div>
  );
}

const MILESTONES = [
  { id: 'first_click', clicks: 1 },
  { id: 'five_clicks', clicks: 5 },
  { id: 'ten_clicks', clicks: 10 },
  { id: 'fifty_clicks', clicks: 50 },
  { id: 'hundred_clicks', clicks: 100 },
  { id: 'fivehundred_clicks', clicks: 500 },
];

import React from 'react';