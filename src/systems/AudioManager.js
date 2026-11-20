/**
 * Audio Manager — Handles all sound using Howler.js with Web Audio API
 * synthesis for generated effects. Respects autoplay policies.
 */

import { Howl, Howler } from 'howler';

// Sound configuration
const SOUND_CONFIG = {
  // UI Sounds
  buttonPress: { freq: 800, type: 'sine', duration: 0.1, volume: 0.3 },
  buttonHover: { freq: 1200, type: 'sine', duration: 0.05, volume: 0.15 },
  unlock: { freq: [523, 659, 784], type: 'triangle', duration: 0.5, volume: 0.4 },
  achievement: { freq: [659, 880, 1047, 1319], type: 'sine', duration: 0.8, volume: 0.5 },
  error: { freq: 200, type: 'sawtooth', duration: 0.3, volume: 0.3 },
  click: { freq: 1000, type: 'square', duration: 0.08, volume: 0.25 },
  success: { freq: [784, 1047], type: 'sine', duration: 0.4, volume: 0.4 },

  // Event Sounds
  airHorn: { freq: 233, type: 'sawtooth', duration: 1.5, volume: 0.6 },
  duck: { freq: [440, 330], type: 'square', duration: 0.3, volume: 0.4 },
  windowsError: { freq: [800, 600], type: 'square', duration: 0.5, volume: 0.5 },
  applause: { freq: [300, 400, 500], type: 'noise', duration: 1.5, volume: 0.3 },
  dramatic: { freq: [110, 82, 65], type: 'sine', duration: 2, volume: 0.5 },
  arcade: { freq: [1000, 1500, 2000], type: 'square', duration: 0.15, volume: 0.3 },
  victory: { freq: [784, 988, 1175, 1568], type: 'triangle', duration: 1, volume: 0.5 },
  suspense: { freq: [220, 207, 196], type: 'sine', duration: 3, volume: 0.2 },
  silence: { freq: 440, type: 'sine', duration: 0.1, volume: 0 },

  // Mini-game sounds
  gameStart: { freq: [523, 659, 784], type: 'sine', duration: 0.6, volume: 0.4 },
  gameWin: { freq: [784, 1047, 1319, 1568], type: 'triangle', duration: 1.5, volume: 0.5 },
  gameLose: { freq: [220, 165, 110], type: 'sawtooth', duration: 1, volume: 0.4 },
  tick: { freq: 2000, type: 'sine', duration: 0.05, volume: 0.2 },
};

class AudioManager {
  constructor() {
    this.enabled = false;
    this.volume = 0.7;
    this.sounds = new Map();
    this.audioContext = null;
    this.initialized = false;
    this.soundPack = 'default'; // default, retro, scifi, cartoon
    this.masterGain = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Create AudioContext (will be suspended until user interaction)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;

      // Configure Howler
      Howler.autoSuspend = true;
      Howler.html5PoolSize = 10;

      // Generate all sounds
      this.generateSounds();

      this.initialized = true;
      console.log('AudioManager initialized');
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
  }

  /**
   * Generate procedural sounds using Web Audio API
   */
  generateSounds() {
    if (!this.audioContext) return;

    for (const [name, config] of Object.entries(SOUND_CONFIG)) {
      this.sounds.set(name, this.createSound(config));
    }
  }

  createSound(config) {
    const ctx = this.audioContext;
    const frequencies = Array.isArray(config.freq) ? config.freq : [config.freq];
    const type = config.type;
    const duration = config.duration;
    const baseVolume = config.volume;

    return {
      play: (options = {}) => {
        if (!this.enabled || ctx.state === 'suspended') return;

        const volume = (options.volume ?? 1) * baseVolume * this.volume;
        const now = ctx.currentTime;

        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = type;
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(this.masterGain);

          const delay = options.stagger ? i * 0.1 : 0;
          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

          osc.start(now + delay);
          osc.stop(now + delay + duration + 0.1);
        });

        // Special handling for noise (applause)
        if (type === 'noise') {
          const bufferSize = ctx.sampleRate * duration;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          const gain = ctx.createGain();
          source.connect(gain);
          gain.connect(this.masterGain);
          gain.gain.setValueAtTime(volume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
          source.start(now);
          source.stop(now + duration);
        }
      },
    };
  }

  /**
   * Resume audio context (must be called from user gesture)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.enabled = true;
  }

  /**
   * Play a named sound
   */
  play(name, options = {}) {
    if (!this.enabled) return;
    const sound = this.sounds.get(name);
    if (sound) {
      sound.play(options);
    }
  }

  /**
   * Set master volume
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    Howler.volume(this.volume);
  }

  /**
   * Toggle enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      Howler.mute(true);
    } else {
      Howler.mute(false);
    }
  }

  /**
   * Set sound pack (changes frequency configs)
   */
  setSoundPack(pack) {
    this.soundPack = pack;
    // Could regenerate sounds with different configs per pack
  }

  /**
   * Play random musical note
   */
  playRandomNote() {
    const notes = [262, 294, 330, 349, 392, 440, 494, 523]; // C4-C5
    const note = notes[Math.floor(Math.random() * notes.length)];
    this.playTone(note, 'sine', 0.3, 0.3);
  }

  /**
   * Play custom tone
   */
  playTone(freq, type = 'sine', duration = 0.2, volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * this.volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    Howler.stop();
  }

  /**
   * Get current state
   */
  getState() {
    return {
      enabled: this.enabled,
      volume: this.volume,
      soundPack: this.soundPack,
    };
  }
}

// Singleton
export const audioManager = new AudioManager();

// React hook
export function useAudio() {
  const [state, setState] = React.useState(audioManager.getState());

  React.useEffect(() => {
    const unsub = storageManager.subscribe(data => {
      if (data.soundEnabled !== undefined) {
        audioManager.setEnabled(data.soundEnabled);
        setState(audioManager.getState());
      }
      if (data.volume !== undefined) {
        audioManager.setVolume(data.volume);
        setState(audioManager.getState());
      }
    });

    // Initialize on mount
    audioManager.initialize().then(() => {
      const saved = storageManager.load();
      audioManager.setEnabled(saved.soundEnabled);
      audioManager.setVolume(saved.volume);
      setState(audioManager.getState());
    });

    return unsub;
  }, []);

  const toggleSound = () => {
    const newEnabled = !state.enabled;
    audioManager.setEnabled(newEnabled);
    storageManager.set('soundEnabled', newEnabled);
    setState(audioManager.getState());
    if (newEnabled) audioManager.play('unlock');
  };

  const setVolume = (vol) => {
    audioManager.setVolume(vol);
    storageManager.set('volume', vol);
    setState(audioManager.getState());
  };

  const playSound = (name, options) => {
    if (state.enabled) audioManager.play(name, options);
  };

  return {
    ...state,
    toggleSound,
    setVolume,
    playSound,
    resume: audioManager.resume.bind(audioManager),
  };
}

import React from 'react';
import { storageManager } from '../utils/storage';