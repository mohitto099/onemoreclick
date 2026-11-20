import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Modal Dialog Component
 */
export function Modal({ title, content, options = {}, onClose }) {
  const modalRef = useRef(null);
  const { closable = true, showProgress = false, progress = 0 } = options;

  useEffect(() => {
    if (modalRef.current) {
      gsap.from(modalRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.3,
        ease: 'back.out(1.7)',
      });
    }
  }, []);

  const handleClose = () => {
    if (!closable) return;
    gsap.to(modalRef.current, {
      scale: 0.9,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: onClose,
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closable) {
      handleClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && closable) {
      handleClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closable]);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div ref={modalRef} className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          {closable && (
            <button className="btn btn-ghost modal-close" onClick={handleClose} aria-label="Close modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="modal-body">
          {typeof content === 'string' ? (
            <p className="modal-text">{content}</p>
          ) : (
            content
          )}

          {showProgress && (
            <div className="modal-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="modal-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        {closable && (
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={handleClose}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmation Modal
 */
export function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) {
  return (
    <Modal title={title} content={message} onClose={onCancel}>
      <div className="modal-footer">
        <button className={`btn btn-${variant}`} onClick={onConfirm}>{confirmText}</button>
        <button className="btn btn-ghost" onClick={onCancel}>{cancelText}</button>
      </div>
    </Modal>
  );
}