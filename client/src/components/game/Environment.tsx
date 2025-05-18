import { useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function Environment() {
  const terrainRef = useRef<THREE.Mesh>(null);
  
  // Load textures
  const grassTexture = useTexture('/textures/grass.png');
  
  // Configure texture repeat
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(30, 30);
  
  return (
    <group>
      {/* Ground plane */}
      <mesh
        ref={terrainRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          map={grassTexture}
          roughness={0.8}
        />
      </mesh>
      
      {/* Surrounding objects */}
      <group>
        {/* Generate trees */}
        <TreeGroup count={20} radius={40} />
        
        {/* Generate rocks */}
        <RockGroup count={15} radius={35} />
        
        {/* Central area structures */}
        <Building position={[0, 0, 0]} size={[10, 5, 10]} />
        
        {/* Add some small buildings */}
        <Building position={[-15, 0, 10]} size={[6, 3, 6]} />
        <Building position={[15, 0, 10]} size={[6, 3, 6]} />
        <Building position={[15, 0, -10]} size={[6, 3, 6]} />
        <Building position={[-15, 0, -10]} size={[6, 3, 6]} />
        
        {/* Add some water */}
        <WaterArea position={[30, 0, 30]} size={[15, 15]} />
        
        {/* Add border walls */}
        <BorderWalls size={100} height={5} />
      </group>
    </group>
  );
}

// Building component
function Building({ position, size }: { position: [number, number, number], size: [number, number, number] }) {
  const woodTexture = useTexture('/textures/wood.jpg');
  woodTexture.repeat.set(2, 2);
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  
  // Building dimensions
  const [width, height, depth] = size;
  
  return (
    <group position={position}>
      {/* Main building structure */}
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial map={woodTexture} color="#a87d50" />
      </mesh>
      
      {/* Roof */}
      <mesh castShadow receiveShadow position={[0, height + 1, 0]}>
        <coneGeometry args={[width * 0.7, 2, 4]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Door */}
      <mesh castShadow receiveShadow position={[0, height / 4, depth / 2 + 0.01]}>
        <boxGeometry args={[width / 4, height / 2, 0.1]} />
        <meshStandardMaterial color="#4a2700" />
      </mesh>
      
      {/* Windows */}
      <mesh castShadow receiveShadow position={[width / 3, height / 1.5, depth / 2 + 0.01]}>
        <boxGeometry args={[width / 6, height / 6, 0.1]} />
        <meshStandardMaterial color="#87ceeb" />
      </mesh>
      
      <mesh castShadow receiveShadow position={[-width / 3, height / 1.5, depth / 2 + 0.01]}>
        <boxGeometry args={[width / 6, height / 6, 0.1]} />
        <meshStandardMaterial color="#87ceeb" />
      </mesh>
    </group>
  );
}

// Group of trees
function TreeGroup({ count, radius }: { count: number, radius: number }) {
  // Pre-calculate random positions for trees
  const treePositions = Array.from({ length: count }).map(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius * 0.8 + radius * 0.2; // Not too close to center
    return [
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    ] as [number, number, number];
  });
  
  return (
    <group>
      {treePositions.map((position, index) => (
        <Tree key={`tree-${index}`} position={position} />
      ))}
    </group>
  );
}

// Single tree
function Tree({ position }: { position: [number, number, number] }) {
  const trunkHeight = 1 + Math.random() * 2; // Random height
  const trunkRadius = 0.2 + Math.random() * 0.3; // Random thickness
  
  return (
    <group position={position}>
      {/* Tree trunk */}
      <mesh castShadow receiveShadow position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[trunkRadius, trunkRadius * 1.2, trunkHeight, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Tree foliage */}
      <mesh castShadow receiveShadow position={[0, trunkHeight + 1, 0]}>
        <coneGeometry args={[2, 4, 8]} />
        <meshStandardMaterial color="#2e8b57" />
      </mesh>
    </group>
  );
}

// Group of rocks
function RockGroup({ count, radius }: { count: number, radius: number }) {
  // Pre-calculate random positions for rocks
  const rockPositions = Array.from({ length: count }).map(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius * 0.8 + radius * 0.2;
    return [
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    ] as [number, number, number];
  });
  
  return (
    <group>
      {rockPositions.map((position, index) => (
        <Rock key={`rock-${index}`} position={position} />
      ))}
    </group>
  );
}

// Single rock
function Rock({ position }: { position: [number, number, number] }) {
  const scale = 0.5 + Math.random() * 1.5; // Random size
  
  return (
    <mesh 
      castShadow 
      receiveShadow 
      position={position} 
      scale={[scale, scale, scale]}
      rotation={[Math.random(), Math.random(), Math.random()]}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#888888" roughness={0.8} />
    </mesh>
  );
}

// Water area
function WaterArea({ position, size }: { position: [number, number, number], size: [number, number] }) {
  const [width, depth] = size;
  
  return (
    <mesh 
      receiveShadow 
      position={[position[0], position[1] - 0.2, position[2]]} 
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial 
        color="#4a80b3" 
        transparent 
        opacity={0.7} 
        metalness={0.2}
        roughness={0.1}
      />
    </mesh>
  );
}

// Border walls around the map
function BorderWalls({ size, height }: { size: number, height: number }) {
  const halfSize = size / 2;
  const wallThickness = 1;
  
  return (
    <group>
      {/* North wall */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, height / 2, -halfSize]} 
      >
        <boxGeometry args={[size, height, wallThickness]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      
      {/* South wall */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, height / 2, halfSize]} 
      >
        <boxGeometry args={[size, height, wallThickness]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      
      {/* East wall */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[halfSize, height / 2, 0]} 
      >
        <boxGeometry args={[wallThickness, height, size]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      
      {/* West wall */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[-halfSize, height / 2, 0]} 
      >
        <boxGeometry args={[wallThickness, height, size]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    </group>
  );
}
