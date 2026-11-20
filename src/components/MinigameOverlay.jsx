import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useAudio } from '../systems/AudioManager';
import { storageManager } from '../utils/storage';

const MINIGAMES = {
  catchTheDuck: {
    name: 'Catch the Duck',
    description: 'Click the duck before it escapes!',
    component: CatchTheDuckGame,
  },
  reactionTest: {
    name: 'Reaction Test',
    description: 'Click when the button turns green. Test your reflexes!',
    component: ReactionTestGame,
  },
  memorySequence: {
    name: 'Memory Sequence',
    description: 'Repeat the growing pattern. How far can you go?',
    component: MemorySequenceGame,
  },
};

/**
 * Mini-game Overlay Container
 */
export function MinigameOverlay({ gameId, onClose }) {
  const game = MINIGAMES[gameId];
  const { playSound } = useAudio();
  const containerRef = useRef(null);

  useEffect(() => {
    if (game) {
      playSound('gameStart');
    }
  }, [gameId, playSound]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.3,
        ease: 'back.out(1.7)',
      });
    }
  }, []);

  const handleClose = useCallback(() => {
    gsap.to(containerRef.current, {
      scale: 0.95,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: onClose,
    });
  }, [onClose]);

  if (!game) return null;

  return (
    <div className="minigame-overlay" onClick={handleClose}>
      <div
        ref={containerRef}
        className="minigame-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={game.name}
      >
        <div className="minigame-header">
          <h2>{game.name}</h2>
          <button className="btn btn-ghost" onClick={handleClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="minigame-body">
          <game.component onClose={handleClose} onSound={playSound} />
        </div>
      </div>
    </div>
  );
}

/* ==================== MINI-GAME IMPLEMENTATIONS ==================== */

/**
 * Catch the Duck Game
 */
