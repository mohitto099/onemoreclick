/**
 * Event Registry — Defines all events with triggers, probabilities, and handlers.
 * Events are organized by category for easy management.
 */

import { audioManager } from './AudioManager';
import { storageManager } from '../utils/storage';
import { gsap } from 'gsap';

/**
 * Create a standard event object
 */
function createEvent(config) {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    category: config.category,
    trigger: config.trigger || 'click',
    probability: config.probability ?? 0.1,
    cooldown: config.cooldown ?? 0,
    unlockRequirement: config.unlockRequirement ?? null,
    handler: config.handler,
    cleanup: config.cleanup,
    metadata: config.metadata || {},
    lastTriggered: 0,
    timesTriggered: 0,
  };
}

/**
 * Event Cooldown Manager
 */
class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
  }

  isReady(eventId, cooldown) {
    const last = this.cooldowns.get(eventId) || 0;
    return Date.now() - last >= cooldown;
  }

  setCooldown(eventId) {
    this.cooldowns.set(eventId, Date.now());
  }

  clear(eventId) {
    this.cooldowns.delete(eventId);
  }

  clearAll() {
    this.cooldowns.clear();
  }
}

/**
 * Button Behaviour Events
 */
const buttonEvents = [
  createEvent({
    id: 'button_escape',
    name: 'Button Escape',
    description: 'The button moves away when you try to click it',
    category: 'button',
    trigger: 'hover',
    probability: 0.15,
    cooldown: 3000,
    unlockRequirement: { clicks: 10 },
    handler: ({ ui, engine }) => {
      const btn = ui.getMainButton();
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      const padding = 100;

      let newX, newY;
      let attempts = 0;
      do {
        newX = Math.random() * (viewport.w - rect.width - padding * 2) + padding;
        newY = Math.random() * (viewport.h - rect.height - padding * 2) + padding;
        attempts++;
      } while (attempts < 10 && Math.abs(newX - rect.left) < 200 && Math.abs(newY - rect.top) < 200);

      gsap.to(btn, {
        x: newX - rect.left,
        y: newY - rect.top,
        duration: 0.4,
        ease: 'back.out(1.7)',
        onComplete: () => {
          btn.style.transform = '';
          btn.dataset.escaped = 'true';
          setTimeout(() => delete btn.dataset.escaped, 100);
        },
      });

      audioManager.play('buttonHover');
    },
  }),

  createEvent({
    id: 'button_shrink',
    name: 'Button Shrink',
    description: 'The button gets smaller with each press',
    category: 'button',
    probability: 0.1,
    cooldown: 0,
    unlockRequirement: { clicks: 20 },
    handler: ({ ui, engine, progress }) => {
      const btn = ui.getMainButton();
      if (!btn) return;

      const currentScale = parseFloat(btn.dataset.scale || '1');
      const newScale = Math.max(0.3, currentScale * 0.9);
      btn.dataset.scale = newScale.toString();

      gsap.to(btn, {
        scale: newScale,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)',
      });

      if (newScale <= 0.4) {
        ui.showStatus('The button is getting shy...', 'warning');
      }

      audioManager.play('click');
    },
    cleanup: ({ ui }) => {
      const btn = ui.getMainButton();
      if (btn) {
        gsap.to(btn, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
        delete btn.dataset.scale;
      }
    },
  }),

  createEvent({
    id: 'button_growth',
    name: 'Button Growth',
    description: 'The button grows larger with each press',
    category: 'button',
    probability: 0.1,
    cooldown: 0,
    unlockRequirement: { clicks: 15 },
    handler: ({ ui, engine, progress }) => {
      const btn = ui.getMainButton();
      if (!btn) return;

      const currentScale = parseFloat(btn.dataset.growthScale || '1');
      const newScale = Math.min(3, currentScale * 1.15);
      btn.dataset.growthScale = newScale.toString();

      gsap.to(btn, {
        scale: newScale,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)',
      });

      if (newScale >= 2) {
        ui.showStatus('The button is getting confident!', 'success');
      }

      audioManager.play('click');
    },
    cleanup: ({ ui }) => {
      const btn = ui.getMainButton();
      if (btn) {
        gsap.to(btn, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
        delete btn.dataset.growthScale;
      }
    },
  }),

  createEvent({
    id: 'button_clone',
    name: 'Button Clone',
    description: 'Creates multiple fake buttons',
    category: 'button',
    probability: 0.08,
    cooldown: 10000,
    unlockRequirement: { clicks: 30 },
    handler: ({ ui, engine }) => {
      const container = ui.getButtonContainer();
      const original = ui.getMainButton();
      if (!container || !original) return;

      const clones = [];
      for (let i = 0; i < 4; i++) {
        const clone = document.createElement('button');
        clone.className = 'btn btn-primary button-clone';
        clone.textContent = original.textContent;
        clone.style.position = 'absolute';
        clone.style.pointerEvents = 'auto';
        clone.style.zIndex = '10';
        clone.style.opacity = '0';
        clone.style.transform = 'scale(0.5)';

        const rect = original.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        clone.style.left = `${rect.left - containerRect.left + (Math.random() - 0.5) * 200}px`;
        clone.style.top = `${rect.top - containerRect.top + (Math.random() - 0.5) * 100}px`;

        clone.addEventListener('click', (e) => {
          e.stopPropagation();
          ui.showStatus('Wrong button!', 'error');
          audioManager.play('error');
          gsap.to(clone, { scale: 0, opacity: 0, duration: 0.2, onComplete: () => clone.remove() });
        });

        container.appendChild(clone);
        clones.push(clone);

        gsap.to(clone, { opacity: 1, scale: 1, duration: 0.3, delay: i * 0.1, ease: 'back.out(1.7)' });
      }

      // Remove clones after 5 seconds
      setTimeout(() => {
        clones.forEach((clone, i) => {
          gsap.to(clone, { opacity: 0, scale: 0.5, duration: 0.3, delay: i * 0.05, onComplete: () => clone.remove() });
        });
      }, 5000);

      audioManager.play('arcade');
    },
  }),

  createEvent({
    id: 'button_rotation',
    name: 'Button Rotation',
    description: 'The button spins after activation',
    category: 'button',
    probability: 0.2,
    cooldown: 5000,
    handler: ({ ui, engine }) => {
      const btn = ui.getMainButton();
      if (!btn) return;

      const rotation = 360 * (Math.random() > 0.5 ? 1 : -1);
      gsap.to(btn, {
        rotation: `+=${rotation}`,
        duration: 0.8,
        ease: 'power2.out',
      });

      audioManager.play('arcade');
    },
  }),

  createEvent({
    id: 'button_teleport',
    name: 'Button Teleport',
    description: 'The button appears at a different screen position',
    category: 'button',
    probability: 0.12,
    cooldown: 8000,
    unlockRequirement: { clicks: 25 },
    handler: ({ ui, engine }) => {
      const btn = ui.getMainButton();
      const container = ui.getButtonContainer();
      if (!btn || !container) return;

      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const padding = 50;

      const newX = Math.random() * (containerRect.width - btnRect.width - padding * 2) + padding;
      const newY = Math.random() * (containerRect.height - btnRect.height - padding * 2) + padding;

      gsap.to(btn, {
        x: newX - btnRect.left + (btn.offsetLeft || 0),
        y: newY - btnRect.top + (btn.offsetTop || 0),
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          btn.style.transform = '';
          btn.style.left = `${newX}px`;
          btn.style.top = `${newY}px`;
          btn.style.position = 'absolute';
        },
      });

      audioManager.play('buttonPress');
    },
  }),

  createEvent({
    id: 'button_invisibility',
    name: 'Button Invisibility',
    description: 'The button temporarily disappears',
    category: 'button',
    probability: 0.08,
    cooldown: 15000,
    unlockRequirement: { clicks: 40 },
    handler: ({ ui, engine }) => {
      const btn = ui.getMainButton();
      if (!btn) return;

      gsap.to(btn, { opacity: 0, scale: 0.8, duration: 0.3 });
      ui.showStatus('Where did it go?', 'info');

      setTimeout(() => {
        gsap.to(btn, { opacity: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
        ui.showStatus('There it is!', 'success');
      }, 2000);

      audioManager.play('suspense');
    },
  }),

  createEvent({
    id: 'button_fakeout',
    name: 'Button Fakeout',
    description: 'The button changes its label at the last moment',
    category: 'button',
    probability: 0.15,
    cooldown: 5000,
    handler: ({ ui, engine }) => {
      const btn = ui.getMainButton();
      if (!btn) return;

      const fakeLabels = [
        'DO NOT PRESS',
        'PRESS ME',
        'I DARE YOU',
        'FREE CANDY',
        'DELETE INTERNET',
        'SELF DESTRUCT',
        'MAYBE TOMORROW',
        'ERROR 404',
      ];

      const originalLabel = btn.textContent;
      const fakeLabel = fakeLabels[Math.floor(Math.random() * fakeLabels.length)];

      btn.textContent = fakeLabel;
      gsap.fromTo(btn, { scale: 1.1 }, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' });

      setTimeout(() => {
        btn.textContent = originalLabel;
      }, 1500);

      audioManager.play('buttonHover');
    },
  }),

  createEvent({
    id: 'button_personality',
    name: 'Button Personality',
    description: 'The button displays sarcastic messages',
    category: 'button',
    probability: 0.25,
    cooldown: 2000,
    handler: ({ ui, engine, progress }) => {
      const messages = [
        'Oh, you\'re back.',
        'Really? Again?',
        'My finger hurts.',
        'Click. Click. Click.',
        'Do you have a hobby?',
        'Button abuse hotline: 1-800-STOP-IT',
        'I\'m just a button, leave me alone.',
        'Click count: ' + progress.totalClicks + '. Impressive? No.',
        'Have you tried turning it off and on?',
        'Error: Keyboard not found. Press F1 to continue.',
      ];

      const msg = messages[Math.floor(Math.random() * messages.length)];
      ui.showStatus(msg, 'info', 3000);
    },
  }),

  createEvent({
    id: 'button_evolution',
    name: 'Button Evolution',
    description: 'The button changes appearance at milestones',
    category: 'button',
    probability: 1, // Deterministic at milestones
    cooldown: 0,
    trigger: 'milestone',
    handler: ({ ui, engine, progress, milestone }) => {
      const btn = ui.getMainButton();
      if (!btn) return;

      const evolutions = {
        10: { class: 'btn-evolved-1', label: 'PRESS ME' },
        50: { class: 'btn-evolved-2', label: 'KEEP GOING' },
        100: { class: 'btn-evolved-3', label: 'YOU CAN\'T STOP' },
        250: { class: 'btn-evolved-4', label: 'ADDICTED' },
        500: { class: 'btn-evolved-5', label: 'MASTER' },
        1000: { class: 'btn-evolved-max', label: 'ULTIMATE' },
      };

      const evolution = evolutions[milestone];
      if (evolution) {
        btn.classList.add(evolution.class);
        btn.textContent = evolution.label;
        gsap.fromTo(btn, { scale: 1.2 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
        audioManager.play('unlock');
      }
    },
  }),
];

/**
 * Visual Chaos Events
 */
const visualEvents = [
  createEvent({
    id: 'screen_shake',
    name: 'Screen Shake',
    description: 'The entire interface shakes violently',
    category: 'visual',
    probability: 0.2,
    cooldown: 10000,
    handler: ({ ui, engine }) => {
      const container = ui.getMainContainer();
      if (!container) return;

      container.classList.add('animate-screen-shake');
      audioManager.play('dramatic');

      setTimeout(() => container.classList.remove('animate-screen-shake'), 600);
    },
  }),

  createEvent({
    id: 'screen_flip',
    name: 'Screen Flip',
    description: 'The interface rotates 360 degrees',
    category: 'visual',
    probability: 0.05,
    cooldown: 30000,
    unlockRequirement: { clicks: 50 },
    handler: ({ ui, engine }) => {
      const container = ui.getMainContainer();
      if (!container) return;

      container.style.transformOrigin = 'center center';
      container.classList.add('animate-screen-flip');
      audioManager.play('dramatic');

      setTimeout(() => {
        container.classList.remove('animate-screen-flip');
        container.style.transformOrigin = '';
      }, 1000);
    },
  }),

  createEvent({
    id: 'gravity_mode',
    name: 'Gravity Mode',
    description: 'Visual elements fall downward',
    category: 'visual',
    probability: 0.08,
    cooldown: 20000,
    unlockRequirement: { clicks: 75 },
    handler: ({ ui, engine }) => {
      const elements = document.querySelectorAll('.gravity-affected');
      elements.forEach((el, i) => {
        el.style.transition = 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.transform = `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg)`;
        el.style.opacity = '0';
      });

      ui.showStatus('Gravity increased!', 'warning');
      audioManager.play('dramatic');

      setTimeout(() => {
        elements.forEach(el => {
          el.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
          el.style.transform = '';
          el.style.opacity = '';
        });
        ui.showStatus('Gravity normalized.', 'success');
      }, 5000);
    },
  }),

  createEvent({
    id: 'rainbow_mode',
    name: 'Rainbow Mode',
    description: 'Animated rainbow colors everywhere',
    category: 'visual',
    probability: 0.1,
    cooldown: 15000,
    unlockRequirement: { clicks: 60 },
    handler: ({ ui, engine }) => {
      document.body.classList.add('animate-rainbow');
      ui.showStatus('🌈 RAINBOW MODE ACTIVATED 🌈', 'success');
      audioManager.play('victory');

      setTimeout(() => {
        document.body.classList.remove('animate-rainbow');
      }, 5000);
    },
  }),

  createEvent({
    id: 'disco_mode',
    name: 'Disco Mode',
    description: 'Flashing colorful lighting effects',
    category: 'visual',
    probability: 0.08,
    cooldown: 20000,
    unlockRequirement: { clicks: 80 },
    handler: ({ ui, engine }) => {
      document.body.classList.add('animate-disco');
      ui.showStatus('🕺 DISCO MODE 🕺', 'success');
      audioManager.play('arcade');

      setTimeout(() => {
        document.body.classList.remove('animate-disco');
      }, 4000);
    },
  }),

  createEvent({
    id: 'pixel_mode',
    name: 'Pixel Mode',
    description: 'Transforms visual appearance into pixel art',
    category: 'visual',
    probability: 0.06,
    cooldown: 30000,
    unlockRequirement: { clicks: 100 },
    handler: ({ ui, engine }) => {
      document.body.style.imageRendering = 'pixelated';
      document.body.style.filter = 'pixelate(4px)';
      ui.showStatus('Pixelated!', 'info');
      audioManager.play('arcade');

      setTimeout(() => {
        document.body.style.imageRendering = '';
        document.body.style.filter = '';
      }, 8000);
    },
  }),

  createEvent({
    id: 'giant_mode',
    name: 'Giant Mode',
    description: 'Enlarges interface elements',
    category: 'visual',
    probability: 0.08,
    cooldown: 15000,
    handler: ({ ui, engine }) => {
      const container = ui.getMainContainer();
      if (!container) return;

      gsap.to(container, { scale: 1.5, duration: 0.5, ease: 'power2.out' });
      ui.showStatus('Everything is BIGGER!', 'success');

      setTimeout(() => {
        gsap.to(container, { scale: 1, duration: 0.5, ease: 'power2.in' });
      }, 5000);

      audioManager.play('dramatic');
    },
  }),

  createEvent({
    id: 'tiny_mode',
    name: 'Tiny Mode',
    description: 'Shrinks interface elements',
    category: 'visual',
    probability: 0.08,
    cooldown: 15000,
    handler: ({ ui, engine }) => {
      const container = ui.getMainContainer();
      if (!container) return;

      gsap.to(container, { scale: 0.5, duration: 0.5, ease: 'power2.out' });
      ui.showStatus('Everything is tiny...', 'info');

      setTimeout(() => {
        gsap.to(container, { scale: 1, duration: 0.5, ease: 'power2.in' });
      }, 5000);

      audioManager.play('buttonHover');
    },
  }),

  createEvent({
    id: 'confetti_explosion',
    name: 'Confetti Explosion',
    description: 'Triggers a particle celebration',
    category: 'visual',
    probability: 1, // Only on milestones
    trigger: 'milestone',
    cooldown: 0,
    handler: ({ ui, engine, progress, milestone }) => {
      ui.spawnConfetti(milestone >= 100 ? 200 : 100);
      audioManager.play('victory');
    },
  }),
];

/**
 * Random Surprise Events
 */
const surpriseEvents = [
  createEvent({
    id: 'rubber_duck',
    name: 'Rubber Duck',
    description: 'A duck appears and waddles across the screen',
    category: 'surprise',
    probability: 0.12,
    cooldown: 15000,
    unlockRequirement: { clicks: 5 },
    handler: ({ ui, engine }) => {
      ui.spawnDuck();
      audioManager.play('duck');
      storageManager.addToArray('statistics.ducksCaught', 1);
    },
  }),

  createEvent({
    id: 'duck_army',
    name: 'Duck Army',
    description: 'Multiple ducks invade the interface',
    category: 'surprise',
    probability: 0.03,
    cooldown: 60000,
    unlockRequirement: { clicks: 100, achievements: ['duck_collector'] },
    handler: ({ ui, engine }) => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => ui.spawnDuck(), i * 200);
      }
      ui.showStatus('DUCK ARMY INCOMING! 🦆', 'success');
      audioManager.play('duck');
      audioManager.play('applause');
    },
  }),

  createEvent({
    id: 'ufo_visit',
    name: 'UFO Visit',
    description: 'A flying saucer crosses the screen',
    category: 'surprise',
    probability: 0.05,
    cooldown: 30000,
    unlockRequirement: { clicks: 50 },
    handler: ({ ui, engine }) => {
      ui.spawnUFO();
      audioManager.play('suspense');
    },
  }),

  createEvent({
    id: 'meteor_shower',
    name: 'Meteor Shower',
    description: 'Harmless animated meteors appear',
    category: 'surprise',
    probability: 0.06,
    cooldown: 25000,
    unlockRequirement: { clicks: 75 },
    handler: ({ ui, engine }) => {
      ui.spawnMeteors(15);
      audioManager.play('dramatic');
    },
  }),

  createEvent({
    id: 'cat_appearance',
    name: 'Cat Appearance',
    description: 'A random animated cat appears',
    category: 'surprise',
    probability: 0.04,
    cooldown: 45000,
    unlockRequirement: { clicks: 60 },
    handler: ({ ui, engine }) => {
      ui.spawnCat();
      audioManager.play('buttonHover');
    },
  }),

  createEvent({
    id: 'alien_message',
    name: 'Alien Message',
    description: 'A mysterious message appears',
    category: 'surprise',
    probability: 0.05,
    cooldown: 30000,
    unlockRequirement: { clicks: 80 },
    handler: ({ ui, engine }) => {
      const messages = [
        'EARTHLINGS. YOUR BUTTON AMUSES US.',
        'WE COME IN PEACE. ALSO FOR YOUR CLICKS.',
        'THE BUTTON IS A LIE. OR IS IT?',
        'ZORGLAX DEMANDS MORE CLICKS.',
        'YOUR LEADER IS A BUTTON.',
        'CLICK. CLICK. CLICK. THE RHYTHM OF THE UNIVERSE.',
      ];
      ui.showModal('👽 ALIEN TRANSMISSION', messages[Math.floor(Math.random() * messages.length)]);
      audioManager.play('suspense');
    },
  }),

  createEvent({
    id: 'unexpected_applause',
    name: 'Unexpected Applause',
    description: 'Applause plays for no reason',
    category: 'surprise',
    probability: 0.1,
    cooldown: 10000,
    handler: ({ ui, engine }) => {
      ui.showStatus('👏 👏 👏 BRAVO! 👏 👏 👏', 'success');
      audioManager.play('applause');
    },
  }),

  createEvent({
    id: 'fake_congratulations',
    name: 'Fake Congratulations',
    description: 'You win an absurd imaginary award',
    category: 'surprise',
    probability: 0.08,
    cooldown: 20000,
    handler: ({ ui, engine }) => {
      const awards = [
        'World\'s Best Button Clicker',
        'Certified Click Champion',
        'Grand Master of Pointless Clicks',
        'Supreme Button Toucher',
        'Doctor of Clickology',
        'Emperor of the Click Domain',
      ];
      const award = awards[Math.floor(Math.random() * awards.length)];
      ui.showModal('🏆 CONGRATULATIONS!', `You have earned: "${award}"\n\nThis certificate is valid nowhere.`);
      audioManager.play('victory');
    },
  }),

  createEvent({
    id: 'dramatic_countdown',
    name: 'Dramatic Countdown',
    description: 'A countdown ends in an unexpected result',
    category: 'surprise',
    probability: 0.04,
    cooldown: 60000,
    unlockRequirement: { clicks: 100 },
    handler: ({ ui, engine }) => {
      let count = 10;
      const modal = ui.showModal('⏰ COUNTDOWN', `${count}`, { closable: false });

      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          modal.updateContent(`${count}`);
          audioManager.play('tick');
        } else {
          clearInterval(interval);
          const endings = [
            'TIME\'S UP! Nothing happens.',
            'BOOM! Just kidding.',
            'Congratulations! You waited 10 seconds.',
            'The countdown was the reward.',
            'Error: Countdown not found.',
          ];
          modal.updateContent(endings[Math.floor(Math.random() * endings.length)]);
          modal.setClosable(true);
          audioManager.play(count === 0 ? 'victory' : 'error');
        }
      }, 1000);
    },
  }),

  createEvent({
    id: 'mystery_gift',
    name: 'Mystery Gift',
    description: 'A random visual surprise is revealed',
    category: 'surprise',
    probability: 0.07,
    cooldown: 20000,
    handler: ({ ui, engine }) => {
      const gifts = [
        () => ui.spawnConfetti(50),
        () => ui.showStatus('✨ You found a shiny penny!', 'success'),
        () => audioManager.play('unlock'),
        () => ui.showStatus('🎁 Surprise! It\'s... nothing!', 'info'),
        () => storageManager.increment('totalClicks', 5),
      ];
      gifts[Math.floor(Math.random() * gifts.length)]();
    },
  }),
];

