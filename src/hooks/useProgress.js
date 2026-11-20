import { useState, useEffect, useCallback } from 'react';
import { storageManager } from '../utils/storage';
import { progressionSystem } from '../systems/ProgressionSystem';

/**
 * Hook for accessing and managing progress state
 */
export function useProgress() {
  const [progress, setProgress] = useState(() => storageManager.load());

  useEffect(() => {
    const unsub = storageManager.subscribe(data => {
      setProgress(prev => ({ ...prev, ...data }));
    });
    return unsub;
  }, []);

  const incrementClicks = useCallback((amount = 1) => {
    storageManager.increment('totalClicks', amount);
  }, []);

  const setValue = useCallback((key, value) => {
    storageManager.set(key, value);
  }, []);

  const addToArray = useCallback((key, value) => {
    storageManager.addToArray(key, value);
  }, []);

  const removeFromArray = useCallback((key, value) => {
    storageManager.removeFromArray(key, value);
  }, []);

  const reset = useCallback(() => {
    storageManager.reset();
  }, []);

  const unlockSecretRoom = useCallback((roomId) => {
    progressionSystem.unlockSecretRoom(roomId, storageManager.load());
  }, []);

  const unlockMinigame = useCallback((gameId) => {
    progressionSystem.unlockMinigame(gameId, storageManager.load());
  }, []);

  const unlockButton = useCallback((buttonId) => {
    progressionSystem.unlockButton(buttonId, storageManager.load());
  }, []);

  const unlockTheme = useCallback((themeId) => {
    progressionSystem.unlockTheme(themeId, storageManager.load());
  }, []);

  const getNextMilestone = useCallback(() => {
    return progressionSystem.getNextMilestone(progress.totalClicks);
  }, [progress.totalClicks]);

  const getProgressPercent = useCallback(() => {
    return progressionSystem.getProgress(progress.totalClicks);
  }, [progress.totalClicks]);

  return {
    progress,
    incrementClicks,
    setValue,
    addToArray,
    removeFromArray,
    reset,
    getNextMilestone,
    getProgressPercent,
    totalClicks: progress.totalClicks,
    unlockedFeatures: progress.unlockedFeatures,
    discoveredEvents: progress.discoveredEvents,
    achievements: progress.achievements,
    buttonCollection: progress.buttonCollection,
    secretRoomsDiscovered: progress.secretRoomsDiscovered,
    statistics: progress.statistics,
    soundEnabled: progress.soundEnabled,
    volume: progress.volume,
    selectedTheme: progress.selectedTheme,
    reducedMotion: progress.reducedMotion,
    chaosModeActive: progress.chaosModeActive,
    activeButtonId: progress.activeButtonId,
    unlockButton,
    unlockTheme,
    unlockMinigame,
    unlockSecretRoom,
  };
}

/**
 * Hook for theme management
 */
export function useTheme() {
  const { progress, setValue } = useProgress();

  const themes = [
    { id: 'default', name: 'Default', preview: 'theme-preview-default' },
    { id: 'retro', name: 'Retro Arcade', preview: 'theme-preview-retro' },
    { id: 'neon', name: 'Neon', preview: 'theme-preview-neon' },
    { id: 'minimal', name: 'Minimal', preview: 'theme-preview-minimal' },
    { id: 'chaos', name: 'Chaos', preview: 'theme-preview-chaos' },
  ];

  const setTheme = useCallback((themeId) => {
    document.documentElement.setAttribute('data-theme', themeId);
    setValue('selectedTheme', themeId);
  }, [setValue]);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', progress.selectedTheme);
  }, [progress.selectedTheme]);

  return {
    currentTheme: progress.selectedTheme,
    themes,
    setTheme,
    isUnlocked: (themeId) => progressionSystem.isThemeUnlocked(themeId, progress),
  };
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const { progress, setValue } = useProgress();

  const toggle = useCallback(() => {
    const newValue = !progress.reducedMotion;
    setValue('reducedMotion', newValue);
    document.documentElement.classList.toggle('reduce-motion', newValue);
  }, [progress.reducedMotion, setValue]);

  useEffect(() => {
    if (progress.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    }
  }, [progress.reducedMotion]);

  return {
    reducedMotion: progress.reducedMotion,
    toggle,
  };
}