function CatchTheDuckGame({ onClose, onSound }) {
  const [state, setState] = useState('ready'); // ready, playing, won, lost
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [duckPos, setDuckPos] = useState({ x: 50, y: 50 });
  const [highScore, setHighScore] = useState(() => storageManager.get('miniGameScores')?.catchTheDuck || 0);
  const timerRef = useRef(null);
  const moveRef = useRef(null);
  const gameAreaRef = useRef(null);

  const startGame = () => {
    setState('playing');
    setScore(0);
    setTimeLeft(10);
    moveDuck();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          endGame(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    onSound('tick');
  };

  const moveDuck = () => {
    if (state !== 'playing') return;
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 80 + 10;
    setDuckPos({ x, y });
    moveRef.current = setTimeout(moveDuck, 800 + Math.random() * 400);
  };

  const handleDuckClick = () => {
    if (state !== 'playing') return;
    setScore(s => s + 1);
    onSound('duck');
    moveDuck();
  };

  const endGame = (won) => {
    clearInterval(timerRef.current);
    clearTimeout(moveRef.current);
    if (won || score > highScore) {
      setHighScore(score);
      storageManager.update({
        miniGameScores: { ...storageManager.get('miniGameScores'), catchTheDuck: score },
      });
    }
    setState(won ? 'won' : 'lost');
    onSound(won ? 'gameWin' : 'gameLose');
  };

  return (
    <div className="minigame catch-the-duck">
      {state === 'ready' && (
        <div className="minigame-start">
          <h3>{MINIGAMES.catchTheDuck.name}</h3>
          <p>{MINIGAMES.catchTheDuck.description}</p>
          <p className="high-score">Best: {highScore}</p>
          <button className="btn btn-primary" onClick={startGame}>Start Game</button>
        </div>
      )}

      {state === 'playing' && (
        <div className="minigame-play">
          <div className="game-hud">
            <span>Score: {score}</span>
            <span>Time: {timeLeft}s</span>
            <span>Best: {highScore}</span>
          </div>
          <div
            ref={gameAreaRef}
            className="game-area"
            onClick={() => setState('lost')}
          >
            <button
              className="duck-target"
              style={{ left: `${duckPos.x}%`, top: `${duckPos.y}%` }}
              onClick={(e) => { e.stopPropagation(); handleDuckClick(); }}
              aria-label="Click the duck"
            >
              🦆
            </button>
          </div>
        </div>
      )}

      {(state === 'won' || state === 'lost') && (
        <div className="minigame-result">
          <h3>{state === 'won' ? '🎉 Amazing!' : '😅 Time\'s up!'}</h3>
          <p>Final Score: {score}</p>
          <p>Best: {highScore}</p>
          <div className="result-buttons">
            <button className="btn btn-primary" onClick={startGame}>Play Again</button>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reaction Test Game
 */
function ReactionTestGame({ onClose, onSound }) {
  const [state, setState] = useState('ready'); // ready, waiting, ready-to-click, clicked, result
  const [reactionTime, setReactionTime] = useState(null);
  const [bestTime, setBestTime] = useState(() => storageManager.get('miniGameScores')?.reactionTest || null);
  const [waitTime, setWaitTime] = useState(0);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);

  const startTest = () => {
    setState('waiting');
    setReactionTime(null);
    const wait = 1000 + Math.random() * 4000;
    setWaitTime(wait);
    timeoutRef.current = setTimeout(() => {
      setState('ready-to-click');
      startTimeRef.current = performance.now();
      onSound('tick');
    }, wait);
  };

  const handleClick = () => {
    if (state !== 'ready-to-click') return;
    const reaction = Math.round(performance.now() - startTimeRef.current);
    setReactionTime(reaction);
    setState('result');
    clearTimeout(timeoutRef.current);

    if (!bestTime || reaction < bestTime) {
      setBestTime(reaction);
      storageManager.update({
        miniGameScores: { ...storageManager.get('miniGameScores'), reactionTest: reaction },
        statistics: { ...storageManager.get('statistics'), reactionBest: reaction },
      });
    }
    onSound(reaction < 200 ? 'victory' : 'success');
  };

  const handleEarlyClick = () => {
    if (state === 'waiting') {
      clearTimeout(timeoutRef.current);
      setState('result');
      setReactionTime(-1); // Indicates early click
      onSound('error');
    }
  };

  return (
    <div className="minigame reaction-test">
      {state === 'ready' && (
        <div className="minigame-start">
          <h3>{MINIGAMES.reactionTest.name}</h3>
          <p>{MINIGAMES.reactionTest.description}</p>
          {bestTime && <p className="high-score">Best: {bestTime}ms</p>}
          <button className="btn btn-primary" onClick={startTest}>Start Test</button>
        </div>
      )}

      {state === 'waiting' && (
        <div className="minigame-play reaction-waiting">
          <div className="reaction-button waiting" onClick={handleEarlyClick}>
            <span>Wait for green...</span>
            <div className="reaction-indicator" />
          </div>
          <p className="instruction">Don't click yet!</p>
        </div>
      )}

      {state === 'ready-to-click' && (
        <div className="minigame-play reaction-ready">
          <div className="reaction-button ready" onClick={handleClick}>
            <span>CLICK NOW!</span>
            <div className="reaction-indicator active" />
          </div>
          <p className="instruction">React as fast as you can!</p>
        </div>
      )}

      {state === 'result' && (
        <div className="minigame-result">
          {reactionTime === -1 ? (
            <>
              <h3>❌ Too early!</h3>
              <p>You clicked before the signal.</p>
            </>
          ) : (
            <>
              <h3>{reactionTime < 200 ? '🏆 Incredible!' : reactionTime < 300 ? '⚡ Fast!' : '✅ Good!'}</h3>
              <p className="reaction-time">{reactionTime} ms</p>
              {bestTime && <p>Best: {bestTime} ms</p>}
            </>
          )}
          <div className="result-buttons">
            <button className="btn btn-primary" onClick={startTest}>Try Again</button>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Memory Sequence Game
 */
function MemorySequenceGame({ onClose, onSound }) {
  const [state, setState] = useState('ready'); // ready, showing, input, result
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => storageManager.get('miniGameScores')?.memorySequence || 0);
  const showIndexRef = useRef(0);
  const showTimerRef = useRef(null);
  const buttonsRef = useRef([]);

  const colors = [
    { bg: '#E53945', sound: 523 },
    { bg: '#FFD166', sound: 659 },
    { bg: '#45D6E8', sound: 784 },
    { bg: '#A78BFA', sound: 1047 },
  ];

  const startGame = () => {
    setState('showing');
    setLevel(1);
    setSequence([]);
    nextRound();
  };

  const nextRound = () => {
    const newSequence = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(newSequence);
    setUserInput([]);
    showIndexRef.current = 0;
    showNextInSequence(newSequence);
  };

  const showNextInSequence = (seq) => {
    if (showIndexRef.current >= seq.length) {
      setState('input');
      return;
    }
    const idx = seq[showIndexRef.current];
    const btn = buttonsRef.current[idx];
    if (btn) {
      gsap.to(btn, { scale: 1.2, backgroundColor: '#fff', duration: 0.3, yoyo: true, repeat: 1, onComplete: () => {
        showIndexRef.current++;
        showNextInSequence(seq);
      }});
    }
    onSound('arcade');
  };

  const handleButtonClick = (index) => {
    if (state !== 'input') return;
    setUserInput(prev => [...prev, index]);
    onSound('click');

    if (userInput.length + 1 === sequence.length) {
      // Check if correct
      const correct = userInput.concat(index).every((v, i) => v === sequence[i]);
      if (correct) {
        setLevel(l => l + 1);
        onSound('success');
        setTimeout(nextRound, 1000);
      } else {
        endGame(false);
      }
    }
  };

  const endGame = (won) => {
    clearTimeout(showTimerRef.current);
    const finalLevel = level - 1;
    if (finalLevel > highScore) {
      setHighScore(finalLevel);
      storageManager.update({
        miniGameScores: { ...storageManager.get('miniGameScores'), memorySequence: finalLevel },
      });
    }
    setState('result');
    onSound(won ? 'gameWin' : 'gameLose');
  };

  return (
    <div className="minigame memory-sequence">
      {state === 'ready' && (
        <div className="minigame-start">
          <h3>{MINIGAMES.memorySequence.name}</h3>
          <p>{MINIGAMES.memorySequence.description}</p>
          <p className="high-score">Best Level: {highScore}</p>
          <button className="btn btn-primary" onClick={startGame}>Start Game</button>
        </div>
      )}

      {(state === 'showing' || state === 'input') && (
        <div className="minigame-play">
          <div className="game-hud">
            <span>Level: {level}</span>
            <span>Best: {highScore}</span>
          </div>
          <div className="memory-grid">
            {colors.map((color, i) => (
              <button
                key={i}
                ref={el => { buttonsRef.current[i] = el; }}
                className="memory-button"
                style={{ backgroundColor: color.bg }}
                onClick={() => handleButtonClick(i)}
                disabled={state !== 'input'}
                aria-label={`Button ${i + 1}`}
              />
            ))}
          </div>
          <p className="instruction">
            {state === 'showing' ? 'Watch the pattern...' : 'Repeat the pattern!'}
          </p>
        </div>
      )}

      {state === 'result' && (
        <div className="minigame-result">
          <h3>🧠 Game Over!</h3>
          <p>You reached Level {level - 1}</p>
          <p>Best: {highScore}</p>
          <div className="result-buttons">
            <button className="btn btn-primary" onClick={startGame}>Play Again</button>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}