/**
 * Sound Experience Events
 */
const soundEvents = [
  createEvent({
    id: 'air_horn',
    name: 'Air Horn',
    description: 'Plays an air horn sound',
    category: 'sound',
    probability: 0.05,
    cooldown: 30000,
    handler: () => audioManager.play('airHorn'),
  }),

  createEvent({
    id: 'dramatic_cinematic',
    name: 'Dramatic Cinematic Sound',
    description: 'Triggers an exaggerated dramatic sound',
    category: 'sound',
    probability: 0.06,
    cooldown: 20000,
    handler: () => audioManager.play('dramatic'),
  }),

  createEvent({
    id: 'arcade_sound',
    name: 'Arcade Sound',
    description: 'Retro button sound effects',
    category: 'sound',
    probability: 0.15,
    cooldown: 2000,
    handler: () => audioManager.play('arcade'),
  }),

  createEvent({
    id: 'duck_sound',
    name: 'Duck Sound',
    description: 'Duck quacking',
    category: 'sound',
    probability: 0.1,
    cooldown: 5000,
    handler: () => audioManager.play('duck'),
  }),

  createEvent({
    id: 'windows_error',
    name: 'Windows Error Sound',
    description: 'A simulated computer error sound',
    category: 'sound',
    probability: 0.05,
    cooldown: 15000,
    handler: () => audioManager.play('windowsError'),
  }),

  createEvent({
    id: 'crowd_applause',
    name: 'Crowd Applause',
    description: 'Audience applause',
    category: 'sound',
    probability: 0.08,
    cooldown: 10000,
    handler: () => audioManager.play('applause'),
  }),

  createEvent({
    id: 'suspense_sound',
    name: 'Suspense Sound',
    description: 'Builds anticipation',
    category: 'sound',
    probability: 0.05,
    cooldown: 20000,
    handler: () => audioManager.play('suspense'),
  }),

  createEvent({
    id: 'victory_sound',
    name: 'Victory Sound',
    description: 'Plays an achievement sound',
    category: 'sound',
    probability: 0.1,
    trigger: 'achievement',
    cooldown: 0,
    handler: () => audioManager.play('victory'),
  }),

  createEvent({
    id: 'random_musical_note',
    name: 'Random Musical Note',
    description: 'Plays a random musical note',
    category: 'sound',
    probability: 0.12,
    cooldown: 3000,
    handler: () => audioManager.playRandomNote(),
  }),

  createEvent({
    id: 'silence_mode',
    name: 'Silence Mode',
    description: 'Temporarily disables all website sounds',
    category: 'sound',
    probability: 0.02,
    cooldown: 60000,
    handler: ({ ui, engine }) => {
      const wasEnabled = audioManager.enabled;
      audioManager.setEnabled(false);
      ui.showStatus('🔇 SILENCE MODE ACTIVATED', 'warning');
      setTimeout(() => {
        audioManager.setEnabled(wasEnabled);
        ui.showStatus('🔊 Sound restored', 'success');
      }, 5000);
    },
  }),
];

