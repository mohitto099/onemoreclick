/**
 * Achievement System — Manages achievement definitions, unlock detection, and notifications.
 */

import { storageManager } from '../utils/storage';
import { audioManager } from './AudioManager';

const ACHIEVEMENTS = [
  {
    id: 'first_contact',
    name: 'First Contact',
    description: 'Click the button for the first time.',
    icon: 'mouse-pointer-click',
    condition: (p) => p.totalClicks >= 1,
    category: 'progress',
  },
  {
    id: 'curious_soul',
    name: 'Curious Soul',
    description: 'Click the button 10 times.',
    icon: 'heart',
    condition: (p) => p.totalClicks >= 10,
    category: 'progress',
  },
  {
    id: 'getting_serious',
    name: 'Getting Serious',
    description: 'Click the button 50 times.',
    icon: 'target',
    condition: (p) => p.totalClicks >= 50,
    category: 'progress',
  },
  {
    id: 'no_turning_back',
    name: 'No Turning Back',
    description: 'Click the button 100 times.',
    icon: 'arrow-right',
    condition: (p) => p.totalClicks >= 100,
    category: 'progress',
  },
  {
    id: 'button_addict',
    name: 'Button Addict',
    description: 'Click the button 500 times.',
    icon: 'zap',
    condition: (p) => p.totalClicks >= 500,
    category: 'progress',
  },
  {
    id: 'certified_menace',
    name: 'Certified Menace',
    description: 'Click the button 1,000 times.',
    icon: 'skull',
    condition: (p) => p.totalClicks >= 1000,
    category: 'progress',
  },
  {
    id: 'duck_collector',
    name: 'Duck Collector',
    description: 'Discover all duck events (catch 10 ducks).',
    icon: 'bird',
    condition: (p) => (p.statistics.ducksCaught || 0) >= 10,
    category: 'discovery',
  },
  {
    id: 'chaos_agent',
    name: 'Chaos Agent',
    description: 'Activate Chaos Mode (reach 50 clicks).',
    icon: 'alert-triangle',
    condition: (p) => p.chaosModeActive === true,
    category: 'special',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Discover 10 hidden interactions.',
    icon: 'compass',
    condition: (p) => p.discoveredEvents.length >= 10,
    category: 'discovery',
  },
  {
    id: 'secret_hunter',
    name: 'Secret Hunter',
    description: 'Unlock a secret room.',
    icon: 'key',
    condition: (p) => p.secretRoomsDiscovered.length >= 1,
    category: 'secret',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a reaction test under 200ms.',
    icon: 'timer',
    condition: (p) => p.statistics.reactionBest && p.statistics.reactionBest < 200,
    category: 'skill',
  },
  {
    id: 'patient_human',
    name: 'Patient Human',
    description: 'Complete an intentionally long interaction (30s hold).',
    icon: 'hourglass',
    condition: (p) => p.statistics.longestStreak >= 30,
    category: 'skill',
  },
  {
    id: 'the_unclickable',
    name: 'The Unclickable',
    description: 'Discover the impossible button.',
    icon: 'ban',
    condition: (p) => p.discoveredEvents.includes('impossible_button'),
    category: 'secret',
  },
  {
    id: 'master_of_buttons',
    name: 'Master of Buttons',
    description: 'Unlock all standard buttons.',
    icon: 'layout-grid',
    condition: (p) => p.buttonCollection.length >= 10,
    category: 'collection',
  },
  {
    id: 'theme_collector',
    name: 'Theme Collector',
    description: 'Unlock all themes.',
    icon: 'palette',
    condition: (p) => p.unlockedFeatures.filter(f => f.startsWith('theme_')).length >= 4,
    category: 'collection',
  },
];

class AchievementSystem {
  constructor() {
    this.listeners = new Set();
    this.notificationQueue = [];
    this.showingNotification = false;
  }

  getAll() {
    return ACHIEVEMENTS;
  }

  getByCategory(category) {
    return ACHIEVEMENTS.filter(a => a.category === category);
  }

  getCategories() {
    return [...new Set(ACHIEVEMENTS.map(a => a.category))];
  }

  checkAchievements(progress) {
    const newlyUnlocked = [];
    for (const achievement of ACHIEVEMENTS) {
      if (!progress.achievements.includes(achievement.id) && achievement.condition(progress)) {
        newlyUnlocked.push(achievement);
      }
    }
    return newlyUnlocked;
  }

  unlockAchievement(id, progress) {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return false;

    if (!progress.achievements.includes(id)) {
      progress.achievements.push(id);
      this.queueNotification(achievement);
      audioManager.play('achievement');
      this.notify();
      return true;
    }
    return false;
  }

  queueNotification(achievement) {
    this.notificationQueue.push(achievement);
    this.processQueue();
  }

  async processQueue() {
    if (this.showingNotification || this.notificationQueue.length === 0) return;

    this.showingNotification = true;
    const achievement = this.notificationQueue.shift();

    // Notify listeners to show notification
    this.listeners.forEach(l => {
      try { l('show', achievement); } catch (e) { console.error('Achievement notification error:', e); }
    });

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 4000));

    this.listeners.forEach(l => {
      try { l('hide', achievement); } catch (e) { console.error('Achievement hide error:', e); }
    });

    this.showingNotification = false;
    this.processQueue();
  }

  isUnlocked(id, progress) {
    return progress.achievements.includes(id);
  }

  getUnlockedCount(progress) {
    return progress.achievements.length;
  }

  getTotalCount() {
    return ACHIEVEMENTS.length;
  }

  getProgress(achievementId, progress) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return 0;
    // For progress-based achievements, calculate percentage
    if (achievement.id.startsWith('first_contact') || achievement.id.includes('clicks')) {
      const target = parseInt(achievement.id.match(/\d+/)?.[0] || '1');
      return Math.min(100, (progress.totalClicks / target) * 100);
    }
    return this.isUnlocked(achievementId, progress) ? 100 : 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => {
      try { l('update'); } catch (e) { console.error('Achievement listener error:', e); }
    });
  }
}

export const achievementSystem = new AchievementSystem();

// React hook
export function useAchievements() {
  const [progress, setProgress] = React.useState(() => storageManager.load());
  const [notifications, setNotifications] = React.useState([]);

  React.useEffect(() => {
    const unsubStorage = storageManager.subscribe(data => {
      setProgress({ ...data });
    });

    const unsubAchievement = achievementSystem.subscribe((type, achievement) => {
      if (type === 'show') {
        setNotifications(prev => [...prev, { ...achievement, timestamp: Date.now() }]);
      } else if (type === 'hide') {
        setNotifications(prev => prev.filter(n => n.id !== achievement.id));
      }
    });

    return () => {
      unsubStorage();
      unsubAchievement();
    };
  }, []);

  const checkAchievements = () => {
    const newAchievements = achievementSystem.checkAchievements(progress);
    newAchievements.forEach(a => achievementSystem.unlockAchievement(a.id, storageManager.load()));
  };

  const isUnlocked = (id) => achievementSystem.isUnlocked(id, progress);
  const getUnlockedCount = () => achievementSystem.getUnlockedCount(progress);
  const getTotalCount = () => achievementSystem.getTotalCount();
  const getProgress = (id) => achievementSystem.getProgress(id, progress);

  return {
    achievements: ACHIEVEMENTS,
    progress,
    notifications,
    isUnlocked,
    getUnlockedCount,
    getTotalCount,
    getProgress,
    checkAchievements,
    categories: achievementSystem.getCategories(),
  };
}

import React from 'react';