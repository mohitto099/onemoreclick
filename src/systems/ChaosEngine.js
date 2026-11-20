/**
 * Chaos Engine — Central event orchestrator.
 * Manages event selection, execution, queuing, and cleanup.
 */

import { eventRegistry } from './EventRegistry';
import { audioManager } from './AudioManager';
import { storageManager } from '../utils/storage';
import { progressionSystem } from './ProgressionSystem';
import { achievementSystem } from './AchievementSystem';

class ChaosEngine {
  constructor() {
    this.ui = null;
    this.isProcessing = false;
    this.eventQueue = [];
    this.activeEffects = new Map();
    this.clickHistory = [];
    this.lastClickTime = 0;
    this.consecutiveClicks = 0;
    this.chaosModeActive = false;
  }

  /**
   * Set UI reference for callbacks
   */
  setUI(ui) {
    this.ui = ui;
  }

  /**
   * Main click handler - called on every button click
   */
  async handleClick(event) {
    if (this.isProcessing) return;

    const now = Date.now();
    const timeSinceLastClick = now - this.lastClickTime;

    // Track click patterns
    if (timeSinceLastClick < 400) {
      this.consecutiveClicks++;
    } else {
      this.consecutiveClicks = 1;
    }
    this.clickHistory.push({ time: now, event });
    this.lastClickTime = now;

    // Keep history limited
    if (this.clickHistory.length > 50) {
      this.clickHistory.shift();
    }

    // Check for special patterns
    this.checkSpecialPatterns();

    // Process click
    this.isProcessing = true;

    try {
      // 1. Get progress
      const progress = storageManager.load();

      // 2. Select and execute random event
      await this.executeRandomEvent(progress);

      // 3. Check milestones
      this.checkMilestones(progress);

      // 4. Check achievements
      this.checkAchievements(progress);

      // 5. Save progress
      storageManager.save(progress);

      // 6. Update UI
      this.ui?.updateProgress(progress);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check for special click patterns
   */
  checkSpecialPatterns() {
    // Double click
    if (this.consecutiveClicks >= 2) {
      this.triggerEvent('double_click', { source: 'pattern' });
    }

    // Triple click
    if (this.consecutiveClicks >= 3) {
      this.triggerEvent('triple_click', { source: 'pattern' });
    }
  }

  /**
   * Execute a random event based on current progress
   */
  async executeRandomEvent(progress) {
    const available = eventRegistry.getAvailable(progress, progress.unlockedFeatures);

    if (available.length === 0) return;

    // Weight by probability
    const totalWeight = available.reduce((sum, e) => sum + e.probability, 0);
    let random = Math.random() * totalWeight;

    let selected = available[0];
    for (const event of available) {
      random -= event.probability;
      if (random <= 0) {
        selected = event;
        break;
      }
    }

    // Execute the event
    await this.executeEvent(selected, progress);
  }

  /**
   * Execute a specific event
   */
  async executeEvent(event, progress) {
    if (!event.handler) return;

    const context = {
      ui: this.ui,
      engine: this,
      progress,
      audio: audioManager,
      storage: storageManager,
      gsap: gsap,
    };

    try {
      // Call handler
      const result = event.handler(context);

      // Handle promise if async
      if (result instanceof Promise) {
        await result;
      }

      // Trigger cooldown
      eventRegistry.triggerCooldown(event.id);

      // Track discovered event
      if (!progress.discoveredEvents.includes(event.id)) {
        progress.discoveredEvents.push(event.id);
      }
    } catch (error) {
      console.error(`Event ${event.id} failed:`, error);
    }
  }

  /**
   * Force trigger a specific event by ID
   */
  async triggerEvent(eventId, extraContext = {}) {
    const event = eventRegistry.get(eventId);
    if (!event) {
      console.warn(`Event ${eventId} not found`);
      return;
    }

    const progress = storageManager.load();
    const context = {
      ui: this.ui,
      engine: this,
      progress,
      audio: audioManager,
      storage: storageManager,
      gsap: gsap,
      ...extraContext,
    };

    try {
      const result = event.handler(context);
      if (result instanceof Promise) await result;
      eventRegistry.triggerCooldown(eventId);

      if (!progress.discoveredEvents.includes(event.id)) {
        progress.discoveredEvents.push(event.id);
        storageManager.save(progress);
      }
    } catch (error) {
      console.error(`Event ${eventId} failed:`, error);
    }
  }

  /**
   * Check milestone unlocks using ProgressionSystem
   */
  checkMilestones(progress) {
    const newlyUnlocked = progressionSystem.checkMilestones(progress.totalClicks, progress.unlockedFeatures);
    
    for (const milestone of newlyUnlocked) {
      this.unlockMilestone(milestone, progress);
    }
  }

  /**
   * Unlock a milestone
   */
  unlockMilestone(milestone, progress) {
    // Use progressionSystem to unlock
    if (milestone.reward) {
      switch (milestone.reward.type) {
        case 'feature':
          progressionSystem.unlockFeature(milestone.reward.value, progress);
          break;
        case 'button':
          progressionSystem.unlockButton(milestone.reward.value, progress);
          break;
        case 'minigame':
          progressionSystem.unlockMinigame(milestone.reward.value, progress);
          break;
        case 'theme':
          progressionSystem.unlockTheme(milestone.reward.value, progress);
          break;
        case 'mode':
          if (milestone.reward.value === 'chaos_mode') {
            this.chaosModeActive = true;
            progress.chaosModeActive = true;
          }
          break;
        case 'secret_room':
          progressionSystem.unlockSecretRoom(milestone.reward.value, progress);
          break;
      }
    }
    // Also add the milestone id to unlockedFeatures for backward compatibility
    if (!progress.unlockedFeatures.includes(milestone.id)) {
      progress.unlockedFeatures.push(milestone.id);
    }

    // Notify UI
    this.ui?.showUnlockNotification(milestone);
    audioManager.play('unlock');

    console.log(`Milestone unlocked: ${milestone.name} at ${milestone.clicks} clicks`);
  }

  /**
   * Check achievement unlocks using AchievementSystem
   */
  checkAchievements(progress) {
    const newlyUnlocked = achievementSystem.checkAchievements(progress);
    
    for (const achievement of newlyUnlocked) {
      this.unlockAchievement(achievement.id, progress);
    }
  }

  /**
   * Unlock an achievement
   */
  unlockAchievement(id, progress) {
    achievementSystem.unlockAchievement(id, progress);
    this.ui?.showAchievementNotification(id);
    audioManager.play('achievement');
    console.log(`Achievement unlocked: ${id}`);
  }

  /**
   * Handle long press
   */
  handleLongPress() {
    this.triggerEvent('long_press');
  }

  /**
   * Handle Konami code
   */
  handleKonami() {
    this.triggerEvent('konami_code');
  }

  /**
   * Handle secret number input
   */
  handleSecretNumber(number) {
    this.triggerEvent('secret_number', { number });
  }

  /**
   * Handle hidden corner click
   */
  handleHiddenCorner() {
    this.triggerEvent('hidden_corner');
  }

  /**
   * Launch a mini-game
   */
  launchMinigame(gameId) {
    this.ui?.launchMinigame(gameId);
  }

  /**
   * Clean up all active effects
   */
  cleanup() {
    this.activeEffects.forEach((cleanup, id) => {
      try {
        cleanup();
      } catch (e) {
        console.error(`Cleanup failed for ${id}:`, e);
      }
    });
    this.activeEffects.clear();
    eventRegistry.cooldownManager.clearAll();
  }

  /**
   * Get engine state
   */
  getState() {
    return {
      chaosModeActive: this.chaosModeActive,
      consecutiveClicks: this.consecutiveClicks,
      queueLength: this.eventQueue.length,
      activeEffects: this.activeEffects.size,
    };
  }
}

// Singleton
export const chaosEngine = new ChaosEngine();

// React hook
export function useChaosEngine() {
  const [state, setState] = React.useState(chaosEngine.getState());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setState(chaosEngine.getState());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    handleClick: chaosEngine.handleClick.bind(chaosEngine),
    setUI: chaosEngine.setUI.bind(chaosEngine),
    triggerEvent: chaosEngine.triggerEvent.bind(chaosEngine),
    handleLongPress: chaosEngine.handleLongPress.bind(chaosEngine),
    handleKonami: chaosEngine.handleKonami.bind(chaosEngine),
    handleSecretNumber: chaosEngine.handleSecretNumber.bind(chaosEngine),
    handleHiddenCorner: chaosEngine.handleHiddenCorner.bind(chaosEngine),
    launchMinigame: chaosEngine.launchMinigame.bind(chaosEngine),
  };
}

import React from 'react';
import { gsap } from 'gsap';