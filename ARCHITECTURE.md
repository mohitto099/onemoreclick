# ONE MORE CLICK — Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.jsx (Root)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐ │
│  │ MainExperience│ │ButtonCollection│ │AchievementCentre│ │Settings│ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │ ChaosEngine  │ │ProgressionSys│ │ AudioManager │
      │ (Orchestrator)│ │ (Milestones) │ │ (Howler+WAA) │
      └──────────────┘ └──────────────┘ └──────────────┘
              │               │               │
              ▼               ▼               ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │EventRegistry │ │AchievementSys│ │ StorageManager│
      │ (40+ events) │ │ (15 achieves)│ │ (localStorage)│
      └──────────────┘ └──────────────┘ └──────────────┘
```

## Core Design Principles

### 1. Separation of Concerns
- **UI Components** (`src/components/`) - Pure presentation, receive props, emit callbacks
- **Systems** (`src/systems/`) - Business logic, state management, side effects
- **Events** (`src/events/`) - Pure functions for specific interactions
- **Hooks** (`src/hooks/`) - React integration layer for systems
- **Utils** (`src/utils/`) - Pure utility functions

### 2. Event-Driven Architecture
The ChaosEngine is the central orchestrator:
```
User Click → MainButton → ChaosEngine.handleClick()
    │
    ├─▶ Increment counter (StorageManager)
    ├─▶ Play button sound (AudioManager)
    ├─▶ Select random event (EventRegistry)
    ├─▶ Execute event handler (with UI context)
    ├─▶ Check milestones (ProgressionSystem)
    ├─▶ Check achievements (AchievementSystem)
    └─▶ Save progress (StorageManager)
```

### 3. Data Flow
- **Single Source of Truth**: `storageManager` holds all persistent state
- **React State**: Derived from storage via `subscribe()` pattern
- **Immutability**: State updates via `storageManager.update()` returning new objects
- **Versioning**: Save schema versioned for future migrations

## Component Structure

### Root Components
| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `App` | Main layout, state orchestration | - |
| `MainButton` | Central interactive element | `onClick`, `label`, `isActive` |
| `ClickCounter` | Animated click display | `count` |
| `StatusMessage` | Rotating status text | `message`, `type` |
| `SoundControls` | Audio toggle + volume | - |
| `ProgressBar` | Milestone progress | - |

### Panel Components (Progressively Disclosed)
| Component | Unlock Condition | Purpose |
|-----------|------------------|---------|
| `ButtonCollection` | 10 clicks | View/discover buttons |
| `AchievementCentre` | 50 clicks | Browse achievements |
| `SettingsPanel` | Always (floating btn) | Audio, theme, reset |
| `SecretRoom` | Various | Hidden environments |
| `MinigameOverlay` | Milestone-based | Play mini-games |

### Feedback Components
| Component | Trigger | Duration |
|-----------|---------|----------|
| `AchievementNotification` | Achievement unlock | 4s auto-dismiss |
| `Modal` | Events, confirmations | Manual dismiss |
| `Toast` | Milestones, discoveries | 5s auto-dismiss |

## System Details

### StorageManager (`src/utils/storage.js`)
- **Schema Versioning**: `CURRENT_VERSION = 1`, migrations array for future
- **Validation**: `validateSave()` checks required fields
- **Merge Strategy**: Deep merge with `DEFAULT_SAVE` for new fields
- **Fallback**: sessionStorage if localStorage unavailable
- **Listeners**: Pub/sub for cross-component sync

**Save Structure:**
```javascript
{
  version: 1,
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
  statistics: { ... },
  lastSaved: Date.now()
}
```

### AudioManager (`src/systems/AudioManager.js`)
- **Web Audio API**: Procedural synthesis for all sounds (no external files)
- **Howler.js**: Fallback/complex sound management
- **Autoplay Policy**: Requires user gesture (`resume()` called on first click)
- **Sound Packs**: Extensible for retro/scifi/cartoon variations
- **Master Gain**: Single volume control for all sounds

**Generated Sounds:**
| Sound | Type | Frequency | Duration |
|-------|------|-----------|----------|
| buttonPress | sine | 800Hz | 0.1s |
| unlock | triangle | 523,659,784Hz | 0.5s |
| achievement | sine | 659,880,1047,1319Hz | 0.8s |
| airHorn | sawtooth | 233Hz | 1.5s |
| duck | square | 440,330Hz | 0.3s |

### EventRegistry (`src/systems/EventRegistry.js`)
- **Event Structure**: `{ id, name, category, trigger, probability, cooldown, unlockRequirement, handler, cleanup }`
- **Categories**: button, visual, surprise, sound, interface, secret, minigame
- **Cooldown Management**: Per-event timestamps, prevents spam
- **Availability Filtering**: Checks progress, unlocks, cooldowns

**Trigger Types:**
- `click` - Random on button click (probability-based)
- `milestone` - Deterministic at click thresholds
- `achievement` - When achievement unlocked
- `hover` - Mouse/touch near button
- `triple_click`, `long_press`, `konami` - Special patterns

### ChaosEngine (`src/systems/ChaosEngine.js`)
- **Central Orchestrator**: Coordinates all click responses
- **Click Pattern Detection**: Double/triple click, rapid clicking
- **Konami Code Listener**: Global keyboard sequence
- **Event Execution**: Context injection (ui, audio, storage, gsap)
- **Cleanup Tracking**: Active effects map for proper disposal

### ProgressionSystem (`src/systems/ProgressionSystem.js`)
- **Milestone Definitions**: 13 milestones with rewards
- **Progress Calculation**: Interpolation between milestones
- **Unlock Logic**: Features, buttons, themes, mini-games, secret rooms
- **React Integration**: `useProgression` hook with subscribe pattern

### AchievementSystem (`src/systems/AchievementSystem.js`)
- **15 Achievements**: Progress, discovery, skill, secret, collection categories
- **Condition Functions**: Pure functions receiving progress object
- **Notification Queue**: Sequential display with animations
- **Progress Tracking**: Percentage for progress-based achievements

## Technical Decisions

### 1. JavaScript over TypeScript
- **Reason**: Faster iteration, smaller bundle, no compile step
- **Trade-off**: Less compile-time safety, mitigated by ESLint + tests

### 2. CSS Custom Properties for Theming
- **Approach**: All colors, gradients, shadows as CSS variables
- **Theme Switching**: Single `data-theme` attribute on `<html>`
- **Benefits**: Instant switching, no CSS-in-JS, native browser support

### 3. GSAP for Animations
- **Why GSAP**: Performance, timeline control, plugin ecosystem
- **React Integration**: `gsap.context()` for automatic cleanup
- **Reduced Motion**: CSS media query disables all animations

### 4. Procedural Audio
- **No External Assets**: All sounds generated via Web Audio API
- **Benefits**: Zero download size, infinite variations, no licensing
- **Implementation**: `AudioManager.createSound()` with configurable oscillators

### 5. localStorage with Versioning
- **Schema Evolution**: Migration functions per version
- **Corruption Handling**: Try/catch with fallback to defaults
- **Quota Management**: Catch `QuotaExceededError`, notify user

### 6. Modular Event System
- **Separation**: Event definitions separate from handlers
- **Extensibility**: New events added to category files
- **Testing**: Handlers are pure functions, easily unit tested

## Performance Considerations

### Bundle Optimization
- **Code Splitting**: Mini-games lazy loaded via dynamic import
- **Tree Shaking**: Lucide React icons imported individually
- **Chunking**: Vendor, GSAP, Audio, Icons separate chunks

### Runtime Performance
- **GSAP Cleanup**: `gsap.killTweensOf()` on unmount
- **Event Listener Cleanup**: `useEffect` return functions
- **Particle Limits**: Max 200 confetti, auto-cleanup
- **Animation Frame**: `requestAnimationFrame` for game loops

### Memory Management
- **WeakMap**: For event listener tracking (future)
- **Timer Cleanup**: All `setTimeout`/`setInterval` cleared
- **DOM Node Cleanup**: Particle elements removed after animation

## Accessibility

### Implemented
- [x] Semantic HTML structure
- [x] ARIA labels on all interactive elements
- [x] Focus visible outlines
- [x] Keyboard navigation (Tab, Enter, Space, Escape)
- [x] Screen reader announcements (aria-live regions)
- [x] Reduced motion support
- [x] Color contrast ≥4.5:1 (WCAG AA)
- [x] Touch targets ≥44px

### Planned
- [ ] High contrast mode
- [ ] Screen reader testing
- [ ] Voice control support

## Security

### Implemented
- [x] No `dangerouslySetInnerHTML`
- [x] No `eval()` or `Function()` constructor
- [x] No external script loading
- [x] Content Security Policy ready
- [x] No user data transmission

### Content Safety
- All "fake crash/security" effects clearly labeled as simulated
- No actual browser APIs abused (no `navigator.vibrate` without permission)
- No clipboard access without user action

## Deployment

### Build Output
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor-[hash].js
└── favicon.svg
```