/**
 * Interface Prank Events
 */
const interfaceEvents = [
  createEvent({
    id: 'fake_loading',
    name: 'Fake Loading',
    description: 'Shows an intentionally unnecessary loading sequence',
    category: 'interface',
    probability: 0.1,
    cooldown: 30000,
    unlockRequirement: { clicks: 30 },
    handler: ({ ui, engine }) => {
      const messages = [
        'Loading quantum button...',
        'Calibrating click matrix...',
        'Downloading more buttons...',
        'Training AI to click for you...',
        'Negotiating with the button...',
        'Applying click enhancer...',
        'Buffering anticipation...',
        'Rendering invisible pixels...',
      ];

      let step = 0;
      const modal = ui.showModal('⏳ LOADING', messages[0], { closable: false, showProgress: true });
      modal.updateProgress(0);

      const interval = setInterval(() => {
        step++;
        if (step < messages.length) {
          modal.updateContent(messages[step]);
          modal.updateProgress((step / messages.length) * 100);
          audioManager.play('tick');
        } else {
          clearInterval(interval);
          const endings = [
            'Complete! Nothing changed.',
            'Error: Loading cancelled by user apathy.',
            'Success! The button is still a button.',
            'Loaded: 100% skepticism.',
          ];
          modal.updateContent(endings[Math.floor(Math.random() * endings.length)]);
          modal.updateProgress(100);
          modal.setClosable(true);
          audioManager.play('windowsError');
        }
      }, 800);
    },
  }),

  createEvent({
    id: 'fake_crash',
    name: 'Fake Crash',
    description: 'Displays a clearly simulated browser-style crash',
    category: 'interface',
    probability: 0.03,
    cooldown: 60000,
    unlockRequirement: { clicks: 75 },
    handler: ({ ui, engine }) => {
      const crashMessages = [
        'BUTTON_OVERFLOW_EXCEPTION at 0xDEADBEEF',
        'STACK_OVERFLOW: Too many clicks detected',
        'KERNEL_PANIC: Button not found',
        'FATAL_ERROR: User clicked too fast',
        'SYSTEM_HALT: Button refused to cooperate',
      ];

      ui.showModal('💥 SYSTEM CRASH', crashMessages[Math.floor(Math.random() * crashMessages.length)] + '\n\n(Just kidding. Your computer is fine.)', { closable: true });
      audioManager.play('windowsError');
      document.body.classList.add('animate-screen-shake');
      setTimeout(() => document.body.classList.remove('animate-screen-shake'), 1000);
    },
  }),

  createEvent({
    id: 'fake_update',
    name: 'Fake Update',
    description: 'Pretends to install an absurd update',
    category: 'interface',
    probability: 0.04,
    cooldown: 45000,
    unlockRequirement: { clicks: 100 },
    handler: ({ ui, engine }) => {
      const updates = [
        'Button OS v2.0 "Clickier Edition"',
        'Hotfix: Button now 50% more clickable',
        'Security Patch: Prevents button escape',
        'Feature: Button now screams when clicked',
        'Update: Added "Unclick" button (premium)',
      ];

      let progress = 0;
      const modal = ui.showModal('🔄 INSTALLING UPDATE', updates[Math.floor(Math.random() * updates.length)], { closable: false, showProgress: true });
      modal.updateProgress(0);

      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress < 100) {
          modal.updateProgress(Math.min(progress, 99));
          audioManager.play('tick');
        } else {
          clearInterval(interval);
          modal.updateProgress(100);
          modal.updateContent('Update complete! Restart required.\n\n(Reload the page to "restart")');
          modal.setClosable(true);
          audioManager.play('victory');
        }
      }, 300);
    },
  }),

  createEvent({
    id: 'fake_security_scan',
    name: 'Fake Security Scan',
    description: 'Scans the website itself',
    category: 'interface',
    probability: 0.04,
    cooldown: 40000,
    unlockRequirement: { clicks: 80 },
    handler: ({ ui, engine }) => {
      const threats = [
        'Suspicious click pattern detected',
        'Button exhibiting anomalous behavior',
        'User addiction level: CRITICAL',
        'Excessive dopamine detected',
        'Button sentience probability: 12%',
      ];

      let step = 0;
      const modal = ui.showModal('🔒 SECURITY SCAN', 'Initializing scan...', { closable: false, showProgress: true });
      modal.updateProgress(0);

      const interval = setInterval(() => {
        step++;
        if (step <= threats.length) {
          modal.updateContent(`Scanning... ${threats[step - 1]}`);
          modal.updateProgress((step / threats.length) * 100);
          audioManager.play('tick');
        } else {
          clearInterval(interval);
          modal.updateProgress(100);
          modal.updateContent('Scan complete!\n\nThreats found: ' + threats.length + '\nAction: None (it\'s just a website)');
          modal.setClosable(true);
          audioManager.play('success');
        }
      }, 600);
    },
  }),

  createEvent({
    id: 'endless_progress_bar',
    name: 'Endless Progress Bar',
    description: 'Appears to make no progress before a humorous ending',
    category: 'interface',
    probability: 0.05,
    cooldown: 30000,
    handler: ({ ui, engine }) => {
      const modal = ui.showModal('∞ ENDLESS PROGRESS', 'Please wait...', { closable: false, showProgress: true });
      modal.updateProgress(0);

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 2;
        if (progress < 99) {
          modal.updateProgress(Math.min(progress, 98.9));
        } else {
          clearInterval(interval);
          modal.updateProgress(100);
          const endings = [
            'Complete! You waited for nothing.',
            'Error: Progress bar reached existential crisis.',
            'Success! The journey was the destination.',
            'Loading... ████████████ 99% [█░░░░░░░░░]',
          ];
          modal.updateContent(endings[Math.floor(Math.random() * endings.length)]);
          modal.setClosable(true);
          audioManager.play('windowsError');
        }
      }, 100);
    },
  }),

  createEvent({
    id: 'confused_interface',
    name: 'Confused Interface',
    description: 'Temporarily swaps interface labels',
    category: 'interface',
    probability: 0.06,
    cooldown: 20000,
    unlockRequirement: { clicks: 50 },
    handler: ({ ui, engine }) => {
      const swaps = [
        { selector: '.click-counter', text: 'Clicks remaining: ∞' },
        { selector: '.status-message', text: 'System: Operational (mostly)' },
        { selector: '.progress-label', text: 'Distance to goal: 42 light-years' },
      ];

      swaps.forEach(swap => {
        const el = document.querySelector(swap.selector);
        if (el) {
          el.dataset.originalText = el.textContent;
          el.textContent = swap.text;
        }
      });

      ui.showStatus('Interface confused...', 'warning');
      audioManager.play('buttonHover');

      setTimeout(() => {
        swaps.forEach(swap => {
          const el = document.querySelector(swap.selector);
          if (el && el.dataset.originalText) {
            el.textContent = el.dataset.originalText;
            delete el.dataset.originalText;
          }
        });
        ui.showStatus('Interface restored.', 'success');
      }, 5000);
    },
  }),

  createEvent({
    id: 'panic_mode',
    name: 'Panic Mode',
    description: 'Introduces harmless interface chaos',
    category: 'interface',
    probability: 0.03,
    cooldown: 60000,
    unlockRequirement: { clicks: 150 },
    handler: ({ ui, engine }) => {
      const container = ui.getMainContainer();
      if (!container) return;

      container.classList.add('animate-screen-shake', 'animate-rainbow');
      ui.showStatus('🚨 PANIC MODE ACTIVATED 🚨', 'error');
      audioManager.play('dramatic');
      audioManager.play('airHorn');

      // Randomly move buttons
      const buttons = container.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn !== ui.getMainButton()) {
          gsap.to(btn, {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            rotation: (Math.random() - 0.5) * 30,
            duration: 0.3,
            repeat: 5,
            yoyo: true,
          });
        }
      });

      setTimeout(() => {
        container.classList.remove('animate-screen-shake', 'animate-rainbow');
        buttons.forEach(btn => gsap.killTweensOf(btn));
        ui.showStatus('Panic over. Deep breaths.', 'success');
      }, 5000);
    },
  }),

  createEvent({
    id: 'emergency_meeting',
    name: 'Emergency Meeting',
    description: 'Displays a fictional emergency announcement',
    category: 'interface',
    probability: 0.04,
    cooldown: 45000,
    unlockRequirement: { clicks: 100 },
    handler: ({ ui, engine }) => {
      const topics = [
        'URGENT: Button productivity at all-time high',
        'CRISIS: User refuses to stop clicking',
        'ALERT: Button developing consciousness',
        'MEETING: Discussing button\'s feelings',
        'EMERGENCY: Click quota exceeded by 400%',
      ];

      ui.showModal('🚨 EMERGENCY MEETING', topics[Math.floor(Math.random() * topics.length)] + '\n\nAttendees: You, The Button, Three Ducks\n\nMinutes: "Click more."', { closable: true });
      audioManager.play('dramatic');
    },
  }),

  createEvent({
    id: 'system_overload',
    name: 'System Overload',
    description: 'Displays a humorous simulated overload',
    category: 'interface',
    probability: 0.03,
    cooldown: 60000,
    unlockRequirement: { clicks: 200 },
    handler: ({ ui, engine }) => {
      ui.showModal('⚠️ SYSTEM OVERLOAD', 'CLICK CAPACITY EXCEEDED\n\nCurrent load: 999%\nRecommended action: Stop clicking\n\n(We both know you won\'t)', { closable: true });
      audioManager.play('airHorn');
      audioManager.play('dramatic');
      document.body.classList.add('animate-screen-shake');
      setTimeout(() => document.body.classList.remove('animate-screen-shake'), 1500);
    },
  }),

  createEvent({
    id: 'forbidden_button',
    name: 'Forbidden Button',
    description: 'Introduces a mysterious new button',
    category: 'interface',
    probability: 0.02,
    cooldown: 120000,
    unlockRequirement: { clicks: 250 },
    handler: ({ ui, engine }) => {
      ui.unlockButton('forbidden');
      ui.showModal('🔴 FORBIDDEN BUTTON UNLOCKED', 'A new button has appeared in your collection.\n\nIt pulsates with dark energy.\n\nDo you dare press it?', { closable: true });
      audioManager.play('suspense');
      audioManager.play('dramatic');
    },
  }),
];

