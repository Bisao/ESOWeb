import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { CharacterClass, Character as CharacterType } from '@shared/types';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const DEFAULT_COLOR = {
  [CharacterClass.Warrior]: '#e74c3c', // Warrior - Red
  [CharacterClass.Mage]: '#3498db',    // Mage - Blue
  [CharacterClass.Archer]: '#2ecc71'   // Archer - Green
};

export function OtherPlayers() {
  const otherPlayers = useMultiplayer(state => state.otherPlayers);
  const myPlayerId = useMMOGame(state => state.playerId);
  
  return (
    <group>
      {Object.values(otherPlayers).map(playerData => (
        <OtherPlayer key={playerData.character.id} player={playerData.character} />
      ))}
    </group>
  );
}

function OtherPlayer({ player }: { player: CharacterType }) {
  const ref = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  
  // Refs for arms and legs
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  // Animation state
  const movementCycle = useRef(0);
  const attackAnim = useRef(0);
  
  // Set initial position
  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(
        player.position.x,
        player.position.y,
        player.position.z
      );
      ref.current.rotation.y = player.rotation;
    }
  }, []);
  
  // Update position and animation
  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Update position with smooth lerping
    ref.current.position.x = THREE.MathUtils.lerp(
      ref.current.position.x,
      player.position.x,
      delta * 10
    );
    
    ref.current.position.z = THREE.MathUtils.lerp(
      ref.current.position.z,
      player.position.z,
      delta * 10
    );
    
    ref.current.position.y = THREE.MathUtils.lerp(
      ref.current.position.y,
      player.position.y + 0.5, // Add half the height to center
      delta * 10
    );
    
    // Smoothly rotate towards target rotation
    const targetRotation = player.rotation;
    let currentRotation = ref.current.rotation.y;
    
    // Find the shortest path to the target rotation
    const diff = targetRotation - currentRotation;
    const shortestDiff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
    
    ref.current.rotation.y = currentRotation + shortestDiff * delta * 10;
    
    // Animate limbs if moving
    if (player.moving) {
      movementCycle.current += delta * 10;
      
      // Animate legs in walking cycle
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(movementCycle.current) * 0.5;
        rightLegRef.current.rotation.x = Math.sin(movementCycle.current + Math.PI) * 0.5;
      }
      
      // Animate arms in opposite phase to legs
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(movementCycle.current + Math.PI) * 0.25;
        rightArmRef.current.rotation.x = Math.sin(movementCycle.current) * 0.25;
      }
    } else {
      // Reset animation if not moving
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
    }
    
    // Attack animation
    if (player.attacking) {
      attackAnim.current = 1; // Start attack animation
    }
    
    if (attackAnim.current > 0) {
      // Animate attack (swinging arms)
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -Math.PI * 0.5 * attackAnim.current;
        rightArmRef.current.rotation.z = Math.PI * 0.25 * attackAnim.current;
      }
      
      // Decay attack animation
      attackAnim.current = Math.max(0, attackAnim.current - delta * 5);
      
      // Reset arms when animation completes
      if (attackAnim.current === 0 && rightArmRef.current) {
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.z = 0;
      }
    }
  });
  
  const color = DEFAULT_COLOR[player.class] || '#888888';
  
  return (
    <group ref={ref}>
      {/* Character model with articulated limbs */}
      <group position={[0, 0, 0]}>
        {/* Body */}
        <mesh ref={bodyRef} position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.3]} />
          <meshStandardMaterial color={color} />
        </mesh>
        
        {/* Head */}
        <mesh ref={headRef} position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={color} />
        </mesh>
        
        {/* Left Arm */}
        <mesh 
          ref={leftArmRef} 
          position={[-0.325, 0.1, 0]} 
          castShadow
        >
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color={color} />
        </mesh>
        
        {/* Right Arm */}
        <mesh 
          ref={rightArmRef} 
          position={[0.325, 0.1, 0]} 
          castShadow
        >
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color={color} />
        </mesh>
        
        {/* Left Leg */}
        <mesh 
          ref={leftLegRef} 
          position={[-0.15, -0.5, 0]} 
          castShadow
        >
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color={color} />
        </mesh>
        
        {/* Right Leg */}
        <mesh 
          ref={rightLegRef} 
          position={[0.15, -0.5, 0]} 
          castShadow
        >
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      
      {/* Player name label */}
      <Html position={[0, 1, 0]} center distanceFactor={10}>
        <div className="bg-black/50 px-2 py-1 text-white text-sm rounded whitespace-nowrap">
          {player.name} 
          <span className="ml-1 text-xs">
            Lv.{player.stats.level} {player.class}
          </span>
          
          {/* Health bar */}
          <div className="w-full bg-gray-700 h-1 mt-1 rounded-sm overflow-hidden">
            <div 
              className="bg-red-500 h-full" 
              style={{ 
                width: `${(player.stats.health / player.stats.maxHealth) * 100}%` 
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}