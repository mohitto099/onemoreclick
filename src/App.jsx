import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { NotificationProvider, useNotifications, useReducedMotion } from './systems/NotificationSystem';
import { MainButton, ClickCounter, StatusMessage, SoundControls, ProgressBar } from './components/MainButton';
import { useProgress } from './hooks/useProgress';
import { useChaosEngine } from './systems/ChaosEngine';
import { useAudio } from './systems/AudioManager';
import { useAchievements } from './systems/AchievementSystem';
import { useTheme } from './hooks/useProgress';
import { ButtonCollection } from './components/ButtonCollection';
import { AchievementCentre } from './components/AchievementCentre';
import { SettingsPanel } from './components/SettingsPanel';
import { SecretRoom } from './components/SecretRoom';
import { MinigameOverlay } from './components/MinigameOverlay';
import { AchievementNotification } from './components/AchievementNotification';
import { Modal } from './components/Modal';
import { ToastContainer } from './components/Toast';
import { NotificationHistory } from './components/NotificationHistory';
import './styles/global.css';
import './styles/animations.css';
import './styles/themes.css';

/**
 * Inner App component - wrapped with NotificationProvider
 */
function AppInner() {
  const [uiState, setUiState] = useState({
    showButtonCollection: false,
    showAchievements: false,
    showSettings: false,
    showSecretRoom: null,
    activeMinigame: null,
    modal: null,
    showNotificationHistory: false,
  });

  const mainContainerRef = useRef(null);
  const buttonContainerRef = useRef(null);
  const mainButtonRef = useRef(null);

  const { progress, incrementClicks, unlockButton, unlockTheme, unlockMinigame, unlockSecretRoom, resetProgress } = useProgress();
  const { handleClick, setUI, triggerEvent, handleLongPress, handleKonami, handleSecretNumber, handleHiddenCorner, launchMinigame } = useChaosEngine();
  const { enabled: soundEnabled, volume, toggleSound, setVolume, playSound, resume } = useAudio();
  const { achievements, notifications, isUnlocked, getUnlockedCount, getTotalCount, checkAchievements } = useAchievements();
  const { currentTheme, themes, setTheme, isUnlocked: isThemeUnlocked } = useTheme();
  
  // New notification system
  const { 
    queue: notificationQueue, 
    showUnlock, 
    showDiscovery, 
    showSecret, 
    showAchievement, 
    showMilestone, 
    showGameComplete,
    showSuccess,
    showInfo,
    showWarning,
    showError,
    dismissNotification,
    showNotificationHistory,
    unreadCount,
  } = useNotifications();
  
  const reducedMotion = useReducedMotion();

  // Initialize chaos engine with UI reference
  useEffect(() => {
    const ui = {
      getMainButton: () => mainButtonRef.current,
      getButtonContainer: () => buttonContainerRef.current,
      getMainContainer: () => mainContainerRef.current,
      showStatus: (msg, type, duration) => setUiState(prev => ({
        ...prev,
        statusMessage: msg,
        statusType: type,
      })),
      showModal: (title, content, options = {}) => {
        const id = Date.now().toString();
        setUiState(prev => ({
          ...prev,
          modal: { id, title, content, options },
        }));
        return {
          updateContent: (c) => setUiState(prev => ({
            ...prev,
            modal: prev.modal ? { ...prev.modal, content: c } : null,
          })),
          updateProgress: (p) => setUiState(prev => ({
            ...prev,
            modal: prev.modal ? { ...prev.modal, progress: p } : null,
          })),
          setClosable: (c) => setUiState(prev => ({
            ...prev,
            modal: prev.modal ? { ...prev.modal, options: { ...prev.modal.options, closable: c } } : null,
          })),
        };
      },
      showUnlockNotification: (milestone) => {
        showUnlock(milestone.name, milestone.description, {
          persistent: true,
          onAction: () => setUiState(prev => ({ ...prev, showButtonCollection: true })),
          actionLabel: 'View Collection',
        });
      },
      showAchievementNotification: (achievementId) => {
        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
          showAchievement(achievement.name, achievement.description);
        }
      },
      spawnConfetti: (count = 100) => {
        for (let i = 0; i < count; i++) {
          createConfetti();
        }
      },
      spawnDuck: () => createDuck(),
      spawnUFO: () => createUFO(),
      spawnMeteors: (count) => { for (let i = 0; i < count; i++) createMeteor(); },
      spawnCat: () => createCat(),
      launchMinigame: (gameId) => {
        setUiState(prev => ({ ...prev, activeMinigame: gameId }));
      },
      unlockButton: (buttonId) => unlockButton(buttonId),
      unlockTheme: (themeId) => unlockTheme(themeId),
      unlockMinigame: (gameId) => unlockMinigame(gameId),
      unlockSecretRoom: (roomId) => unlockSecretRoom(roomId),
      updateProgress: (progress) => {
        // Progress is auto-updated via storage subscription
      },
      showDiscovery: (title, message) => showDiscovery(title, message),
      showSecret: (title, message) => showSecret(title, message),
      showMilestone: (title, message) => showMilestone(title, message),
      showGameComplete: (title, message) => showGameComplete(title, message),
      showError: (title, message) => showError(title, message),
      showWarning: (title, message) => showWarning(title, message),
    };

    setUI(ui);
  }, [setUI, unlockButton, unlockTheme, unlockMinigame, unlockSecretRoom, 
      showUnlock, showDiscovery, showSecret, showAchievement, showMilestone, showGameComplete,
      showError, showWarning]);

  // Check achievements periodically
  useEffect(() => {
    checkAchievements();
    const interval = setInterval(checkAchievements, 5000);
    return () => clearInterval(interval);
  }, [checkAchievements]);

  // Initialize audio on first interaction
  const handleFirstInteraction = useCallback(() => {
    resume();
  }, [resume]);

  // Close modal
  const closeModal = useCallback(() => {
    setUiState(prev => ({ ...prev, modal: null }));
  }, []);

  // Remove toast
  const removeToast = useCallback((id) => {
    dismissNotification(id);
  }, [dismissNotification]);

  // Handle secret room navigation
  const enterSecretRoom = useCallback((roomId) => {
    setUiState(prev => ({ ...prev, showSecretRoom: roomId }));
  }, []);

  const exitSecretRoom = useCallback(() => {
    setUiState(prev => ({ ...prev, showSecretRoom: null }));
  }, []);

  // Toggle panels
  const toggleButtonCollection = useCallback(() => {
    setUiState(prev => ({ ...prev, showButtonCollection: !prev.showButtonCollection }));
  }, []);

  const toggleAchievements = useCallback(() => {
    setUiState(prev => ({ ...prev, showAchievements: !prev.showAchievements }));
  }, []);

  const toggleSettings = useCallback(() => {
    setUiState(prev => ({ ...prev, showSettings: !prev.showSettings }));
  }, []);

  const toggleNotificationHistory = useCallback(() => {
    setUiState(prev => ({ ...prev, showNotificationHistory: !prev.showNotificationHistory }));
  }, []);

  // Handle hidden corner click (bottom right)
  const handleCornerClick = useCallback((e) => {
    const rect = mainContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x > rect.width - 50 && y > rect.height - 50) {
      handleHiddenCorner();
    }
  }, [handleHiddenCorner]);

  return (
    <div
      ref={mainContainerRef}
      className="app-container"
      onClick={handleCornerClick}
      onTouchStart={handleCornerClick}
    >
      {/* Background effects layer */}
      <div className="background-effects" aria-hidden="true" />

      {/* Main content */}
      <main className="main-content" role="main">
        {/* Header */}
        <header className="app-header">
          <h1 className="app-title">ONE MORE CLICK</h1>
          <p className="app-tagline">"You could stop anytime. But you won't."</p>
        </header>

        {/* Central button area */}
        <div className="button-area" ref={buttonContainerRef}>
          <MainButton
            ref={mainButtonRef}
            isActive={true}
            label={progress.totalClicks === 0 ? 'DO NOT PRESS' : 'PRESS ME'}
            onClick={handleFirstInteraction}
          />
        </div>

        {/* Stats panel */}
        <div className="stats-panel">
          <ClickCounter count={progress.totalClicks} />
          <StatusMessage />
          <div className="controls-row">
            <SoundControls />
            {progress.totalClicks >= 10 && (
              <button className="btn btn-ghost" onClick={toggleButtonCollection} aria-label="Button Collection">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Collection
              </button>
            )}
            {progress.totalClicks >= 50 && (
              <button className="btn btn-ghost" onClick={toggleAchievements} aria-label="Achievements">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
                Achievements ({getUnlockedCount()}/{getTotalCount()})
              </button>
            )}
            <button className="btn btn-ghost" onClick={toggleNotificationHistory} aria-label="Notification History">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              History
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
          </div>
          <ProgressBar />
        </div>

        {/* Footer hints */}
        <footer className="app-footer">
          <p className="hint-text">
            {progress.totalClicks === 0 && 'Click the button to begin...'}
            {progress.totalClicks > 0 && progress.totalClicks < 10 && 'Keep clicking...'}
            {progress.totalClicks >= 10 && progress.totalClicks < 50 && 'Something new awaits...'}
            {progress.totalClicks >= 50 && 'Chaos Mode active!'}
          </p>
        </footer>
      </main>

      {/* Side panels */}
      <aside className="side-panels">
        {uiState.showButtonCollection && (
          <ButtonCollection
            buttons={progress.buttonCollection}
            onClose={toggleButtonCollection}
            onSelectButton={(id) => {}}
          />
        )}

        {uiState.showAchievements && (
          <AchievementCentre
            achievements={achievements}
            unlocked={progress.achievements}
            onClose={toggleAchievements}
          />
        )}

        {uiState.showSettings && (
          <SettingsPanel
            onClose={toggleSettings}
            theme={currentTheme}
            themes={themes}
            setTheme={setTheme}
            isThemeUnlocked={isThemeUnlocked}
            soundEnabled={soundEnabled}
            volume={volume}
            toggleSound={toggleSound}
            setVolume={setVolume}
            onReset={resetProgress}
          />
        )}
      </aside>

      {/* Secret room overlay */}
      {uiState.showSecretRoom && (
        <SecretRoom
          roomId={uiState.showSecretRoom}
          onClose={exitSecretRoom}
        />
      )}

      {/* Mini-game overlay */}
      {uiState.activeMinigame && (
        <MinigameOverlay
          gameId={uiState.activeMinigame}
          onClose={() => setUiState(prev => ({ ...prev, activeMinigame: null }))}
        />
      )}

      {/* Modal overlay */}
      {uiState.modal && (
        <Modal
          {...uiState.modal}
          onClose={closeModal}
        />
      )}

      {/* Toast notifications - new system */}
      <ToastContainer
        notifications={notificationQueue}
        onDismiss={dismissNotification}
        position="bottom-right"
        maxVisible={5}
      />

      {/* Achievement notifications (special banner) */}
      {notifications.map(n => (
        <AchievementNotification
          key={n.id}
          achievement={n}
          onDismiss={dismissNotification}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* Notification History Panel */}
      <NotificationHistory
        isOpen={uiState.showNotificationHistory}
        onClose={toggleNotificationHistory}
      />

      {/* Settings button (floating) */}
      <button
        className="floating-settings-btn"
        onClick={toggleSettings}
        aria-label="Settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  );
}

/**
 * App wrapper with NotificationProvider
 */
function App() {
  return (
    <NotificationProvider maxVisible={5}>
      <AppInner />
    </NotificationProvider>
  );
}

// Particle creation functions
function createConfetti() {
  const el = document.createElement('div');
  el.className = 'confetti-particle';
  el.style.left = Math.random() * 100 + 'vw';
  el.style.background = ['#E53945', '#FFD166', '#45D6E8', '#A78BFA', '#4ade80'][Math.floor(Math.random() * 5)];
  el.style.animationDuration = (Math.random() * 2 + 2) + 's';
  el.style.animationDelay = Math.random() * 0.5 + 's';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function createDuck() {
  const el = document.createElement('div');
  el.className = 'duck-sprite animate-duck-fly';
  el.innerHTML = '🦆';
  el.style.fontSize = '40px';
  el.style.position = 'fixed';
  el.style.left = '-60px';
  el.style.top = (Math.random() * 80 + 10) + 'vh';
  el.style.zIndex = '1000';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 10000);
}

function createUFO() {
  const el = document.createElement('div');
  el.className = 'ufo-sprite animate-ufo-float';
  el.innerHTML = '🛸';
  el.style.fontSize = '60px';
  el.style.position = 'fixed';
  el.style.left = '-80px';
  el.style.top = (Math.random() * 40 + 10) + 'vh';
  el.style.zIndex = '1000';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

function createMeteor() {
  const el = document.createElement('div');
  el.className = 'meteor-particle';
  el.style.left = Math.random() * 100 + 'vw';
  el.style.animationDuration = (Math.random() * 1 + 0.5) + 's';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function createCat() {
  const el = document.createElement('div');
  el.className = 'cat-sprite animate-cat-twitch';
  el.innerHTML = '🐱';
  el.style.fontSize = '50px';
  el.style.position = 'fixed';
  el.style.left = (Math.random() * 80 + 10) + 'vw';
  el.style.top = (Math.random() * 80 + 10) + 'vh';
  el.style.zIndex = '1000';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export default App;