/**
 * Secret Interaction Events
 */
const secretEvents = [
  createEvent({
    id: 'triple_click',
    name: 'Triple Click',
    description: 'Special response to three rapid clicks',
    category: 'secret',
    trigger: 'triple_click',
    probability: 1,
    cooldown: 2000,
    handler: ({ ui, engine }) => {
      ui.showStatus('⚡ TRIPLE CLICK DETECTED ⚡', 'success');
      audioManager.play('victory');
      ui.spawnConfetti(50);
      storageManager.addToArray('discoveredEvents', 'triple_click');
    },
  }),

  createEvent({
    id: 'long_press',
    name: 'Long Press',
    description: 'Unlocks a hidden interaction when holding the button',
    category: 'secret',
    trigger: 'long_press',
    probability: 1,
    cooldown: 5000,
    handler: ({ ui, engine }) => {
      ui.showModal('🤫 LONG PRESS DETECTED', 'You found a secret!\n\nThe button whispers: "Keep exploring..."', { closable: true });
      audioManager.play('suspense');
      storageManager.addToArray('discoveredEvents', 'long_press');
      storageManager.increment('statistics.longestStreak', 1);
    },
  }),

  createEvent({
    id: 'double_click',
    name: 'Double Click',
    description: 'Triggers a unique response to double-click',
    category: 'secret',
    trigger: 'double_click',
    probability: 1,
    cooldown: 1000,
    handler: ({ ui, engine }) => {
      ui.showStatus('💫 Double click! Fancy!', 'info');
      audioManager.play('click');
      audioManager.play('click', { stagger: true });
    },
  }),

  createEvent({
    id: 'konami_code',
    name: 'Konami Code',
    description: 'Hidden keyboard sequence unlocks secret room',
    category: 'secret',
    trigger: 'konami',
    probability: 1,
    cooldown: 0,
    handler: ({ ui, engine }) => {
      ui.unlockSecretRoom('control_room');
      ui.showModal('🎮 KONAMI CODE ACTIVATED', 'Access granted to: CONTROL ROOM\n\n↑ ↑ ↓ ↓ ← → ← → B A', { closable: true });
      audioManager.play('victory');
      audioManager.play('arcade');
      storageManager.addToArray('secretRoomsDiscovered', 'control_room');
    },
  }),

  createEvent({
    id: 'secret_number',
    name: 'Secret Number',
    description: 'Entering a specific number unlocks an event',
    category: 'secret',
    trigger: 'secret_number',
    probability: 1,
    cooldown: 0,
    handler: ({ ui, engine, number }) => {
      if (number === 42) {
        ui.showModal('🎯 THE ANSWER', 'You found the meaning of life, the universe, and everything.\n\nIt\'s 42.', { closable: true });
        audioManager.play('victory');
        storageManager.addToArray('discoveredEvents', 'secret_number_42');
      } else if (number === 1337) {
        ui.showModal('💀 LEET', '1337 h4x0r detected.\n\nAccess granted to: LEET MODE', { closable: true });
        audioManager.play('arcade');
        storageManager.addToArray('discoveredEvents', 'secret_number_1337');
      }
    },
  }),

  createEvent({
    id: 'hidden_corner',
    name: 'Hidden Corner',
    description: 'Clicking a particular interface region reveals a secret',
    category: 'secret',
    trigger: 'hidden_corner',
    probability: 1,
    cooldown: 10000,
    handler: ({ ui, engine }) => {
      ui.showStatus('🔍 You found the secret corner!', 'success');
      audioManager.play('unlock');
      storageManager.addToArray('discoveredEvents', 'hidden_corner');
    },
  }),

  createEvent({
    id: 'hidden_message',
    name: 'Hidden Message',
    description: 'Discover a secret message through specific click pattern',
    category: 'secret',
    trigger: 'pattern',
    probability: 1,
    cooldown: 0,
    handler: ({ ui, engine }) => {
      const messages = [
        'The button remembers.',
        'There is no spoon. Only the button.',
        'You have clicked 1000 times. The button is proud.',
        'Behind every great click is a greater click.',
        'The void stares back. It has a button.',
      ];
      ui.showModal('📜 HIDDEN MESSAGE', messages[Math.floor(Math.random() * messages.length)], { closable: true });
      audioManager.play('suspense');
      storageManager.addToArray('discoveredEvents', 'hidden_message');
    },
  }),
];

