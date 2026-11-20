# ONE MORE CLICK

> "You could stop anytime. But you won't."

An interactive entertainment website where every click has the potential to trigger something unexpected. Inspired by The Useless Web, interactive internet experiments, and retro arcade interfaces.

## 🎮 Experience

Start with a single mysterious button. As you click, discover:
- **50+ distinct interactions** across 10 categories
- **Chaos Engine** - unpredictable events, visual effects, sounds
- **Progression System** - 13 milestones unlocking new features
- **15 Achievements** - track your clicking journey
- **3 Complete Mini-Games** - Catch the Duck, Reaction Test, Memory Sequence
- **5 Secret Rooms** - hidden environments with unique interactions
- **5 Themes** - Default, Retro Arcade, Neon, Minimalist, Chaos
- **Procedural Audio** - all sounds generated via Web Audio API
- **Local Persistence** - progress saves automatically

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | Component-based UI |
| Vite 5 | Build tool & dev server |
| GSAP 3 | Animations & transitions |
| Howler.js | Audio management |
| Lucide React | Icons |
| Web Audio API | Procedural sound synthesis |
| localStorage | Persistent progress |

## 📁 Project Structure

```
src/
├── components/     # UI Components (buttons, panels, modals)
├── systems/        # Core logic (ChaosEngine, Progression, Audio, Storage)
├── events/         # Event definitions by category
├── minigames/      # Mini-game implementations
├── hooks/          # React integration hooks
├── styles/         # Global CSS, animations, themes
├── utils/          # Utilities (storage, random, canvas)
├── App.jsx         # Root component
└── main.jsx        # Entry point
```

## 🎯 Core Systems

### ChaosEngine
Central orchestrator managing all click responses, event selection, cooldowns, and cleanup.

### EventRegistry
40+ events across 7 categories: button behaviours, visual chaos, surprises, sounds, interface pranks, secrets, mini-games.

### ProgressionSystem
13 milestones (1 → 1000 clicks) unlocking buttons, themes, mini-games, secret rooms.

### AchievementSystem
15 achievements across 5 categories: progress, discovery, skill, secret, collection.

### AudioManager
Procedural synthesis via Web Audio API - zero external audio files.

### StorageManager
Versioned localStorage with migration, corruption handling, and session fallback.

## 🎨 Themes

| Theme | Unlock | Visual Style |
|-------|--------|--------------|
| Default | Start | Dark, red/cyan accents |
| Retro Arcade | 250 clicks | Green phosphor, scanlines |
| Neon | 500 clicks | Pink/cyan glow, grid bg |
| Minimalist | Secret | Light, clean, monochrome |
| Chaos | 1000 clicks | Rainbow hue rotation |

## 🕹 Mini-Games

1. **Catch the Duck** - Click the moving duck before it escapes (10s timer)
2. **Reaction Test** - Wait for green, click as fast as possible (ms precision)
3. **Memory Sequence** - Repeat growing button pattern (Simon-says)

## 🔐 Secret Interactions

- **Triple Click** - 3 rapid clicks
- **Long Press** - Hold button 2+ seconds
- **Konami Code** - ↑↑↓↓←→←→BA
- **Secret Numbers** - Enter 42 or 1337
- **Hidden Corner** - Click bottom-right 50px

## 📱 Responsive & Accessible

- Mobile-first design (touch targets ≥44px)
- Keyboard navigation (Tab, Enter, Space, Escape)
- Screen reader support (ARIA live regions)
- Reduced motion support
- WCAG AA color contrast

## 🔒 Privacy

- No analytics or tracking
- No external API calls
- All data stored locally in browser
- Clear reset option in Settings

## 📦 Deployment

Static hosting ready:

```bash
npm run build
# Deploy dist/ to Vercel, Cloudflare Pages, Netlify, etc.
```

## 📄 Documentation

- [Implementation Plan](IMPLEMENTATION_PLAN.md)
- [Development Progress](DEVELOPMENT_PROGRESS.md)
- [Architecture](ARCHITECTURE.md)
- [Feature Catalogue](FEATURE_CATALOGUE.md)

## 🎨 Credits

Built with React, GSAP, Howler.js, and lots of ❤️

---

**ONE MORE CLICK** — *You could stop anytime. But you won't.*