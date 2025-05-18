// This file would contain world data, NPC spawns, loot tables, etc.
// For this example, we'll keep it simple

// Map boundaries
export const MAP_BOUNDS = {
  minX: -50,
  maxX: 50,
  minZ: -50,
  maxZ: 50
};

// NPC spawn points
export const NPC_SPAWNS = [
  { x: 15, y: 0, z: 15, type: 'enemy', level: 1 },
  { x: -15, y: 0, z: -15, type: 'enemy', level: 2 },
  { x: 15, y: 0, z: -15, type: 'enemy', level: 1 },
  { x: -15, y: 0, z: 15, type: 'enemy', level: 2 },
];

// Collision objects
export const COLLISION_OBJECTS = [
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

// Item drops by enemy level
export const ITEM_DROPS = {
  1: [
    { id: 'sword1', name: 'Rusty Sword', type: 'weapon', value: 10, dropRate: 0.2 },
    { id: 'potion1', name: 'Small Health Potion', type: 'potion', value: 5, dropRate: 0.5 }
  ],
  2: [
    { id: 'sword2', name: 'Steel Sword', type: 'weapon', value: 20, dropRate: 0.1 },
    { id: 'armor1', name: 'Leather Armor', type: 'armor', value: 15, dropRate: 0.2 },
    { id: 'potion2', name: 'Medium Health Potion', type: 'potion', value: 10, dropRate: 0.4 }
  ]
};

// Respawn point
export const RESPAWN_POINT = { x: 0, y: 0, z: 0 };
