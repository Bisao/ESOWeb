import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, Sky, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { GamePhase } from '@shared/types';
import { Environment } from './Environment';
import { Character } from './Character';
import { PlayerController } from './PlayerController';
import { Camera } from './Camera';
import { OtherPlayers } from './OtherPlayers';
import { Enemy } from './Enemy';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { CollisionSystem } from './CollisionSystem';

// Define control keys for the game
export enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  jump = 'jump',
  attack = 'attack',
  inventory = 'inventory',
  stats = 'stats',
  camera = 'camera',
}

export function GameScene() {
  const { gamePhase, showDebug } = useMMOGame();
  const { connect, disconnect } = useMultiplayer();
  
  // Define key mappings
  const keyMap = [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.jump, keys: ['Space'] },
    { name: Controls.attack, keys: ['KeyF'] },
    { name: Controls.inventory, keys: ['KeyI'] },
    { name: Controls.stats, keys: ['KeyC'] },
    { name: Controls.camera, keys: ['KeyV'] },
  ];
  
  // Connect to multiplayer server when game is in playing state
  useEffect(() => {
    if (gamePhase === GamePhase.Playing) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [gamePhase, connect, disconnect]);
  
  const [controls] = useKeyboardControls<Controls>();

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) { // Botão esquerdo
      useKeyboardControls.setState({ [Controls.attack]: true });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      useKeyboardControls.setState({ [Controls.attack]: false });
    }
  };

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          powerPreference: 'default',
          alpha: false
        }}
        camera={{
          position: [0, 5, 10],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
      >
        {/* Debug stats */}
        {showDebug && <Stats />}
        
        {/* Sky and ambient lighting */}
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          castShadow
          position={[10, 20, 15]} 
          intensity={1.5} 
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera 
            attach="shadow-camera"
            args={[-20, 20, 20, -20, 0.1, 50]}
          />
        </directionalLight>
        
        {/* Main scene content - loads asynchronously */}
        <Suspense fallback={null}>
          {/* Environment (terrain, buildings, etc) */}
          <Environment />
          
          {/* Player character */}
          <Character />
          
          {/* Other players */}
          <OtherPlayers />
          
          {/* Enemy NPCs */}
          <Enemy position={[15, 0, 15]} />
          <Enemy position={[-15, 0, -15]} />
          <Enemy position={[15, 0, -15]} />
          
          {/* Collision detection system */}
          <CollisionSystem />
        </Suspense>
        
        {/* Camera controller */}
        <Camera />
        
        {/* Player movement and controls */}
        <PlayerController />
      </Canvas>
    </KeyboardControls>
  );
}