/**
 * Mini-game Events (triggers to launch mini-games)
 */
const minigameEvents = [
  createEvent({
    id: 'catch_the_duck',
    name: 'Catch the Duck',
    description: 'Mini-game: Click the moving duck before it escapes',
    category: 'minigame',
    trigger: 'unlock',
    probability: 1,
    cooldown: 0,
    unlockRequirement: { clicks: 100 },
    handler: ({ ui, engine }) => {
      ui.launchMinigame('catchTheDuck');
    },
  }),

  createEvent({
    id: 'reaction_test',
    name: 'Button Reaction Test',
    description: 'Mini-game: Click when the button turns green',
    category: 'minigame',
    trigger: 'unlock',
    probability: 1,
    cooldown: 0,
    unlockRequirement: { clicks: 150 },
    handler: ({ ui, engine }) => {
      ui.launchMinigame('reactionTest');
    },
  }),

  createEvent({
    id: 'memory_sequence',
    name: 'Memory Sequence',
    description: 'Mini-game: Repeat the growing button pattern',
    category: 'minigame',
    trigger: 'unlock',
    probability: 1,
    cooldown: 0,
    unlockRequirement: { clicks: 200 },
    handler: ({ ui, engine }) => {
      ui.launchMinigame('memorySequence');
    },
  }),
];

