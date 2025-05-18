import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCharacter } from '@/lib/stores/useCharacter';
import { Position } from '@shared/types';

interface EnemyProps {
  position: [number, number, number];
}

export function Enemy({ position }: EnemyProps) {
  const enemyRef = useRef<THREE.Group>(null);
  const [enemyPos, setEnemyPos] = useState<Position>({
    x: position[0],
    y: position[1],
    z: position[2]
  });
  const [rotation, setRotation] = useState(0);
  const [health, setHealth] = useState(100);
  const [isAggressive, setIsAggressive] = useState(false);
  
  // Target position for wandering
  const targetRef = useRef<Position>({
    x: position[0],
    y: position[1],
    z: position[2]
  });
  
  const { character } = useCharacter();
  
  // Enemy AI behavior
  useFrame((state, delta) => {
    if (!enemyRef.current || !character) return;
    
    // Calculate distance to player
    const distanceToPlayer = Math.sqrt(
      Math.pow(character.position.x - enemyPos.x, 2) +
      Math.pow(character.position.z - enemyPos.z, 2)
    );
    
    // Set aggression based on proximity
    const aggroRange = 10;
    const newAggressive = distanceToPlayer < aggroRange;
    
    if (newAggressive !== isAggressive) {
      setIsAggressive(newAggressive);
    }
    
    // Move logic
    if (isAggressive) {
      // Move toward player if aggressive
      const angleToPlayer = Math.atan2(
        character.position.x - enemyPos.x,
        character.position.z - enemyPos.z
      );
      
      // Update rotation to face player
      setRotation(angleToPlayer);
      
      // Move toward player
      const moveSpeed = 2 * delta;
      setEnemyPos({
        x: enemyPos.x + Math.sin(angleToPlayer) * moveSpeed,
        y: enemyPos.y,
        z: enemyPos.z + Math.cos(angleToPlayer) * moveSpeed
      });
    } else {
      // Random wandering behavior
      const distanceToTarget = Math.sqrt(
        Math.pow(targetRef.current.x - enemyPos.x, 2) +
        Math.pow(targetRef.current.z - enemyPos.z, 2)
      );
      
      // If close to target or no target, set a new random target
      if (distanceToTarget < 1) {
        // Set a new random target within range of spawn
        const wanderRadius = 5;
        const randomAngle = Math.random() * Math.PI * 2;
        const randomDistance = Math.random() * wanderRadius;
        
        targetRef.current = {
          x: position[0] + Math.sin(randomAngle) * randomDistance,
          y: position[1],
          z: position[2] + Math.cos(randomAngle) * randomDistance
        };
      }
      
      // Move toward current target
      const angleToTarget = Math.atan2(
        targetRef.current.x - enemyPos.x,
        targetRef.current.z - enemyPos.z
      );
      
      // Update rotation to face target
      setRotation(angleToTarget);
      
      // Move toward target
      const moveSpeed = 1 * delta;
      setEnemyPos({
        x: enemyPos.x + Math.sin(angleToTarget) * moveSpeed,
        y: enemyPos.y,
        z: enemyPos.z + Math.cos(angleToTarget) * moveSpeed
      });
    }
  });
  
  // Set new random target on a timer for natural wandering
  useEffect(() => {
    if (isAggressive) return;
    
    const interval = setInterval(() => {
      const wanderRadius = 5;
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = Math.random() * wanderRadius;
      
      targetRef.current = {
        x: position[0] + Math.sin(randomAngle) * randomDistance,
        y: position[1],
        z: position[2] + Math.cos(randomAngle) * randomDistance
      };
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAggressive, position]);
  
  return (
    <group 
      ref={enemyRef}
      position={[enemyPos.x, enemyPos.y, enemyPos.z]}
      rotation={[0, rotation, 0]}
    >
      {/* Enemy body */}
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <boxGeometry args={[1.2, 2, 0.6]} />
        <meshStandardMaterial color={isAggressive ? "#aa0000" : "#884400"} />
      </mesh>
      
      {/* Enemy head */}
      <mesh castShadow position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#553300" />
      </mesh>
      
      {/* Health bar */}
      <HealthBar health={health} isActive={isAggressive} />
    </group>
  );
}

// Health bar floating above enemy
function HealthBar({ health, isActive }: { health: number, isActive: boolean }) {
  const healthPercent = health / 100;
  
  return (
    <group position={[0, 3, 0]}>
      {/* Background */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.2, 0.1]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Health fill */}
      <mesh position={[(healthPercent - 1) * 0.6, 0, 0.05]}>
        <boxGeometry args={[1.2 * healthPercent, 0.15, 0.1]} />
        <meshBasicMaterial color={isActive ? "#ff0000" : "#00aa00"} />
      </mesh>
    </group>
  );
}
