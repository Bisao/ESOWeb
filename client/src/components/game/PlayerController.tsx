import { useRef, useEffect, useState } from 'react';
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
  const { updatePosition: updateMultiplayerPosition, sendAttack: sendAttackAction, isConnected } = useMultiplayer();
  const { playHit } = useAudio();
  const [pointerLocked, setPointerLocked] = useState(false);

  // Get keyboard controls without causing re-renders
  const [, getKeys] = useKeyboardControls<Controls>();

  // Track last position update time for network optimization
  const lastUpdateRef = useRef(Date.now());
  const movingRef = useRef(false);

  // Movement speed and state
  const speed = 10; // Aumentado para movimento mais rápido
  const rotationSpeed = 4; // Aumentado para rotação mais rápida
  const acceleration = 0.15; // Adicionada aceleração suave
  const playerVelocity = useRef(new THREE.Vector3());
  const playerDirection = useRef(new THREE.Vector3());
  const isJumping = useRef(false);
  const jumpHeight = useRef(0);

  // Process keyboard input and update player movement
  // Track mouse movement
  const { viewport } = useThree();
  const mouseSensitivity = 0.003;
  const gameCanvasRef = useRef<HTMLElement | null>(null);

  // Função para garantir que o pointer lock seja mantido
  const ensurePointerLock = () => {
    if (gamePhase === GamePhase.Playing && !pointerLocked) {
      const canvas = document.querySelector('canvas');
      if (canvas && document.pointerLockElement !== canvas) {
        try {
          canvas.requestPointerLock();
          gameCanvasRef.current = canvas;
        } catch (err) {
          console.error("Falha ao travar o cursor:", err);
        }
      }
    }
  };

  // Monitora cliques no canvas para reativar o pointer lock
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      gameCanvasRef.current = canvas;
      
      const handleCanvasClick = () => {
        if (gamePhase === GamePhase.Playing && !pointerLocked) {
          ensurePointerLock();
        }
      };
      
      canvas.addEventListener('click', handleCanvasClick);
      return () => {
        canvas.removeEventListener('click', handleCanvasClick);
      };
    }
  }, [gamePhase, pointerLocked]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (character && gamePhase === GamePhase.Playing && pointerLocked) {
        updateRotation(character.rotation - event.movementX * mouseSensitivity);
      }
    };

    const onPointerLockChange = () => {
      const canvas = gameCanvasRef.current;
      const isLocked = document.pointerLockElement === canvas;
      setPointerLocked(isLocked);
      
      if (isLocked) {
        document.addEventListener('mousemove', onMouseMove);
        document.body.style.cursor = 'none';
      } else {
        document.removeEventListener('mousemove', onMouseMove);
        document.body.style.cursor = 'auto';
        
        // Tenta recuperar o pointer lock se o jogo ainda estiver rodando
        if (gamePhase === GamePhase.Playing) {
          // Pequeno atraso para evitar problemas com eventos de clique
          setTimeout(ensurePointerLock, 100);
        }
      }
    };

    const onPointerLockError = (e: Event) => {
      console.error("Erro no Pointer Lock:", e);
      setPointerLocked(false);
      document.body.style.cursor = 'auto';
    };

    // Ativa o pointer lock quando o jogo começa
    if (gamePhase === GamePhase.Playing) {
      ensurePointerLock();
    }

    // Adiciona listeners para monitorar o estado do pointer lock
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);
    document.addEventListener('mousemove', onMouseMove);

    // Tenta recuperar o pointer lock se o usuário alternar entre abas/janelas
    window.addEventListener('focus', ensurePointerLock);
    window.addEventListener('blur', () => setPointerLocked(false));

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', onPointerLockError);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('focus', ensurePointerLock);
      window.removeEventListener('blur', () => setPointerLocked(false));
      
      // Libera o pointer lock ao desmontar o componente
      if (document.pointerLockElement === gameCanvasRef.current) {
        document.exitPointerLock();
      }
    };
  }, [character, gamePhase]);

  useFrame((state, delta) => {
    if (!character || gamePhase !== GamePhase.Playing) return;

    // Verifica se o pointer lock está ativo, se não, tenta reativá-lo
    if (!pointerLocked && gamePhase === GamePhase.Playing) {
      ensurePointerLock();
    }

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

    // Calculate movement direction relative to current rotation
    const moveZ = Number(forward) - Number(backward);
    const moveX = Number(left) - Number(right);

    // Set player moving state
    const isMoving = moveX !== 0 || moveZ !== 0;

    if (movingRef.current !== isMoving) {
      movingRef.current = isMoving;
      setMoving(isMoving);
    }

    if (isMoving) {
      // Use mouse rotation for character direction
      const currentRotation = character.rotation;

      // Calculate movement vector relative to character rotation
      const moveVector = new THREE.Vector3(
        moveX * Math.cos(currentRotation) + moveZ * Math.sin(currentRotation),
        0,
        moveZ * Math.cos(currentRotation) - moveX * Math.sin(currentRotation)
      ).normalize().multiplyScalar(speed * delta);

      // Calculate jump height for y position
      const jumpOffset = isJumping.current ? Math.sin(jumpHeight.current) * 1.5 : 0;

      // Update position with strafe movement
      updatePosition({
        x: character.position.x + moveVector.x,
        y: character.position.y + jumpOffset,
        z: character.position.z + moveVector.z
      });
    }

    // Handle attack action with improved feedback
    if (attack && canAttack()) {
      setAttacking(true);

      // Send attack action to server if connected
      if (character && isConnected()) {
        sendAttackAction(character.position, character.rotation);
      }

      playHit();

      // Add camera shake effect for attack impact
      state.camera.position.y += 0.05;

      // Reset attack state after animation completes with smoother timing
      setTimeout(() => {
        setAttacking(false);
      }, 400);
    }

    // UI toggle actions - only trigger on key down, not continuous press
    const now = Date.now();

    // Send position updates to server periodically (100ms)
    if (now - lastUpdateRef.current > 100 && character && isConnected()) {
      lastUpdateRef.current = now;
      // Only send update if we have valid position data
      if (character.position && typeof character.rotation === 'number') {
        updateMultiplayerPosition(
          character.position,
          character.rotation, 
          movingRef.current || false,
          character.attacking || false
        );
      }
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
      } else if (e.code === 'Escape' && pointerLocked) {
        // Permite que o ESC libere o cursor, mas mantém o jogo rodando
        document.exitPointerLock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleInventory, toggleStats, switchCamera, pointerLocked]);

  return null;
}