/**
 * All events combined
 */
export const allEvents = [
  ...buttonEvents,
  ...visualEvents,
  ...surpriseEvents,
  ...soundEvents,
  ...interfaceEvents,
  ...secretEvents,
  ...minigameEvents,
];

/**
 * Event Registry Class
 */
export class EventRegistry {
  constructor() {
    this.events = new Map();
    this.byCategory = new Map();
    this.cooldownManager = new CooldownManager();
    this.registerAll();
  }

  registerAll() {
    allEvents.forEach(event => this.register(event));
  }

  register(event) {
    this.events.set(event.id, event);
    if (!this.byCategory.has(event.category)) {
      this.byCategory.set(event.category, []);
    }
    this.byCategory.get(event.category).push(event);
  }

  get(id) {
    return this.events.get(id);
  }

  getByCategory(category) {
    return this.byCategory.get(category) || [];
  }

  getAll() {
    return Array.from(this.events.values());
  }

  getAvailable(progress, unlockedFeatures) {
    return this.getAll().filter(event => {
      // Check unlock requirement
      if (event.unlockRequirement) {
        const req = event.unlockRequirement;
        if (req.clicks && progress.totalClicks < req.clicks) return false;
        if (req.achievements && !req.achievements.every(a => unlockedFeatures.includes(a))) return false;
      }
      // Check cooldown
      if (event.cooldown > 0 && !this.cooldownManager.isReady(event.id, event.cooldown)) {
        return false;
      }
      return true;
    });
  }

  triggerCooldown(eventId) {
    this.cooldownManager.setCooldown(eventId);
    const event = this.events.get(eventId);
    if (event) {
      event.lastTriggered = Date.now();
      event.timesTriggered++;
    }
  }

  isOnCooldown(eventId) {
    const event = this.events.get(eventId);
    if (!event) return false;
    return !this.cooldownManager.isReady(eventId, event.cooldown);
  }

  getCooldownRemaining(eventId) {
    const event = this.events.get(eventId);
    if (!event) return 0;
    const last = this.cooldownManager.cooldowns.get(eventId) || 0;
    return Math.max(0, event.cooldown - (Date.now() - last));
  }
}

// Singleton
export const eventRegistry = new EventRegistry();