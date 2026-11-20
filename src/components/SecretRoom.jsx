import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAudio } from '../systems/AudioManager';

const SECRET_ROOMS = {
  control_room: {
    name: 'Control Room',
    description: 'A mysterious panel with unusual controls.',
    icon: 'sliders',
    content: (
      <div className="secret-room-content control-room">
        <h3>🎛️ CONTROL ROOM</h3>
        <p>Welcome to the control room. Few have found this place.</p>
        <div className="control-panel">
          <button className="btn btn-secondary control-btn" onClick={() => alert('System diagnostic: Button health: 100%')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Run Diagnostic
          </button>
          <button className="btn btn-secondary control-btn" onClick={() => alert('Button calibration complete. Click sensitivity: MAXIMUM')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            Calibrate Button
          </button>
          <button className="btn btn-danger control-btn" onClick={() => alert('Self-destruct sequence aborted. The button refuses to explode.')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Self-Destruct (Fake)
          </button>
        </div>
        <p className="control-note">Konami code: ↑ ↑ ↓ ↓ ← → ← → B A</p>
      </div>
    ),
  },
  button_laboratory: {
    name: 'Button Laboratory',
    description: 'Experiment with button physics and behaviors.',
    icon: 'flask-conical',
    content: (
      <div className="secret-room-content button-lab">
        <h3>🧪 BUTTON LABORATORY</h3>
        <p>Here we study the fundamental properties of buttons.</p>
        <div className="lab-experiments">
          <button className="btn btn-primary lab-btn" onClick={() => alert('Gravity applied to button. It fell down.')}>
            Apply Gravity
          </button>
          <button className="btn btn-secondary lab-btn" onClick={() => alert('Button elasticity set to 200%. Boing!')}>
            Increase Bounce
          </button>
          <button className="btn btn-accent lab-btn" onClick={() => alert('Button quantum state: Superposition of clicked and unclicked.')}>
            Quantum Toggle
          </button>
        </div>
      </div>
    ),
  },
  duck_dimension: {
    name: 'Duck Dimension',
    description: 'A strange realm populated by rubber ducks.',
    icon: 'bird',
    content: (
      <div className="secret-room-content duck-dimension">
        <h3>🦆 DUCK DIMENSION</h3>
        <p>Quack. You have entered the realm of infinite ducks.</p>
        <div className="duck-army">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="duck-emoji" style={{ animationDelay: `${i * 0.1}s` }}>🦆</span>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => alert('The ducks accept your offering. *quack*')}>
          Offer Bread
        </button>
      </div>
    ),
  },
  the_void: {
    name: 'The Void',
    description: 'A minimalist dark environment with mysterious interactions.',
    icon: 'circle',
    content: (
      <div className="secret-room-content the-void">
        <h3>🕳️ THE VOID</h3>
        <p>Nothing exists here. Except the button.</p>
        <div className="void-button">
          <button className="btn btn-ghost void-btn" onClick={() => alert('The void stares back. It has no mouth, yet it screams.')}>
            VOID
          </button>
        </div>
        <p className="void-text">... ... ...</p>
      </div>
    ),
  },
  forbidden: {
    name: 'The Forbidden Room',
    description: 'The ultimate secret environment.',
    icon: 'lock',
    content: (
      <div className="secret-room-content forbidden-room">
        <h3>🔴 THE FORBIDDEN ROOM</h3>
        <p>You found it. The place that shouldn't exist.</p>
        <div className="forbidden-content">
          <p>There is no button here.</p>
          <p>There is only the choice.</p>
          <button className="btn btn-danger" onClick={() => alert('You chose... wisely? The button approves.')}>
            Accept the Truth
          </button>
          <button className="btn btn-ghost" onClick={() => alert('You chose... to leave. The button understands.')}>
            Walk Away
          </button>
        </div>
      </div>
    ),
  },
};

export function SecretRoom({ roomId, onClose }) {
  const room = SECRET_ROOMS[roomId];
  const { playSound } = useAudio();
  const containerRef = useRef(null);

  useEffect(() => {
    if (room) {
      playSound('suspense');
      playSound('victory');
    }
  }, [roomId, playSound]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.4,
        ease: 'back.out(1.7)',
      });
    }
  }, []);

  const handleClose = () => {
    gsap.to(containerRef.current, {
      scale: 0.9,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: onClose,
    });
  };

  if (!room) return null;

  return (
    <div className="secret-room-overlay" onClick={handleClose}>
      <div
        ref={containerRef}
        className={`secret-room-modal ${roomId}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={room.name}
      >
        <div className="secret-room-header">
          <h2>{room.name}</h2>
          <button className="btn btn-ghost" onClick={handleClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="secret-room-body">
          {room.content}
        </div>
      </div>
    </div>
  );
}