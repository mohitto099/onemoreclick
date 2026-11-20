import { useState, useEffect, useCallback } from 'react';
import { audioManager } from '../systems/AudioManager';

/**
 * Hook for managing sound effects with preloading
 */
export function useSound(name) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Sound is generated procedurally, so it's always "loaded"
    setLoaded(true);
  }, [name]);

  const play = useCallback((options = {}) => {
    if (audioManager.enabled) {
      audioManager.play(name, options);
    }
  }, [name]);

  const stop = useCallback(() => {
    // Procedural sounds can't be stopped individually easily
    // Would need Howler.js instances for that
  }, []);

  return { play, stop, loaded };
}

/**
 * Hook for managing multiple sounds
 */
export function useSoundBoard(sounds) {
  const play = useCallback((name, options) => {
    if (audioManager.enabled && sounds.includes(name)) {
      audioManager.play(name, options);
    }
  }, [sounds]);

  return { play };
}

/**
 * Hook for background ambient sounds
 */
export function useAmbient(soundName, options = {}) {
  const [playing, setPlaying] = useState(false);

  const start = useCallback(() => {
    if (audioManager.enabled) {
      // For ambient, we'd use a looping Howler sound
      setPlaying(true);
    }
  }, [soundName]);

  const stop = useCallback(() => {
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (playing) stop();
    };
  }, [playing, stop]);

  return { playing, start, stop };
}