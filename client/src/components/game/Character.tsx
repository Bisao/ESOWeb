import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CharacterClass } from '@shared/types';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { useAudio } from '@/lib/stores/useAudio';

export function Character() {
  const characterRef = useRef<THREE.Group>(null);
  const { character } = useCharacter();
  const { cameraType, showDebug } = useMMOGame();
  const { playHit } = useAudio();
  const { viewport } = useThree();
  
  // Skip rendering if character is not created yet
  if (!character) return null;
  
  // Different colors for character classes
  const classColors = {
    [CharacterClass.Warrior]: '#ff5555',
    [CharacterClass.Mage]: '#5555ff',
    [CharacterClass.Archer]: '#55ff55',
  };
  
  // Get character color based on class
  const characterColor = classColors[character.class];
  
  // Create simple character model
  return (
    <group 
      ref={characterRef}
      position={[character.position.x, character.position.y, character.position.z]}
      rotation={[0, character.rotation, 0]}
    >
      {/* Character body - color based on class */}
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color={characterColor} />
      </mesh>
      
      {/* Character head */}
      <mesh castShadow position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#f9c9b6" />
      </mesh>
      
      {/* Class-specific item */}
      {character.class === CharacterClass.Warrior && (
        <group position={[0, 1, 0.5]}>
          {/* Sword */}
          <mesh castShadow position={[0.5, 0, 0.5]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.1, 1.5, 0.1]} />
            <meshStandardMaterial color="#aaaaaa" />
          </mesh>
          <mesh castShadow position={[0.5, 0.6, 0.5]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshStandardMaterial color="#aaaaaa" />
          </mesh>
        </group>
      )}
      
      {character.class === CharacterClass.Mage && (
        <group position={[0, 1, 0.5]}>
          {/* Staff */}
          <mesh castShadow position={[0.5, 0, 0.5]}>
            <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh castShadow position={[0.5, 1, 0.5]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#55aaff" emissive="#3366ff" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}
      
      {character.class === CharacterClass.Archer && (
        <group position={[0, 1, 0.5]}>
          {/* Bow */}
          <mesh castShadow position={[0.5, 0, 0.5]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.5, 0.05, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[0.5, 0, 0.5]}>
            <cylinderGeometry args={[0.01, 0.01, 1, 8]} />
            <meshStandardMaterial color="#aaaaaa" />
          </mesh>
        </group>
      )}
      
      {/* Attack animation */}
      {character.attacking && (
        <group position={[1, 1.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}
      
      {/* Debugging position display */}
      {showDebug && (
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
      
      {/* Player name */}
      <Html position={[0, 3, 0]} center distanceFactor={10}>
        <div className="player-name">{character.name}</div>
      </Html>
    </group>
  );
}

// HTML component for character name
function Html({ children, position, center, distanceFactor }: any) {
  const { camera } = useThree();
  const ref = useRef<HTMLDivElement>(null);
  
  useFrame(() => {
    if (ref.current) {
      // Position the HTML element relative to the 3D position
      const worldPos = new THREE.Vector3(...position);
      const screenPos = worldPos.project(camera);
      
      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;
      
      ref.current.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      
      // Scale based on distance
      const distanceScale = Math.min(1, 10 / camera.position.distanceTo(worldPos));
      ref.current.style.fontSize = `${distanceScale * 1}rem`;
      
      // Hide when behind camera
      ref.current.style.opacity = screenPos.z > 1 ? '0' : '1';
    }
  });
  
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '1rem',
        fontWeight: 'bold',
        textShadow: '0 0 5px #000',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      {children}
    </div>
  );
}
