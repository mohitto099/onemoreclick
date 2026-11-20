/**
 * Storage Manager — Handles localStorage persistence with versioning,
 * migration, and corruption handling.
 */

import React from 'react';

const STORAGE_KEY = 'one-more-click-save';
const CURRENT_VERSION = 1;

const DEFAULT_SAVE = {
  version: CURRENT_VERSION,
  totalClicks: 0,
  unlockedFeatures: [],
  discoveredEvents: [],
  achievements: [],
  miniGameScores: {},
  soundEnabled: false,
  volume: 0.7,
  selectedTheme: 'default',
  reducedMotion: false,
  chaosModeActive: false,
  activeButtonId: 'main',
  buttonCollection: ['main'],
  secretRoomsDiscovered: [],
  statistics: {
    sessionStart: Date.now(),
    totalSessions: 1,
    longestStreak: 0,
    ducksCaught: 0,
    reactionBest: null,
    memoryBest: 0,
  },
  lastSaved: Date.now(),
};

const MIGRATIONS = {
  // Future migrations go here
  // 1: (data) => { ... }
};

/**
 * Deep clone an object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Validate save data structure
 */
function validateSave(data) {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.version !== 'number') return false;
  if (typeof data.totalClicks !== 'number') return false;
  if (!Array.isArray(data.unlockedFeatures)) return false;
  if (!Array.isArray(data.discoveredEvents)) return false;
  if (!Array.isArray(data.achievements)) return false;
  if (!Array.isArray(data.buttonCollection)) return false;
  if (typeof data.soundEnabled !== 'boolean') return false;
  if (typeof data.volume !== 'number') return false;
  if (typeof data.selectedTheme !== 'string') return false;
  return true;
}

/**
 * Migrate save data to current version
 */
function migrateSave(data) {
  let migrated = { ...data };
  const fromVersion = migrated.version || 0;

  for (let v = fromVersion + 1; v <= CURRENT_VERSION; v++) {
    if (MIGRATIONS[v]) {
      migrated = MIGRATIONS[v](migrated);
    }
  }

  migrated.version = CURRENT_VERSION;
  return migrated;
}

/**
 * Merge loaded data with defaults (handles new fields)
 */
function mergeWithDefaults(loaded) {
  const merged = deepClone(DEFAULT_SAVE);

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
    return target;
  }

  return deepMerge(merged, loaded);
}

/**
 * Storage Manager Class
 */
class StorageManager {
  constructor() {
    this.cache = null;
    this.listeners = new Set();
    this.available = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage unavailable, using session storage fallback');
      return false;
    }
  }

  getStorage() {
    if (this.available) return localStorage;
    // Fallback to sessionStorage
    return sessionStorage;
  }

  load() {
    if (this.cache) return this.cache;

    try {
      const storage = this.getStorage();
      const raw = storage.getItem(STORAGE_KEY);

      if (!raw) {
        this.cache = deepClone(DEFAULT_SAVE);
        return this.cache;
      }

      const parsed = JSON.parse(raw);

      if (!validateSave(parsed)) {
        console.warn('Invalid save data, resetting to defaults');
        this.cache = deepClone(DEFAULT_SAVE);
        return this.cache;
      }

      const migrated = migrateSave(parsed);
      this.cache = mergeWithDefaults(migrated);
      return this.cache;
    } catch (e) {
      console.error('Failed to load save data:', e);
      this.cache = deepClone(DEFAULT_SAVE);
      return this.cache;
    }
  }

  save(data) {
    try {
      const toSave = {
        ...data,
        lastSaved: Date.now(),
      };

      const storage = this.getStorage();
      storage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      this.cache = toSave;
      this.notifyListeners(toSave);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        this.notifyListeners({ error: 'quota_exceeded' });
      } else {
        console.error('Failed to save:', e);
      }
      return false;
    }
  }

  update(partial) {
    const current = this.load();
    const updated = { ...current, ...partial };
    return this.save(updated);
  }

  reset() {
    try {
      const storage = this.getStorage();
      storage.removeItem(STORAGE_KEY);
      this.cache = deepClone(DEFAULT_SAVE);
      this.notifyListeners(this.cache);
      return true;
    } catch (e) {
      console.error('Failed to reset:', e);
      return false;
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (e) {
        console.error('Storage listener error:', e);
      }
    });
  }

  // Convenience methods
  get(key) {
    return this.load()[key];
  }

  set(key, value) {
    return this.update({ [key]: value });
  }

  increment(key, amount = 1) {
    const current = this.load();
    return this.update({ [key]: (current[key] || 0) + amount });
  }

  addToArray(key, value) {
    const current = this.load();
    const arr = current[key] || [];
    if (!arr.includes(value)) {
      return this.update({ [key]: [...arr, value] });
    }
    return true;
  }

  removeFromArray(key, value) {
    const current = this.load();
    const arr = (current[key] || []).filter(v => v !== value);
    return this.update({ [key]: arr });
  }
}

// Singleton instance
export const storageManager = new StorageManager();

// React hook for using storage
export function useStorage(key) {
  const [value, setValue] = React.useState(() => storageManager.get(key));

  React.useEffect(() => {
    return storageManager.subscribe(data => {
      if (data[key] !== undefined) {
        setValue(data[key]);
      }
    });
  }, [key]);

  const update = (newValue) => {
    storageManager.set(key, newValue);
  };

  return [value, update];
}