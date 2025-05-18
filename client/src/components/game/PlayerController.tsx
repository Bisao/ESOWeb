import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from './GameScene';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { useAudio } from '@/lib/stores/useAudio';
import { GamePhase } from '@shared/types';

export function PlayerController() {
  const { character, updatePosition, updateRotation, setMoving, setAttacking, canAttack } = useCharacter();
  const { gamePhase, toggleInventory, toggleStats, switchCamera } = useMMOGame();
  const { sendPlayerUpdate, sendAttackAction } = useMultiplayer();
  const { playHit } = useAudio();
  
  // Get keyboard controls without causing re-renders
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Track last position update time for network optimization
  const lastUpdateRef = useRef(Date.now());
  const movingRef = useRef(false);
  
  // Movement speed and state
  const speed = 5;
  const rotationSpeed = 2;
  const playerVelocity = useRef(new THREE.Vector3());
  const playerDirection = useRef(new THREE.Vector3());
  
  // Process keyboard input and update player movement
  useFrame((state, delta) => {
    if (!character || gamePhase !== GamePhase.Playing) return;
    
    const {
      forward,
      backward,
      left,
      right,
      jump,
      attack,
      inventory,
      stats,
      camera
    } = getKeys();
    
    // Calculate movement direction
    const moveZ = Number(forward) - Number(backward);
    const moveX = Number(right) - Number(left);
    
    // Set player moving state
    const isMoving = moveX !== 0 || moveZ !== 0;
    
    if (movingRef.current !== isMoving) {
      movingRef.current = isMoving;
      setMoving(isMoving);
    }
    
    // Calculate rotation based on movement direction
    if (isMoving) {
      const angle = Math.atan2(moveX, moveZ);
      const targetRotation = angle;
      
      // Apply smooth rotation
      let currentRotation = character.rotation;
      const angleDiff = targetRotation - currentRotation;
      
      // Normalize angle difference to [-PI, PI]
      const normalizedDiff = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
      
      // Apply rotation with smooth interpolation
      if (Math.abs(normalizedDiff) > 0.01) {
        currentRotation += normalizedDiff * rotationSpeed * delta;
        updateRotation(currentRotation);
      }
      
      // Update player direction based on rotation
      playerDirection.current.set(
        Math.sin(currentRotation),
        0,
        Math.cos(currentRotation)
      );
      
      // Apply movement in rotated direction
      playerVelocity.current.copy(playerDirection.current).multiplyScalar(speed * delta);
      
      // Update position
      updatePosition({
        x: character.position.x + playerVelocity.current.x,
        y: character.position.y,
        z: character.position.z + playerVelocity.current.z
      });
    }
    
    // Handle attack action
    if (attack && canAttack()) {
      setAttacking(true);
      sendAttackAction();
      playHit();
      
      // Reset attack state after animation completes
      setTimeout(() => {
        setAttacking(false);
      }, 500);
    }
    
    // UI toggle actions - only trigger on key down, not continuous press
    const now = Date.now();
    
    // Send position updates to server periodically (100ms)
    if (now - lastUpdateRef.current > 100) {
      lastUpdateRef.current = now;
      sendPlayerUpdate();
    }
  });
  
  // Handle UI toggles with useEffect to prevent multiple triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyI') {
        toggleInventory();
      } else if (e.code === 'KeyC') {
        toggleStats();
      } else if (e.code === 'KeyV') {
        switchCamera();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleInventory, toggleStats, switchCamera]);
  
  return null;
}
