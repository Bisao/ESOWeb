import { useFrame } from '@react-three/fiber';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { Position } from '@shared/types';

// Simple box-based collision boundaries
const COLLISION_OBJECTS = [
  // Border walls
  { min: [-51, -5, -51], max: [51, 10, -49] }, // North wall
  { min: [-51, -5, 49], max: [51, 10, 51] },   // South wall
  { min: [49, -5, -51], max: [51, 10, 51] },   // East wall
  { min: [-51, -5, -51], max: [-49, 10, 51] }, // West wall
  
  // Central building
  { min: [-5, -1, -5], max: [5, 5, 5] },
  
  // Small buildings
  { min: [-18, -1, 7], max: [-12, 3, 13] },
  { min: [12, -1, 7], max: [18, 3, 13] },
  { min: [12, -1, -13], max: [18, 3, -7] },
  { min: [-18, -1, -13], max: [-12, 3, -7] },
  
  // Water area - can't walk on water
  { min: [22.5, -5, 22.5], max: [37.5, 0, 37.5] },
];

// Collision detection radius for character
const CHARACTER_RADIUS = 0.75;

export function CollisionSystem() {
  const { character, updatePosition } = useCharacter();
  const { otherPlayers } = useMultiplayer();
  
  // Check collisions every frame
  useFrame(() => {
    if (!character) return;
    
    // Store current position
    const currentPos = { ...character.position };
    let newPos = { ...currentPos };
    
    // Check collisions with static objects
    for (const obj of COLLISION_OBJECTS) {
      // Simple AABB collision detection with player radius
      if (
        newPos.x + CHARACTER_RADIUS > obj.min[0] && 
        newPos.x - CHARACTER_RADIUS < obj.max[0] &&
        newPos.y > obj.min[1] && 
        newPos.y < obj.max[1] &&
        newPos.z + CHARACTER_RADIUS > obj.min[2] && 
        newPos.z - CHARACTER_RADIUS < obj.max[2]
      ) {
        // Collision detected - resolve by pushing back
        // Find closest edge to push back to
        const edges = [
          { dist: Math.abs(newPos.x - obj.min[0] - CHARACTER_RADIUS), pos: { ...newPos, x: obj.min[0] - CHARACTER_RADIUS } },
          { dist: Math.abs(newPos.x - obj.max[0] + CHARACTER_RADIUS), pos: { ...newPos, x: obj.max[0] + CHARACTER_RADIUS } },
          { dist: Math.abs(newPos.z - obj.min[2] - CHARACTER_RADIUS), pos: { ...newPos, z: obj.min[2] - CHARACTER_RADIUS } },
          { dist: Math.abs(newPos.z - obj.max[2] + CHARACTER_RADIUS), pos: { ...newPos, z: obj.max[2] + CHARACTER_RADIUS } },
        ];
        
        // Find nearest edge
        edges.sort((a, b) => a.dist - b.dist);
        newPos = edges[0].pos;
      }
    }
    
    // Check collisions with other players
    for (const playerId in otherPlayers) {
      const otherPlayer = otherPlayers[playerId];
      
      // Calculate distance to other player
      const dx = newPos.x - otherPlayer.position.x;
      const dz = newPos.z - otherPlayer.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // If too close (less than twice the character radius)
      if (distance < CHARACTER_RADIUS * 2) {
        // Move away from other player
        const pushDistance = CHARACTER_RADIUS * 2 - distance;
        const angle = Math.atan2(dx, dz);
        
        newPos.x += Math.sin(angle) * pushDistance;
        newPos.z += Math.cos(angle) * pushDistance;
      }
    }
    
    // Check for map boundaries - additional safety check
    const MAP_SIZE = 50;
    newPos.x = Math.max(-MAP_SIZE + CHARACTER_RADIUS, Math.min(MAP_SIZE - CHARACTER_RADIUS, newPos.x));
    newPos.z = Math.max(-MAP_SIZE + CHARACTER_RADIUS, Math.min(MAP_SIZE - CHARACTER_RADIUS, newPos.z));
    
    // Update position if it changed
    if (
      newPos.x !== currentPos.x ||
      newPos.y !== currentPos.y ||
      newPos.z !== currentPos.z
    ) {
      updatePosition(newPos);
    }
  });
  
  return null;
}
