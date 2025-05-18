import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterClass } from '@shared/types';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { useAudio } from '@/lib/stores/useAudio';

// Define outside the component to avoid re-creation
const classColors = {
  [CharacterClass.Warrior]: '#ff5555',
  [CharacterClass.Mage]: '#5555ff',
  [CharacterClass.Archer]: '#55ff55',
};

export function Character() {
  const characterRef = useRef<THREE.Group>(null);
  const { character } = useCharacter();
  const { showDebug } = useMMOGame();
  const { playHit } = useAudio();
  
  // Animation time reference
  const time = useRef(0);
  
  // Update animation time in useFrame
  useFrame((state, delta) => {
    time.current += delta;
  });
  
  // Skip rendering if character is not created yet
  if (!character) return null;
  
  // Get character color based on class
  const characterColor = classColors[character.class];
  
  // Create articulated character model
  return (
    <group 
      ref={characterRef}
      position={[character.position.x, character.position.y, character.position.z]}
      rotation={[0, character.rotation, 0]}
    >
      {/* Character torso - color based on class */}
      <mesh castShadow receiveShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[0.8, 0.9, 0.4]} />
        <meshStandardMaterial color={characterColor} />
      </mesh>
      
      {/* Character hip */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.6, 0.25, 0.35]} />
        <meshStandardMaterial color={characterColor} />
      </mesh>
      
      {/* Character head */}
      <mesh castShadow position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#f9c9b6" />
      </mesh>
      
      {/* Character eyes */}
      <mesh position={[0.12, 1.85, 0.30]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.12, 1.85, 0.30]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      {/* Left arm (animated) */}
      <group position={[0.45, 1.35, 0]} rotation={[
        0, 
        0, 
        character.moving ? Math.sin(time.current * 5) * 0.4 : 0
      ]}>
        {/* Upper arm */}
        <mesh castShadow receiveShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[0.2, 0.5, 0.2]} />
          <meshStandardMaterial color={characterColor} />
        </mesh>
        
        {/* Lower arm */}
        <group position={[0, -0.5, 0]} rotation={[
          character.moving ? Math.sin(time.current * 5 + 0.5) * 0.3 : 0,
          0, 
          0
        ]}>
          <mesh castShadow receiveShadow position={[0, -0.25, 0]}>
            <boxGeometry args={[0.18, 0.5, 0.18]} />
            <meshStandardMaterial color="#f9c9b6" />
          </mesh>
          
          {/* Hand */}
          <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
            <boxGeometry args={[0.2, 0.15, 0.15]} />
            <meshStandardMaterial color="#f9c9b6" />
          </mesh>
        </group>
      </group>
      
      {/* Right arm (animated) */}
      <group position={[-0.45, 1.35, 0]} rotation={[
        0, 
        0, 
        character.moving ? -Math.sin(time.current * 5) * 0.4 : 0
      ]}>
        {/* Upper arm */}
        <mesh castShadow receiveShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[0.2, 0.5, 0.2]} />
          <meshStandardMaterial color={characterColor} />
        </mesh>
        
        {/* Lower arm */}
        <group position={[0, -0.5, 0]} rotation={[
          character.moving ? Math.sin(time.current * 5 + 0.5) * 0.3 : 0,
          0, 
          0
        ]}>
          <mesh castShadow receiveShadow position={[0, -0.25, 0]}>
            <boxGeometry args={[0.18, 0.5, 0.18]} />
            <meshStandardMaterial color="#f9c9b6" />
          </mesh>
          
          {/* Hand */}
          <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
            <boxGeometry args={[0.2, 0.15, 0.15]} />
            <meshStandardMaterial color="#f9c9b6" />
          </mesh>
        </group>
      </group>
      
      {/* Left leg (animated) */}
      <group position={[0.2, 0.5, 0]} rotation={[
        character.moving ? -Math.sin(time.current * 5) * 0.5 : 0,
        0, 
        0
      ]}>
        {/* Upper leg */}
        <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.25, 0.6, 0.25]} />
          <meshStandardMaterial color="#5555aa" />
        </mesh>
        
        {/* Lower leg */}
        <group position={[0, -0.6, 0]} rotation={[
          character.moving ? Math.sin(time.current * 5 + 1) * 0.5 : 0,
          0, 
          0
        ]}>
          <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
            <boxGeometry args={[0.22, 0.6, 0.22]} />
            <meshStandardMaterial color="#5555aa" />
          </mesh>
          
          {/* Foot */}
          <mesh castShadow receiveShadow position={[0, -0.6, 0.1]}>
            <boxGeometry args={[0.25, 0.15, 0.45]} />
            <meshStandardMaterial color="#444444" />
          </mesh>
        </group>
      </group>
      
      {/* Right leg (animated) */}
      <group position={[-0.2, 0.5, 0]} rotation={[
        character.moving ? Math.sin(time.current * 5) * 0.5 : 0,
        0, 
        0
      ]}>
        {/* Upper leg */}
        <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.25, 0.6, 0.25]} />
          <meshStandardMaterial color="#5555aa" />
        </mesh>
        
        {/* Lower leg */}
        <group position={[0, -0.6, 0]} rotation={[
          character.moving ? -Math.sin(time.current * 5 + 1) * 0.5 : 0,
          0, 
          0
        ]}>
          <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
            <boxGeometry args={[0.22, 0.6, 0.22]} />
            <meshStandardMaterial color="#5555aa" />
          </mesh>
          
          {/* Foot */}
          <mesh castShadow receiveShadow position={[0, -0.6, 0.1]}>
            <boxGeometry args={[0.25, 0.15, 0.45]} />
            <meshStandardMaterial color="#444444" />
          </mesh>
        </group>
      </group>
      
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
      
      {/* Enhanced attack animation with weapon swing */}
      {character.attacking && (
        <>
          {/* Attack effect */}
          <group position={[1, 1.5, 0]}>
            <mesh>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={1.0} />
            </mesh>
            <pointLight 
              intensity={2} 
              distance={4} 
              color="#ff6600" 
              decay={2}
            />
          </group>
          
          {/* Attack arc */}
          <group position={[0.8, 1.2, 0.5]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <torusGeometry args={[0.6, 0.05, 8, 8, Math.PI / 1.5]} />
              <meshStandardMaterial color="#ff9900" emissive="#ff6600" emissiveIntensity={0.8} transparent opacity={0.7} />
            </mesh>
          </group>
        </>
      )}
      
      {/* Debugging position display */}
      {showDebug && (
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
      
      {/* Player name - Temporarily removing HTML component until fixed */}
      {/* Will implement proper name display in next update */}
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
