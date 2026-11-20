/**
 * Progression System — Manages click milestones, feature unlocks, and progression tracking.
 */

import { storageManager } from '../utils/storage';

const MILESTONES = [
  { clicks: 1, id: 'first_click', name: 'First Contact', description: 'You pressed the button.', reward: { type: 'feature', value: 'main_button' } },
  { clicks: 5, id: 'five_clicks', name: 'Getting Started', description: 'First surprise unlocked.', reward: { type: 'feature', value: 'first_surprise' } },
  { clicks: 10, id: 'ten_clicks', name: 'Button Collector', description: 'A second button appears.', reward: { type: 'button', value: 'button_2' } },
  { clicks: 20, id: 'twenty_clicks', name: 'Effect Enthusiast', description: 'Special effects unlocked.', reward: { type: 'feature', value: 'first_special_effect' } },
  { clicks: 30, id: 'thirty_clicks', name: 'Interaction Explorer', description: 'Mini interactions available.', reward: { type: 'feature', value: 'mini_interaction' } },
  { clicks: 50, id: 'fifty_clicks', name: 'Chaos Agent', description: 'CHAOS MODE activated!', reward: { type: 'mode', value: 'chaos_mode' } },
  { clicks: 75, id: 'seventyfive_clicks', name: 'Secret Finder', description: 'Hidden interactions revealed.', reward: { type: 'feature', value: 'secret_interaction' } },
  { clicks: 100, id: 'hundred_clicks', name: 'Mini-Game Master', description: 'First mini-game unlocked: Catch the Duck.', reward: { type: 'minigame', value: 'catchTheDuck' } },
  { clicks: 150, id: 'hundredfifty_clicks', name: 'Button Curator', description: 'Button collection unlocked.', reward: { type: 'feature', value: 'button_collection' } },
  { clicks: 250, id: 'twofifty_clicks', name: 'Retro Gamer', description: 'Retro Arcade theme unlocked.', reward: { type: 'theme', value: 'retro' } },
  { clicks: 500, id: 'fivehundred_clicks', name: 'Forbidden Knowledge', description: 'The Forbidden Room opens.', reward: { type: 'secret_room', value: 'forbidden' } },
  { clicks: 750, id: 'sevenfifty_clicks', name: 'Chaos Architect', description: 'Advanced chaos events unlocked.', reward: { type: 'feature', value: 'advanced_chaos' } },
  { clicks: 1000, id: 'thousand_clicks', name: 'Ultimate Clicker', description: 'The ultimate secret revealed.', reward: { type: 'secret', value: 'ultimate_secret' } },
];

class ProgressionSystem {
  constructor() {
    this.listeners = new Set();
  }

  getMilestones() {
    return MILESTONES;
  }

  getNextMilestone(clicks) {
    return MILESTONES.find(m => m.clicks > clicks) || null;
  }

  getProgress(clicks) {
    const next = this.getNextMilestone(clicks);
    if (!next) return { current: 100, next: null, remaining: 0 };
    const prev = MILESTONES.find(m => m.clicks <= clicks) || { clicks: 0 };
    const progress = ((clicks - prev.clicks) / (next.clicks - prev.clicks)) * 100;
    return {
      current: Math.min(100, Math.max(0, progress)),
      next,
      remaining: next.clicks - clicks,
    };
  }

  checkMilestones(clicks, unlockedFeatures) {
    const newlyUnlocked = [];
    for (const milestone of MILESTONES) {
      if (clicks >= milestone.clicks && !unlockedFeatures.includes(milestone.id)) {
        newlyUnlocked.push(milestone);
      }
    }
    return newlyUnlocked;
  }

  unlockFeature(featureId, progress) {
    if (!progress.unlockedFeatures.includes(featureId)) {
      progress.unlockedFeatures.push(featureId);
      this.notify();
      return true;
    }
    return false;
  }

  unlockButton(buttonId, progress) {
    if (!progress.buttonCollection.includes(buttonId)) {
      progress.buttonCollection.push(buttonId);
      this.notify();
      return true;
    }
    return false;
  }

  unlockTheme(themeId, progress) {
    const featureId = `theme_${themeId}`;
    if (!progress.unlockedFeatures.includes(featureId)) {
      progress.unlockedFeatures.push(featureId);
      this.notify();
      return true;
    }
    return false;
  }

  unlockMinigame(gameId, progress) {
    const featureId = `minigame_${gameId}`;
    if (!progress.unlockedFeatures.includes(featureId)) {
      progress.unlockedFeatures.push(featureId);
      this.notify();
      return true;
    }
    return false;
  }

  unlockSecretRoom(roomId, progress) {
    if (!progress.secretRoomsDiscovered.includes(roomId)) {
      progress.secretRoomsDiscovered.push(roomId);
      this.notify();
      return true;
    }
    return false;
  }

  isUnlocked(featureId, progress) {
    return progress.unlockedFeatures.includes(featureId);
  }

  isButtonUnlocked(buttonId, progress) {
    return progress.buttonCollection.includes(buttonId);
  }

  isThemeUnlocked(themeId, progress) {
    return progress.unlockedFeatures.includes(`theme_${themeId}`);
  }

  isMinigameUnlocked(gameId, progress) {
    return progress.unlockedFeatures.includes(`minigame_${gameId}`);
  }

  isSecretRoomDiscovered(roomId, progress) {
    return progress.secretRoomsDiscovered.includes(roomId);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => {
      try { l(); } catch (e) { console.error('Progression listener error:', e); }
    });
  }
}

export const progressionSystem = new ProgressionSystem();

// React hook
export function useProgression() {
  const [progress, setProgress] = React.useState(() => storageManager.load());

  React.useEffect(() => {
    const unsub = storageManager.subscribe(data => {
      setProgress({ ...data });
    });
    return unsub;
  }, []);

  const incrementClicks = (amount = 1) => {
    storageManager.increment('totalClicks', amount);
  };

  const unlockFeature = (featureId) => {
    progressionSystem.unlockFeature(featureId, storageManager.load());
  };

  const unlockButton = (buttonId) => {
    progressionSystem.unlockButton(buttonId, storageManager.load());
  };

  const unlockTheme = (themeId) => {
    progressionSystem.unlockTheme(themeId, storageManager.load());
  };

  const unlockMinigame = (gameId) => {
    progressionSystem.unlockMinigame(gameId, storageManager.load());
  };

  const unlockSecretRoom = (roomId) => {
    progressionSystem.unlockSecretRoom(roomId, storageManager.load());
  };

  const getProgress = (clicks) => {
    return progressionSystem.getProgress(clicks || progress.totalClicks);
  };

  const getNextMilestone = (clicks) => {
    return progressionSystem.getNextMilestone(clicks || progress.totalClicks);
  };

  const resetProgress = () => {
    storageManager.reset();
  };

  return {
    progress,
    incrementClicks,
    unlockFeature,
    unlockButton,
    unlockTheme,
    unlockMinigame,
    unlockSecretRoom,
    isUnlocked: (id) => progressionSystem.isUnlocked(id, progress),
    isButtonUnlocked: (id) => progressionSystem.isButtonUnlocked(id, progress),
    isThemeUnlocked: (id) => progressionSystem.isThemeUnlocked(id, progress),
    isMinigameUnlocked: (id) => progressionSystem.isMinigameUnlocked(id, progress),
    isSecretRoomDiscovered: (id) => progressionSystem.isSecretRoomDiscovered(id, progress),
    getProgress,
    getNextMilestone,
    resetProgress,
    milestones: MILESTONES,
  };
}

import React from 'react';