### Static Hosting
- **Vercel**: Zero-config deploy, edge network
- **Cloudflare Pages**: Free tier, Workers integration
- **Netlify**: Form handling, edge functions

### Environment Variables
None required for initial version.

## Future Extensibility

### Backend Integration Points
- `StorageManager` abstracted for future API sync
- `AudioManager` supports remote sound packs
- `EventRegistry` can load events from CMS

### Analytics (When Approved)
- `ChaosEngine` emits events for tracking
- `AchievementSystem` has unlock callbacks
- `ProgressionSystem` has milestone hooks

### Multiplayer/Social
- `buttonCollection` shareable
- `highScore` challenge system
- `secretRooms` collaborative discovery

## File Structure Reference

```
src/
├── components/          # UI Components
│   ├── MainButton.jsx
│   ├── ClickCounter.jsx
│   ├── StatusMessage.jsx
│   ├── SoundControls.jsx
│   ├── ProgressBar.jsx
│   ├── ButtonCollection.jsx
│   ├── AchievementCentre.jsx
│   ├── SettingsPanel.jsx
│   ├── SecretRoom.jsx
│   ├── MinigameOverlay.jsx
│   ├── AchievementNotification.jsx
│   ├── Modal.jsx
│   └── Toast.jsx
├── systems/             # Core Logic
│   ├── ChaosEngine.js
│   ├── EventRegistry.js
│   ├── ProgressionSystem.js
│   ├── AchievementSystem.js
│   ├── AudioManager.js
│   └── StorageManager.js
├── events/              # Event Definitions
│   ├── buttonEvents.js
│   ├── visualEvents.js
│   ├── surpriseEvents.js
│   ├── soundEvents.js
│   ├── interfaceEvents.js
│   └── secretEvents.js
├── minigames/           # Game Implementations
│   ├── CatchTheDuck.jsx
│   ├── ReactionTest.jsx
│   └── MemorySequence.jsx
├── data/                # Static Data
│   ├── achievements.js
│   ├── unlocks.js
│   └── themes.js
├── hooks/               # React Integration
│   ├── useProgress.js
│   ├── useSound.js
│   └── useChaosEngine.js
├── styles/              # Styling
│   ├── global.css
│   ├── animations.css
│   └── themes.css
├── utils/               # Utilities
│   ├── storage.js
│   ├── random.js
│   └── canvas.js
├── App.jsx
└── main.jsx
```