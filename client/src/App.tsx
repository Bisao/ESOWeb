import { useEffect } from 'react';
import { GameScene } from './components/game/GameScene';
import { CharacterCreation } from './components/ui/game/CharacterCreation';
import { LobbyScene } from './components/ui/game/LobbyScene';
import { MobileControls } from './components/ui/MobileControls';
import { useMMOGame } from './lib/stores/useMMOGame';
import { GamePhase } from '@shared/types';
import { useAudio } from './lib/stores/useAudio';
import "@fontsource/inter";

function App() {
  const { gamePhase } = useMMOGame();
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Load audio
  useEffect(() => {
    // Load background music
    const backgroundMusic = new Audio('/sounds/background.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;
    setBackgroundMusic(backgroundMusic);

    // Load sound effects
    const hitSound = new Audio('/sounds/hit.mp3');
    setHitSound(hitSound);

    const successSound = new Audio('/sounds/success.mp3');
    setSuccessSound(successSound);

    // Start background music (will be muted by default)
    backgroundMusic.play().catch(error => {
      console.log("Background music play prevented:", error);
    });

    return () => {
      backgroundMusic.pause();
      backgroundMusic.src = '';
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* 3D Game Scene */}
      <GameScene />

      {/* UI Overlays */}
      {gamePhase === GamePhase.CharacterCreation && <CharacterCreation />}
      {gamePhase === GamePhase.Lobby && <LobbyScene />}
      {gamePhase !== GamePhase.CharacterCreation && gamePhase !== GamePhase.Lobby && <GameHUD />}

      {/* Mobile Controls - only appears on touch devices */}
      <MobileControls />
    </div>
  );
}

export default App;